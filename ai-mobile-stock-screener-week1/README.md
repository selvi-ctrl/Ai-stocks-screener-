# AI-Powered Mobile Stock Screener - Week 1

## Project Overview
This project is an AI-powered mobile stock screener that includes a backend built with Node.js and Express, a PostgreSQL database, and a simple frontend for user authentication. The application allows users to register, log in, and access stock data.

## Project Structure
```
ai-mobile-stock-screener-week1
├── docker-compose.yml
├── db
│   └── schema.sql
├── backend
│   ├── package.json
│   ├── index.js
│   ├── db.js
│   ├── routes
│   │   ├── auth.js
│   │   └── parse.js
│   └── .env.example
├── frontend
│   ├── login.html
│   └── fetch-jwt.js
├── scripts
│   ├── ingest_yfinance.py
│   └── explore_and_clean_dataset.py
├── .github
│   └── workflows
│       └── node-ci.yml
└── README.md
```

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed on your machine.
- Python 3.x installed for running the ingestion and data cleaning scripts.
- Node.js and npm installed for running the backend.

### Running the Application

1. **Start the Docker containers:**
   Run the following command in the project root directory:
   ```
   docker-compose up -d
   ```

2. **Apply the database schema:**
   You can apply the schema using `psql` or pgAdmin. If using `psql`, run:
   ```
   psql -U sparshika -d stocks -f db/schema.sql
   ```

3. **Run the backend:**
   Navigate to the backend directory and install dependencies:
   ```
   cd backend
   npm install
   npm run dev
   ```

4. **Run the ingestion script:**
   Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```
   Then run the ingestion script:
   ```
   python scripts/ingest_yfinance.py
   ```

5. **Run the dataset exploration and cleaning script:**
   To explore and clean a dataset, run:
   ```
   python scripts/explore_and_clean_dataset.py <path_to_your_csv_file>
   ```

6. **Open the login page:**
   Open `frontend/login.html` in your web browser to access the login page. Enter your credentials to log in and obtain a JWT.

### Environment Variables
Create a `.env` file in the backend directory based on the `.env.example` file. Set the following variables:
- `PORT`: The port on which the backend server will run (default is 3000).
- `DATABASE_URL`: The connection string for the PostgreSQL database.
- `JWT_SECRET`: A secret key for signing JWT tokens.

## Notes
- Ensure that the PostgreSQL service is running before starting the backend.
- The ingestion script fetches stock data for specific NSE IT symbols and populates the database.
- The exploration script provides insights into the dataset and performs necessary cleaning steps.

## CI/CD
The project includes a GitHub Actions workflow for continuous integration. It installs dependencies and runs linting for the backend on pushes to the `dev` and `main` branches.

## License
This project is licensed under the MIT License.