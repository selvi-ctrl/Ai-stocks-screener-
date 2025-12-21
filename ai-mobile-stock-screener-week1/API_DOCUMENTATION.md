# Stock Data Automation - API Documentation

## 🔄 Automated Scheduler

The system automatically refreshes stock data every 30 minutes during market hours (9 AM - 4 PM IST, Mon-Fri).

### Scheduler Endpoints

#### Get Scheduler Status
```http
GET /api/scheduler/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": false,
    "lastRun": "2025-12-16T10:30:00.000Z",
    "lastSuccess": "2025-12-16T10:30:00.000Z",
    "lastError": null,
    "runCount": 5,
    "errorCount": 0,
    "isMarketHours": true,
    "nextRun": "Next 30-minute interval during market hours"
  }
}
```

#### Manual Trigger (Admin)
```http
POST /api/scheduler/trigger
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Manual data ingestion completed successfully"
  }
}
```

---

## 📈 Real-Time Stock Data API

### Get Single Stock Quote
```http
GET /api/stocks/quote/:symbol
```

**Example:** `GET /api/stocks/quote/AAPL`

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 196.45,
    "previousClose": 195.20,
    "change": 1.25,
    "changePercent": 0.64,
    "dayHigh": 197.30,
    "dayLow": 195.80,
    "volume": 45678900,
    "marketCap": 3040000000000,
    "fiftyTwoWeekHigh": 199.62,
    "fiftyTwoWeekLow": 164.08,
    "timestamp": "2025-12-16T12:00:00.000Z"
  }
}
```

### Get Multiple Stock Quotes
```http
GET /api/stocks/quotes?symbols=AAPL,GOOGL,MSFT
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "price": 196.45,
      "change": 1.25,
      "changePercent": 0.64,
      "volume": 45678900
    },
    {
      "symbol": "GOOGL",
      "name": "Alphabet Inc.",
      "price": 142.30,
      "change": -0.50,
      "changePercent": -0.35,
      "volume": 23456780
    }
  ],
  "timestamp": "2025-12-16T12:00:00.000Z"
}
```

### Get Historical Data
```http
GET /api/stocks/historical/:symbol?period1=2025-11-16&period2=2025-12-16&interval=1d
```

**Parameters:**
- `period1` - Start date (default: 30 days ago)
- `period2` - End date (default: today)
- `interval` - Data interval: `1d`, `1wk`, `1mo` (default: `1d`)

**Example:** `GET /api/stocks/historical/AAPL?interval=1d`

### Search Stocks
```http
GET /api/stocks/search/:query
```

**Example:** `GET /api/stocks/search/apple`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "AAPL",
      "shortname": "Apple Inc.",
      "exchange": "NMS",
      "quoteType": "EQUITY"
    }
  ],
  "timestamp": "2025-12-16T12:00:00.000Z"
}
```

### Get Stocks from Database
```http
GET /api/stocks/db?limit=50&offset=0
```

**Parameters:**
- `limit` - Number of records (default: 50)
- `offset` - Pagination offset (default: 0)

### Get Specific Stock from Database
```http
GET /api/stocks/db/:symbol
```

**Example:** `GET /api/stocks/db/AAPL`

### API Status Check
```http
GET /api/stocks/status
```

**Response:**
```json
{
  "success": true,
  "status": "operational",
  "database": {
    "connected": true,
    "stockCount": 150
  },
  "binanceAPI": {
    "status": "OK"
  },
  "timestamp": "2025-12-16T12:00:00.000Z"
}
```

---

## 🚀 Quick Start

### Start the Server
```bash
cd backend
npm install
npm start
```

### Test Scheduler
```bash
# Check scheduler status
curl http://localhost:3000/api/scheduler/status

# Manual trigger (testing)
curl -X POST http://localhost:3000/api/scheduler/trigger
```

### Test Stock API
```bash
# Get Apple stock quote
curl http://localhost:3000/api/stocks/quote/BTCUSDT

# Get multiple quotes
curl "http://localhost:3000/api/stocks/quotes?symbols=BTCUSDT,ETHUSDT,BNBUSDT"

# Check API status
curl http://localhost:3000/api/stocks/status
```

---

## ⚙️ Configuration

### Environment Variables
Create `.env` file in backend directory:
```env
PORT=3000
POSTGRES_USER=shivansh
POSTGRES_PASSWORD=pass
POSTGRES_DB=stocks
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

### Scheduler Settings
- **Schedule:** Every 30 minutes
- **Market Hours:** 9 AM - 4 PM IST
- **Active Days:** Monday - Friday
- **Script:** `scripts/ingest_yfinance.py` (Binance data)

---

## 📊 Logging

All scheduler operations are logged with timestamps:
```
[2025-12-16T10:00:00.000Z] Starting data ingestion...
[2025-12-16T10:02:30.000Z] Data ingestion completed successfully
[2025-12-16T10:30:00.000Z] Outside market hours - skipping data ingestion
```

---

## 🛠️ Error Handling

All endpoints include comprehensive error handling:
- Invalid parameters return 400 Bad Request
- Missing resources return 404 Not Found
- API failures return 500 Internal Server Error
- All errors include descriptive messages

**Error Response Format:**
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message"
}
```
