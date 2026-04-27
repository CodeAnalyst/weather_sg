import os
import sqlite3
from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from app.services.weather_api import SingaporeWeatherClient, WeatherProviderError, DailySummary, calculate_daily_summary

router = APIRouter(prefix="/locations", tags=["locations"])

DB_PATH = os.getenv("DATABASE_PATH", "weather.db")


def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con


def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    weather = {
        "condition": d.pop("weather_condition", None),
        "observed_at": d.pop("weather_observed_at", None),
        "source": d.pop("weather_source", None),
        "area": d.pop("weather_area", None),
        "valid_period_text": d.pop("weather_valid_period_text", None),
    }
    d.pop("weather_refreshed_at", None)
    d["weather"] = weather

    # Current conditions
    current_conditions = {
        "temperature": d.pop("temperature", None),
        "humidity": d.pop("humidity", None),
        "rainfall": d.pop("rainfall", None),
        "wind_speed": d.pop("wind_speed", None),
        "wind_direction": d.pop("wind_direction", None),
        "temperature_observed_at": d.pop("temperature_observed_at", None),
        "humidity_observed_at": d.pop("humidity_observed_at", None),
        "rainfall_observed_at": d.pop("rainfall_observed_at", None),
        "wind_speed_observed_at": d.pop("wind_speed_observed_at", None),
        "wind_direction_observed_at": d.pop("wind_direction_observed_at", None),
    }
    d["current_conditions"] = current_conditions
    return d


@router.get("")
def list_locations():
    con = get_db()
    rows = con.execute(
        "SELECT * FROM locations ORDER BY created_at DESC, id DESC"
    ).fetchall()
    con.close()
    return {"locations": [row_to_dict(row) for row in rows]}


@router.post("", status_code=status.HTTP_201_CREATED)
def create_location(payload: dict):
    latitude = payload.get("latitude")
    longitude = payload.get("longitude")

    if latitude is None or longitude is None:
        raise HTTPException(status_code=422, detail="latitude and longitude are required")
    if not (1.1 <= latitude <= 1.5 and 103.6 <= longitude <= 104.1):
        raise HTTPException(
            status_code=422,
            detail="Coordinates must be within Singapore (lat 1.1–1.5, lon 103.6–104.1)",
        )

    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")
    con = get_db()
    try:
        cursor = con.execute(
            """INSERT INTO locations (latitude, longitude, created_at, weather_condition, weather_source)
               VALUES (?, ?, ?, 'Not refreshed', 'not-refreshed')""",
            (latitude, longitude, now),
        )
        con.commit()
        row = con.execute("SELECT * FROM locations WHERE id = ?", (cursor.lastrowid,)).fetchone()
    except sqlite3.IntegrityError:
        con.close()
        raise HTTPException(status_code=409, detail="Location already exists") from None
    con.close()
    return row_to_dict(row)


@router.get("/{location_id}")
def get_location(location_id: int):
    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return row_to_dict(row)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_location(location_id: int):
    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    if row is None:
        con.close()
        raise HTTPException(status_code=404, detail="Location not found")
    con.execute("DELETE FROM locations WHERE id = ?", (location_id,))
    con.commit()
    con.close()


@router.get("/areas")
def get_areas():
    """Get all Singapore forecast areas from the weather API."""
    api_key = os.getenv("WEATHER_API_KEY")
    client = SingaporeWeatherClient(api_key=api_key)

    try:
        payload = client.fetch_latest_forecast_payload()
        
        # Debug: print the payload structure
        import json
        print(f"Payload type: {type(payload)}")
        print(f"Payload keys: {payload.keys() if isinstance(payload, dict) else 'N/A'}")
        
        # Handle different possible response structures
        area_metadata = []
        
        if isinstance(payload, dict):
            # Try different paths to find area_metadata
            area_metadata = payload.get("area_metadata", [])
            if not area_metadata:
                data = payload.get("data")
                if isinstance(data, dict):
                    area_metadata = data.get("area_metadata", [])
                elif isinstance(data, list):
                    # Maybe area_metadata is in a different structure
                    for item in data:
                        if isinstance(item, dict) and "area_metadata" in item:
                            area_metadata = item.get("area_metadata", [])
                            break
        
        areas = [
            {
                "name": area.get("name"),
                "latitude": area.get("label_location", {}).get("latitude"),
                "longitude": area.get("label_location", {}).get("longitude"),
            }
            for area in area_metadata
            if area.get("name") and area.get("label_location")
        ]
        return {"areas": areas}
    except WeatherProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/{location_id}/refresh")
def refresh_location(location_id: int):
    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    if row is None:
        con.close()
        raise HTTPException(status_code=404, detail="Location not found")

    api_key = os.getenv("WEATHER_API_KEY")
    client = SingaporeWeatherClient(api_key=api_key)
    latitude = row["latitude"]
    longitude = row["longitude"]
    now = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%S")

    try:
        # Get forecast
        snapshot = client.get_current_weather(latitude=latitude, longitude=longitude)

        # Get current conditions
        temperature_data = client.fetch_air_temperature()
        humidity_data = client.fetch_relative_humidity()
        rainfall_data = client.fetch_rainfall()
        wind_speed_data = client.fetch_wind_speed()
        wind_direction_data = client.fetch_wind_direction()

        # Find nearest station readings
        temperature_reading = client.get_nearest_station_reading(
            temperature_data.get("data", {}).get("readings", []), latitude, longitude
        )
        humidity_reading = client.get_nearest_station_reading(
            humidity_data.get("data", {}).get("readings", []), latitude, longitude
        )
        rainfall_reading = client.get_nearest_station_reading(
            rainfall_data.get("data", {}).get("readings", []), latitude, longitude
        )
        wind_speed_reading = client.get_nearest_station_reading(
            wind_speed_data.get("data", {}).get("readings", []), latitude, longitude
        )
        wind_direction_reading = client.get_nearest_station_reading(
            wind_direction_data.get("data", {}).get("readings", []), latitude, longitude
        )

        # Extract values
        temperature = temperature_reading.get("value") if temperature_reading else None
        humidity = humidity_reading.get("value") if humidity_reading else None
        rainfall = rainfall_reading.get("value") if rainfall_reading else None
        wind_speed = wind_speed_reading.get("value") if wind_speed_reading else None
        wind_direction = wind_direction_reading.get("value") if wind_direction_reading else None

        # Extract timestamps
        temp_observed = temperature_reading.get("timestamp") if temperature_reading else None
        humidity_observed = humidity_reading.get("timestamp") if humidity_reading else None
        rainfall_observed = rainfall_reading.get("timestamp") if rainfall_reading else None
        wind_speed_observed = wind_speed_reading.get("timestamp") if wind_speed_reading else None
        wind_direction_observed = wind_direction_reading.get("timestamp") if wind_direction_reading else None

        # Update database
        con.execute(
            """UPDATE locations
               SET weather_condition = ?, weather_observed_at = ?, weather_source = ?,
                   weather_area = ?, weather_valid_period_text = ?, weather_refreshed_at = ?,
                   temperature = ?, humidity = ?, rainfall = ?, wind_speed = ?, wind_direction = ?,
                   temperature_observed_at = ?, humidity_observed_at = ?, rainfall_observed_at = ?,
                   wind_speed_observed_at = ?, wind_direction_observed_at = ?
               WHERE id = ?""",
            (
                snapshot["condition"],
                snapshot["observed_at"],
                snapshot["source"],
                snapshot["area"],
                snapshot["valid_period_text"],
                now,
                temperature,
                humidity,
                rainfall,
                wind_speed,
                wind_direction,
                temp_observed,
                humidity_observed,
                rainfall_observed,
                wind_speed_observed,
                wind_direction_observed,
                location_id,
            ),
        )
        
        # Save reading to historical readings table
        con.execute(
            """INSERT INTO readings (location_id, created_at, weather_condition, temperature, humidity, rainfall, wind_speed, wind_direction)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                location_id,
                now,
                snapshot["condition"],
                temperature,
                humidity,
                rainfall,
                wind_speed,
                wind_direction,
            ),
        )
        
        con.commit()
    except WeatherProviderError as exc:
        con.close()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()
    return row_to_dict(row)


@router.get("/{location_id}/forecast")
def get_location_forecast(location_id: int):
    """Get hourly (24h) and 4-day forecast for a location."""
    con = get_db()
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    con.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Location not found")

    api_key = os.getenv("WEATHER_API_KEY")
    client = SingaporeWeatherClient(api_key=api_key)

    try:
        # Fetch forecasts
        forecast_24h = client.fetch_24_hour_forecast()
        forecast_4d = client.fetch_4_day_forecast()

        # Parse 24-hour forecast (periods: morning, afternoon, night)
        periods_24h = []
        if isinstance(forecast_24h, dict):
            items = forecast_24h.get("items", [])
            if items:
                first_item = items[0]
                periods = first_item.get("periods", [])
                for period in periods:
                    periods_24h.append({
                        "period": period.get("period"),
                        "forecast": period.get("forecast"),
                        "temperature": period.get("temperature"),
                    })

        # Parse 4-day forecast (days with high/low temp and outlook)
        days_4d = []
        if isinstance(forecast_4d, dict):
            items = forecast_4d.get("items", [])
            if items:
                first_item = items[0]
                forecasts = first_item.get("forecasts", [])
                for day_forecast in forecasts:
                    days_4d.append({
                        "day": day_forecast.get("day"),
                        "date": day_forecast.get("date"),
                        "outlook": day_forecast.get("outlook"),
                        "temperature_high": day_forecast.get("temperature", {}).get("high"),
                        "temperature_low": day_forecast.get("temperature", {}).get("low"),
                        "humidity": day_forecast.get("humidity"),
                    })

        return {
            "location_id": location_id,
            "hourly_24h": periods_24h,
            "daily_4day": days_4d,
        }
    except WeatherProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/{location_id}/readings")
def get_location_readings(location_id: int):
    """Get historical readings for a location."""
    con = get_db()
    
    # Check if location exists
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    if row is None:
        con.close()
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Get readings (limit to 50 most recent for performance)
    rows = con.execute(
        """SELECT * FROM readings 
           WHERE location_id = ? 
           ORDER BY created_at DESC 
           LIMIT 50""",
        (location_id,)
    ).fetchall()
    con.close()
    
    readings = [
        {
            "id": r["id"],
            "created_at": r["created_at"],
            "weather_condition": r["weather_condition"],
            "temperature": r["temperature"],
            "humidity": r["humidity"],
            "rainfall": r["rainfall"],
            "wind_speed": r["wind_speed"],
            "wind_direction": r["wind_direction"],
        }
        for r in rows
    ]
    
    return {"readings": readings}


@router.get("/{location_id}/summary")
def get_location_summary(location_id: int):
    """Get daily summary for a location with trend analysis."""
    con = get_db()
    
    # Check if location exists
    row = con.execute("SELECT * FROM locations WHERE id = ?", (location_id,)).fetchone()
    if row is None:
        con.close()
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Get all readings for this location
    all_readings = con.execute(
        """SELECT * FROM readings 
           WHERE location_id = ? 
           ORDER BY created_at DESC""",
        (location_id,)
    ).fetchall()
    con.close()
    
    # Calculate today's summary
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    
    # Group readings by date
    readings_by_date = {}
    for r in all_readings:
        date = r["created_at"][:10]  # Extract YYYY-MM-DD
        if date not in readings_by_date:
            readings_by_date[date] = []
        readings_by_date[date].append({
            "id": r["id"],
            "created_at": r["created_at"],
            "weather_condition": r["weather_condition"],
            "temperature": r["temperature"],
            "humidity": r["humidity"],
            "rainfall": r["rainfall"],
            "wind_speed": r["wind_speed"],
            "wind_direction": r["wind_direction"],
        })
    
    # Calculate today's summary
    today_readings = readings_by_date.get(today, [])
    
    if not today_readings:
        # Return empty summary if no readings today
        return {
            "location_id": location_id,
            "date": today,
            "summary": {
                "temperature_min": None,
                "temperature_max": None,
                "temperature_avg": None,
                "humidity_min": None,
                "humidity_max": None,
                "humidity_avg": None,
                "rainfall_total": 0.0,
                "rainfall_count": 0,
                "wind_speed_avg": None,
                "wind_direction_avg": None,
                "condition_most_common": "No data",
                "reading_count": 0
            },
            "trends": {}
        }
    
    # Calculate summary using SingaporeWeatherClient method
    summary = SingaporeWeatherClient.calculate_daily_summary(today_readings, location_id, today)
    
    # Calculate trends (compare today's avg to 7-day average)
    trends = {}
    recent_readings = []
    for date, readings in readings_by_date.items():
        if date != today and len(readings_by_date) - len(readings_by_date.keys() - {today}) < 8:
            recent_readings.extend(readings)
    
    if recent_readings:
        recent_summary = SingaporeWeatherClient.calculate_daily_summary(recent_readings, location_id, "7day_avg")
        
        if summary.temperature_avg and recent_summary.temperature_avg:
            trends["temperature"] = SingaporeWeatherClient.get_daily_trend(
                summary.temperature_avg, recent_summary.temperature_avg
            )
        
        if summary.humidity_avg and recent_summary.humidity_avg:
            trends["humidity"] = SingaporeWeatherClient.get_daily_trend(
                summary.humidity_avg, recent_summary.humidity_avg
            )
        
        if summary.wind_speed_avg and recent_summary.wind_speed_avg:
            trends["wind"] = SingaporeWeatherClient.get_daily_trend(
                summary.wind_speed_avg, recent_summary.wind_speed_avg
            )
    
    return {
        "location_id": location_id,
        "date": today,
        "summary": {
            "temperature_min": summary.temperature_min,
            "temperature_max": summary.temperature_max,
            "temperature_avg": summary.temperature_avg,
            "humidity_min": summary.humidity_min,
            "humidity_max": summary.humidity_max,
            "humidity_avg": summary.humidity_avg,
            "rainfall_total": summary.rainfall_total,
            "rainfall_count": summary.rainfall_count,
            "wind_speed_avg": summary.wind_speed_avg,
            "wind_direction_avg": summary.wind_direction_avg,
            "condition_most_common": summary.condition_most_common,
            "reading_count": summary.reading_count
        },
        "trends": trends
    }
