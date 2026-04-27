import os
import sqlite3

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from app.routers.locations import router as locations_router  # noqa: E402

DB_PATH = os.getenv("DATABASE_PATH", "weather.db")


def init_db():
    con = sqlite3.connect(DB_PATH)
    
    # Locations table (keeps latest weather data)
    con.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            created_at TEXT NOT NULL,
            weather_condition TEXT,
            weather_observed_at TEXT,
            weather_source TEXT,
            weather_area TEXT,
            weather_valid_period_text TEXT,
            weather_refreshed_at TEXT,
            temperature REAL,
            humidity REAL,
            rainfall REAL,
            wind_speed REAL,
            wind_direction REAL,
            temperature_observed_at TEXT,
            humidity_observed_at TEXT,
            rainfall_observed_at TEXT,
            wind_speed_observed_at TEXT,
            wind_direction_observed_at TEXT,
            UNIQUE(latitude, longitude)
        )
    """)
    
    # Readings table (stores historical data for charts)
    con.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            weather_condition TEXT,
            temperature REAL,
            humidity REAL,
            rainfall REAL,
            wind_speed REAL,
            wind_direction REAL,
            FOREIGN KEY (location_id) REFERENCES locations(id)
        )
    """)
    
    con.commit()
    con.close()


init_db()

app = FastAPI(
    title="Weather Starter",
    description="Minimal weather API starter with data.gov.sg integration",
    version="0.1.0",
)

app.include_router(locations_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
