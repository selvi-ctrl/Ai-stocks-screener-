import os
from datetime import datetime
from functools import lru_cache

import psycopg2
import requests
from psycopg2 import sql

# Database connection parameters
DB_USER = os.getenv('POSTGRES_USER', 'Shivansh')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'pass')
DB_NAME = os.getenv('POSTGRES_DB', 'stocks')
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')

# Connect to the PostgreSQL database
def connect_db():
    return psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )


BINANCE_API_BASE = "https://api.binance.com"


@lru_cache(maxsize=1)
def get_exchange_info():
    resp = requests.get(f"{BINANCE_API_BASE}/api/v3/exchangeInfo", timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return {s["symbol"]: s for s in data.get("symbols", [])}


def fetch_latest_kline(symbol: str):
    resp = requests.get(
        f"{BINANCE_API_BASE}/api/v3/klines",
        params={"symbol": symbol.upper(), "interval": "1d", "limit": 1},
        timeout=10,
    )
    resp.raise_for_status()
    klines = resp.json()
    return klines[0] if klines else None


def ensure_company(cursor, symbol: str, name: str) -> int:
    cursor.execute(
        sql.SQL(
            """
            INSERT INTO companies (symbol, name)
            VALUES (%s, %s)
            ON CONFLICT (symbol) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            """
        ),
        [symbol, name],
    )
    return cursor.fetchone()[0]


def upsert_price_snapshot(cursor, company_id: int, snapshot_date, kline_row):
    # Remove existing snapshot for the same day to keep one record per symbol/date
    cursor.execute(
        "DELETE FROM price_snapshots WHERE company_id = %s AND snapshot_date = %s",
        [company_id, snapshot_date],
    )

    cursor.execute(
        sql.SQL(
            """
            INSERT INTO price_snapshots (
                company_id, snapshot_date, open_price, close_price, high_price, low_price, volume
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
        ),
        [
            company_id,
            snapshot_date,
            float(kline_row[1]),
            float(kline_row[4]),
            float(kline_row[2]),
            float(kline_row[3]),
            float(kline_row[5]),
        ],
    )


def ingest_binance(symbols):
    info_map = get_exchange_info()
    conn = connect_db()
    cursor = conn.cursor()

    for symbol in symbols:
        meta = info_map.get(symbol.upper())
        if not meta:
            print(f"Skipping unknown symbol: {symbol}")
            continue

        kline = fetch_latest_kline(symbol)
        if not kline:
            print(f"No kline data returned for {symbol}")
            continue

        company_id = ensure_company(cursor, symbol.upper(), f"{meta['baseAsset']}/{meta['quoteAsset']}")
        snapshot_date = datetime.utcfromtimestamp(kline[0] / 1000).date()
        upsert_price_snapshot(cursor, company_id, snapshot_date, kline)

    conn.commit()
    cursor.close()
    conn.close()


if __name__ == "__main__":
    symbols_env = os.getenv("BINANCE_SYMBOLS", "BTCUSDT,ETHUSDT,BNBUSDT")
    symbols = [s.strip().upper() for s in symbols_env.split(",") if s.strip()]
    ingest_binance(symbols)
    print("Binance data ingestion completed.")