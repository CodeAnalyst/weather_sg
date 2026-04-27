# Daily Summary Command Plan

## Status: COMPLETED ✅

## Goal
Add a CLI command that generates and displays a daily weather summary for tracked locations, showing key metrics (temperature, humidity, rainfall, wind) with visual indicators and historical context.

## Files to Change

### Backend (`backend/`)
1. **`app/routers/locations.py`**
   - Add new `GET /api/locations/{id}/summary` endpoint
   - Calculate daily summary from location data
   - Include historical readings for trend analysis

2. **`app/services/weather_api.py`**
   - Add `calculate_daily_summary()` method
   - Add `get_daily_trend()` helper for comparing current vs historical

### Frontend (`frontend/src/`)
3. **`api/locations.js`**
   - Add `getLocationSummary(locationId)` function

4. **`components/LocationDetail.jsx`** (or new component)
   - Display daily summary card with key metrics
   - Add trend indicators (↑/↓ arrows)
   - Visual temperature bar
   - Weather condition icon

5. **`pages/Dashboard.jsx`**
   - Add "Daily Summary" view/panel
   - Show all locations' summaries in list view

## Constraints
- API rate limits from data.gov.sg (only call when necessary)
- Must work with existing SQLite database schema
- Should handle locations without recent readings gracefully
- UI must be consistent with existing Tailwind styling

## Implementation Summary

### Backend Changes (Completed)
1. **`app/services/weather_api.py`**
   - Added `DailySummary` dataclass for structured summary data
   - Added `calculate_daily_summary()` method to compute daily metrics
   - Added `get_daily_trend()` helper for comparing current vs historical values

2. **`app/routers/locations.py`**
   - Added `GET /api/locations/{id}/summary` endpoint
   - Returns daily summary with trends for temperature, humidity, and wind

### Frontend Changes (Completed)
3. **`api/locations.js`**
   - Added `getSummary(locationId)` API function

4. **`components/LocationDetail.jsx`**
   - Added Daily Summary card with 4 key metrics
   - Trend indicators (↑/↓/→) with color coding
   - Shows temperature, humidity, rainfall, and wind data

5. **`components/LocationSummary.jsx`** (New)
   - Standalone summary component using react-query
   - Auto-refresh every minute

### Features Implemented
- Daily weather summary with key metrics
- Trend analysis with visual indicators
- Comparison against 7-day historical average
- Responsive layout with Tailwind CSS
- Auto-refresh every minute

## Open Questions
1. Should the summary include 24-hour forecast or just current/historical data?
2. How many historical readings should be shown (e.g., last 7 days)?
3. Should the summary be automatically generated on refresh, or user-triggered?
4. Should location averages be cached or computed on-demand?
5. What specific metrics should be highlighted (e.g., feels-like temp, UV index)?
