# AI Stock Screener - Quick Start Guide

## Prerequisites Installed?
- Docker Desktop (for PostgreSQL database)
- Node.js (for backend server)
- Python 3.x (for data ingestion scripts)

---

## 🚀 START THE APPLICATION

### Step 1: Start PostgreSQL Database
```powershell
docker-compose up -d
```

Wait 10-15 seconds for the database to initialize.

### Step 2: Apply Database Schema
```powershell
docker exec -i ai-mobile-stock-screener-week1-db-1 psql -U Sparshika -d stocks < db/schema.sql
```

If the container name is different, find it with:
```powershell
docker ps
```

### Step 3: Install Backend Dependencies
```powershell
cd backend
npm install
```

### Step 4: Start Backend Server
```powershell
npm run dev
```

The server will start at http://localhost:3000

### Step 5: Open the Application
Open your browser and go to:
```
http://localhost:3000/login.html
```

---

## 📝 FIRST TIME USER REGISTRATION

To create a test account, use a tool like Postman or PowerShell:

```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

Then login at: http://localhost:3000/login.html
- Email: test@example.com
- Password: password123

---

## 🐍 OPTIONAL: Run Python Data Ingestion

### Install Python Dependencies:
```powershell
pip install -r requirements.txt
```

### Run the ingestion script:
```powershell
python scripts/ingest_yfinance.py
```

---

## 🛑 STOP THE APPLICATION

### Stop backend server:
Press `Ctrl+C` in the terminal running the backend

### Stop database:
```powershell
docker-compose down
```

---

## 🔧 TROUBLESHOOTING

**Database connection error?**
- Make sure Docker is running
- Wait 15-20 seconds after `docker-compose up -d`
- Check: `docker ps` to see if container is running

**Port 3000 already in use?**
- Change PORT in backend/.env file
- Or stop the other application using port 3000

**Login not working?**
- Make sure you created a user account first (see registration above)
- Check browser console for errors (F12)

---

## ✅ YOU'RE ALL SET!

Your AI Stock Screener is now running locally.
