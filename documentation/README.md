# Weather Starter Project - Architecture & Setup Summary

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python 3.11, FastAPI, SQLite (built-in), httpx |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Map** | Leaflet 1.9.4, React Leaflet 5.0.0 |
| **Charts** | Recharts 3.8.1 |
| **API** | Singapore data.gov.sg (api-open.data.gov.sg) |
| **Dev Env** | uv (Python), npm (Node.js) |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                                  │
│                  http://localhost:5173                              │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                         │
│                  Port 5173 - React Components                        │
│  - Dashboard.jsx  - Geo.jsx  - LocationForm.jsx                    │
│  - LocationList.jsx - LocationDetail.jsx - WeatherMap.jsx          │
│  - WeatherIcon.jsx                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ /api/* requests
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                               │
│                  Port 8000 - REST API                                │
│  - app/main.py (FastAPI + DB init)                                 │
│  - app/routers/locations.py (CRUD + refresh)                       │
│  - app/services/weather_api.py (data.gov.sg client)                │
└─────────────────────────────────────────────────────────────────────┘
                                     │
               ┌─────────────────────┴─────────────────────┐
               ▼                                           ▼
    ┌───────────────────┐                       ┌──────────────────────┐
    │   SQLite DB       │                       │   External API       │
    │   weather.db      │                       │   data.gov.sg        │
    │                   │                       │   api-open.data.gov.sg│
    │ - locations table │                       │   (real-time weather) │
    │ - readings table  │                       │                      │
    └───────────────────┘                       └──────────────────────┘
```

## Setup Steps Completed

### Initial Setup
1. **Cloned repository**: `git clone https://github.com/AISG-AIAP/weather_starter.git`
2. **Backend setup**:
   - Installed dependencies via `uv sync` in backend/
   - Backend runs on port 8000 with FastAPI
3. **Frontend setup**:
   - Installed dependencies via `npm install` in frontend/
   - Frontend runs on port 5173 with Vite

### Data.gov.sg API Integration
4. **Implemented weather API client** in `weather_api.py`:
   - Fetch 2-hour forecast
   - Fetch air temperature readings
   - Fetch relative humidity readings
   - Fetch rainfall readings
   - Fetch wind speed readings
   - Fetch wind direction readings
   - Fetch 24-hour forecast
   - Fetch 4-day forecast

### Geo View Implementation
5. **Added Leaflet map with OpenStreetMap tiles**:
   - Implemented Heat layer using temperature data
   - Implemented AQI layer using PSI data
   - Implemented Rain layer with falling raindrop animation
   - Implemented Wind layer with animated arrows

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/locations | List all locations |
| POST | /api/locations | Create a location |
| GET | /api/locations/:id | Get single location |
| DELETE | /api/locations/:id | Delete location |
| POST | /api/locations/:id/refresh | Refresh weather data |
| GET | /api/locations/:id/forecast | Get 24h + 4-day forecast |
| GET | /api/locations/:id/readings | Get historical readings |
| GET | /api/locations/areas | Get Singapore forecast areas |

## Frontend Components

| Component | File | Description |
|-----------|------|-------------|
| Dashboard | pages/Dashboard.jsx | Main dashboard page with location form and list |
| Geo | pages/Geo.jsx | Full-screen map view with layers |
| LocationForm | components/LocationForm.jsx | Form to add new locations |
| LocationList | components/LocationList.jsx | List of tracked locations |
| LocationDetail | components/LocationDetail.jsx | Detail view for a location |
| WeatherMap | components/WeatherMap.jsx | Map component |
| WeatherIcon | components/WeatherIcon.jsx | Weather condition icon |

## Current Features

- **Add a location** - Enter latitude and longitude within Singapore
- **List locations** - View all tracked locations with latest weather
- **Refresh weather** - Fetch latest weather data from API
- **Delete location** - Remove tracked locations
- **Geo View** - Full-screen map with OpenStreetMap tiles
- **Heat Layer** - Temperature visualization from data.gov.sg
- **AQI Layer** - PSI data visualization from data.gov.sg
- **Rain Layer** - Rainfall visualization with animation
- **Wind Layer** - Wind flow visualization with animated arrows
- **Hourly Forecast** - 24-hour weather forecast
- **4-Day Forecast** - 4-day outlook with temperature ranges
- **Historical Readings** - Track weather history over time

## Running the Project

```bash
# Start backend (in backend/)
uv sync
uv run uvicorn app.main:app --reload --port 8000

# Start frontend (in frontend/)
npm run dev -- --host 127.0.0.1 --port 5173
```

## External API Reference

All endpoints on `https://api-open.data.gov.sg`:

| Endpoint | Description |
|----------|-------------|
| `/v2/real-time/api/two-hr-forecast` | 2-hour weather forecast |
| `/v2/real-time/api/air-temperature` | Current temperature readings |
| `/v2/real-time/api/relative-humidity` | Current humidity readings |
| `/v2/real-time/api/rainfall` | Current rainfall readings |
| `/v2/real-time/api/wind-speed` | Current wind speed readings |
| `/v2/real-time/api/wind-direction` | Current wind direction readings |
| `/v1/environment/24-hour-weather-forecast` | 24-hour forecast |
| `/v1/environment/4-day-weather-forecast` | 4-day forecast |