import os
import yfinance as yf
import psycopg2
from psycopg2 import sql

# Database connection parameters
DB_USER = os.getenv('POSTGRES_USER', 'shivansh')
DB_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'pass')
DB_NAME = os.getenv('POSTGRES_DB', 'stocks')
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')

# Connect to the PostgreSQL database
def connect_db():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    return conn

# Upsert companies and fundamentals into the database
def upsert_data(symbols):
    conn = connect_db()
    cursor = conn.cursor()

    for symbol in symbols:
        stock = yf.Ticker(symbol)
        info = stock.info

        # Upsert company data
        cursor.execute(
            sql.SQL("INSERT INTO companies (symbol, name) VALUES (%s, %s) ON CONFLICT (symbol) DO NOTHING"),
            [symbol, info.get('longName')]
        )

        # Upsert fundamentals data
        fundamentals = {
            'symbol': symbol,
            'debtToFcf': info.get('debtToFcf'),
            'marketCap': info.get('marketCap'),
            'trailingPE': info.get('trailingPE'),
            'forwardPE': info.get('forwardPE')
        }
        cursor.execute(
            sql.SQL("""
                INSERT INTO fundamentals (symbol, debt_to_fcf, market_cap, trailing_pe, forward_pe)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (symbol) DO UPDATE SET
                    debt_to_fcf = EXCLUDED.debt_to_fcf,
                    market_cap = EXCLUDED.market_cap,
                    trailing_pe = EXCLUDED.trailing_pe,
                    forward_pe = EXCLUDED.forward_pe
            """),
            [fundamentals['symbol'], fundamentals['debtToFcf'], fundamentals['marketCap'], fundamentals['trailingPE'], fundamentals['forwardPE']]
        )

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    nse_symbols = ['INFY.NS', 'TCS.NS', 'WIPRO.NS']
    upsert_data(nse_symbols)
    print("Data ingestion completed.")