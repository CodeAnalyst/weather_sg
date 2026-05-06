# Test Cases Document

## Application: Weather Starter App (data.gov.sg API Integration)

---

## 1. Backend API Tests

### 1.1 Location Management

| Test ID | Endpoint | Method | Description | Input | Expected Output |
|---------|----------|--------|-------------|-------|-----------------|
| TC-LOC-001 | `/api/locations` | GET | List all locations | - | Returns 200 with locations array |
| TC-LOC-002 | `/api/locations` | POST | Create new location | `{latitude: 1.3521, longitude: 103.8198}` | Returns 201 with created location |
| TC-LOC-003 | `/api/locations` | POST | Invalid coordinates | `{latitude: 0.5, longitude: 100.0}` | Returns 422 validation error |
| TC-LOC-004 | `/api/locations/{id}` | GET | Get single location | id=1 | Returns 200 with location details |
| TC-LOC-005 | `/api/locations/{id}` | GET | Non-existent location | id=999 | Returns 404 |
| TC-LOC-006 | `/api/locations/{id}` | DELETE | Delete location | id=1 | Returns 204 |
| TC-LOC-007 | `/api/locations` | POST | Duplicate location | Same lat/lon as existing | Returns 409 conflict |

### 1.2 Refresh Endpoint

| Test ID | Endpoint | Method | Description | Input | Expected Output |
|---------|----------|--------|-------------|-------|-----------------|
| TC-REF-001 | `/api/locations/{id}/refresh` | POST | Refresh weather data | id=1 | Returns 200 with updated weather |
| TC-REF-002 | `/api/locations/{id}/refresh` | POST | Refresh non-existent | id=999 | Returns 404 |
| TC-REF-003 | `/api/locations/{id}/refresh` | POST | API unavailable | Network error | Returns 502 with error message |

### 1.3 Forecast Endpoints

| Test ID | Endpoint | Method | Description | Input | Expected Output |
|---------|----------|--------|-------------|-------|-----------------|
| TC-FOR-001 | `/api/locations/{id}/forecast` | GET | Get 24h and 4-day forecast | id=1 | Returns hourly and daily forecasts |
| TC-FOR-002 | `/api/locations/{id}/forecast` | GET | Non-existent location | id=999 | Returns 404 |

### 1.4 History Endpoints

| Test ID | Endpoint | Method | Description | Input | Expected Output |
|---------|----------|--------|-------------|-------|-----------------|
| TC-HIS-001 | `/api/locations/{id}/readings` | GET | Get historical readings | id=1 | Returns last 50 readings |
| TC-HIS-002 | `/api/locations/{id}/readings` | GET | No readings | id=3 (new location) | Returns empty array |
| TC-HIS-003 | `/api/locations/{id}/summary` | GET | Get daily summary | id=1 | Returns summary with trends |

---

## 2. Frontend Component Tests

### 2.1 LocationForm

| Test ID | Component | Description | Expected Behavior |
|---------|-----------|-------------|-------------------|
| TC-FRM-001 | LocationForm | Enter valid coordinates | Form validates and creates location |
| TC-FRM-002 | LocationForm | Enter invalid coordinates | Shows validation error |
| TC-FRM-003 | LocationForm | Submit form | Location appears in list |

### 2.2 LocationList

| Test ID | Component | Description | Expected Behavior |
|---------|-----------|-------------|-------------------|
| TC-LST-001 | LocationList | Display locations | Shows all saved locations |
| TC-LST-002 | LocationList | Empty state | Shows "No locations" message |

### 2.3 LocationSummary

| Test ID | Component | Description | Expected Behavior |
|---------|-----------|-------------|-------------------|
| TC-SUM-001 | LocationSummary | Show weather data | Displays condition, temperature, wind |
| TC-SUM-002 | LocationSummary | Missing data | Shows "No data" placeholders |

### 2.4 WeatherMap (Geo.jsx)

| Test ID | Component | Description | Expected Behavior |
|---------|-----------|-------------|-------------------|
| TC-MAP-001 | Geo | Load map | Displays OpenStreetMap tiles |
| TC-MAP-002 | Geo | Toggle heat layer | Heat layer adds/removes correctly |
| TC-MAP-003 | Geo | Toggle AQI layer | AQI layer adds/removes correctly |
| TC-MAP-004 | Geo | Toggle rain layer | Rain layer adds/removes correctly |
| TC-MAP-005 | Geo | Toggle wind layer | Wind layer adds/removes correctly |

---

## 3. Integration Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| TC-INT-001 | Complete user journey | 1. Create location<br>2. Refresh weather<br>3. View summary<br>4. Toggle map layers | All operations succeed |
| TC-INT-002 | Multi-location support | Create 3 locations, verify all appear | All locations tracked |
| TC-INT-003 | Historical data | Refresh same location 5 times, check readings | 5 readings stored |

---

## 4. API Response Schema Tests

### 4.1 Location Object Schema

| Field | Type | Required | Example |
|-------|------|----------|---------|
| id | integer | Yes | 1 |
| latitude | float | Yes | 1.3521 |
| longitude | float | Yes | 103.8198 |
| created_at | string | Yes | "2026-04-24T17:05:28" |
| weather | object | Yes | - |
| weather.condition | string | Yes | "Partly Cloudy" |
| weather.area | string | Yes | "Bukit Timah" |
| current_conditions | object | Yes | - |
| current_conditions.temperature | float | No | 32.5 |
| current_conditions.humidity | float | No | 75.0 |

### 4.2 Summary Response Schema

| Field | Type | Example |
|-------|------|---------|
| location_id | integer | 1 |
| date | string | "2026-04-25" |
| summary.temperature_avg | float | 31.5 |
| summary.rainfall_total | float | 0.0 |
| trends | object | {temperature: ["↑", "text-green-500"]} |

---

## 5. Error Handling Tests

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| TC-ERR-001 | Database connection failed | Returns 500 with error message |
| TC-ERR-002 | API rate limit reached | Returns 502 with "rate limit" message |
| TC-ERR-003 | Invalid API key | Returns 502 with authentication error |
| TC-ERR-004 | Malformed request body | Returns 422 with validation details |

---

## 6. Performance Tests

| Test ID | Scenario | Expected Threshold |
|---------|----------|-------------------|
| TC-PER-001 | List locations (100 entries) | Response < 500ms |
| TC-PER-002 | Refresh location with all APIs | Response < 10s |
| TC-PER-003 | Map initial load | Render < 2s |

---

## 7. Security Tests

| Test ID | Scenario | Expected Behavior |
|---------|----------|-------------------|
| TC-SEC-001 | SQL injection in coordinates | Query returns no rows (parameterized) |
| TC-SEC-002 | XSS in location data | Data rendered as text, not HTML |
| TC-SEC-003 | CORS configuration | Only localhost:5173 allowed |
| TC-SEC-004 | Missing auth header | No impact (public API) |

---

## Test Execution Notes

1. **Setup**: Ensure `backend/.env` has valid `DATABASE_PATH` and optional `WEATHER_API_KEY`
2. **Database**: Reset `backend/weather.db` before test suite
3. **Mock API**: For integration tests, consider using `vcr.py` or `nock` to record API responses
4. **Coverage**: Aim for 80%+ code coverage on backend