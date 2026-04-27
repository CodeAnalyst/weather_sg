from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import httpx


class WeatherProviderError(Exception):
    pass


@dataclass
class DailySummary:
    """Represents a daily weather summary for a location."""
    location_id: int
    date: str
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    temperature_avg: Optional[float] = None
    humidity_min: Optional[float] = None
    humidity_max: Optional[float] = None
    humidity_avg: Optional[float] = None
    rainfall_total: float = 0.0
    rainfall_count: int = 0
    wind_speed_avg: Optional[float] = None
    wind_direction_avg: Optional[float] = None
    condition_most_common: str = "Unknown"
    reading_count: int = 0


@dataclass
class SingaporeWeatherClient:
    base_url: str = "https://api-open.data.gov.sg"
    two_hour_path: str = "/v2/real-time/api/two-hr-forecast"
    timeout_seconds: float = 8.0
    user_agent: str = "weather-starter/0.1 (educational project)"
    api_key: str | None = None

    def fetch_latest_forecast_payload(self) -> dict:
        headers = {
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key

        with httpx.Client(timeout=self.timeout_seconds, headers=headers) as client:
            return self._fetch_json(client, f"{self.base_url}{self.two_hour_path}")

    def fetch_air_temperature(self) -> dict:
        """Fetch current air temperature readings."""
        return self._fetch_readings("/v2/real-time/api/air-temperature")

    def fetch_relative_humidity(self) -> dict:
        """Fetch current relative humidity readings."""
        return self._fetch_readings("/v2/real-time/api/relative-humidity")

    def fetch_rainfall(self) -> dict:
        """Fetch current rainfall readings."""
        return self._fetch_readings("/v2/real-time/api/rainfall")

    def fetch_wind_speed(self) -> dict:
        """Fetch current wind speed readings."""
        return self._fetch_readings("/v2/real-time/api/wind-speed")

    def fetch_wind_direction(self) -> dict:
        """Fetch current wind direction readings."""
        return self._fetch_readings("/v2/real-time/api/wind-direction")

    def fetch_24_hour_forecast(self) -> dict:
        """Fetch 24-hour weather forecast."""
        headers = {
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key

        with httpx.Client(timeout=self.timeout_seconds, headers=headers) as client:
            response = client.get(f"{self.base_url}/v1/environment/24-hour-weather-forecast")
            response.raise_for_status()
            return response.json()

    def fetch_4_day_forecast(self) -> dict:
        """Fetch 4-day weather forecast."""
        headers = {
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key

        with httpx.Client(timeout=self.timeout_seconds, headers=headers) as client:
            response = client.get(f"{self.base_url}/v1/environment/4-day-weather-forecast")
            response.raise_for_status()
            return response.json()

    def get_current_weather(self, latitude: float, longitude: float) -> dict:
        payload = self.fetch_latest_forecast_payload()
        return self.snapshot_from_payload(payload, latitude, longitude)

    def snapshot_from_payload(
        self, payload: dict, latitude: float, longitude: float
    ) -> dict:
        if isinstance(payload, dict) and payload.get("code") not in (None, 0):
            message = payload.get("errorMsg") or "Weather provider returned an error"
            raise WeatherProviderError(message)

        data = payload.get("data") if isinstance(payload, dict) else None
        root = data if isinstance(data, dict) else payload

        area_metadata = root.get("area_metadata", [])
        items = root.get("items", [])
        if not items:
            raise WeatherProviderError("Forecast response has no items")

        latest_item = items[0]
        forecasts = latest_item.get("forecasts", [])
        if not forecasts:
            raise WeatherProviderError("Forecast item has no area forecasts")

        forecast_by_area = {
            entry.get("area"): entry.get("forecast")
            for entry in forecasts
            if entry.get("area") and entry.get("forecast")
        }

        nearest_area = self._nearest_area_name(area_metadata, latitude, longitude)
        if nearest_area and nearest_area in forecast_by_area:
            area = nearest_area
            condition = forecast_by_area[nearest_area]
        else:
            fallback = forecasts[0]
            area = fallback.get("area")
            condition = fallback.get("forecast") or "Unknown"

        return {
            "condition": condition,
            "observed_at": latest_item.get("update_timestamp")
            or latest_item.get("timestamp")
            or "",
            "source": "api-open.data.gov.sg",
            "area": area,
            "valid_period_text": latest_item.get("valid_period", {}).get("text"),
        }

    def _fetch_readings(self, path: str) -> dict:
        """Fetch station readings from any of the current conditions endpoints."""
        headers = {
            "Accept": "application/json",
            "User-Agent": self.user_agent,
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key

        with httpx.Client(timeout=self.timeout_seconds, headers=headers) as client:
            return self._fetch_json(client, f"{self.base_url}{path}")

    def get_nearest_station_reading(
        self, readings: list[dict], latitude: float, longitude: float
    ) -> dict | None:
        """Find the nearest station reading to the given coordinates."""
        nearest: dict | None = None
        nearest_distance: float | None = None

        for reading in readings:
            station = reading.get("station", {})
            location = station.get("location", {})
            lat = location.get("latitude")
            lon = location.get("longitude")
            if lat is None or lon is None:
                continue

            delta = (float(lat) - latitude) ** 2 + (float(lon) - longitude) ** 2
            if nearest_distance is None or delta < nearest_distance:
                nearest_distance = delta
                nearest = reading

        return nearest

    @staticmethod
    def _fetch_json(client: httpx.Client, url: str) -> dict:
        try:
            response = client.get(url)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code
            if status_code == 429:
                raise WeatherProviderError(
                    "Weather provider rate limit reached (HTTP 429)"
                ) from exc
            if status_code in (401, 403):
                raise WeatherProviderError(
                    "Weather provider rejected request (check API key)"
                ) from exc
            raise WeatherProviderError(f"Weather provider returned HTTP {status_code}") from exc
        except httpx.HTTPError as exc:
            raise WeatherProviderError("Unable to reach weather provider") from exc

    @staticmethod
    def _nearest_area_name(
        area_metadata: list[dict], latitude: float, longitude: float
    ) -> str | None:
        nearest_name: str | None = None
        nearest_distance: float | None = None

        for area in area_metadata:
            label = area.get("label_location", {})
            lat = label.get("latitude")
            lon = label.get("longitude")
            name = area.get("name")
            if lat is None or lon is None or not name:
                continue

            delta = (float(lat) - latitude) ** 2 + (float(lon) - longitude) ** 2
            if nearest_distance is None or delta < nearest_distance:
                nearest_distance = delta
                nearest_name = name

        return nearest_name

    @staticmethod
    def calculate_daily_summary(readings: list[dict], location_id: int, date: str) -> DailySummary:
        """
        Calculate a daily summary from a list of weather readings.
        
        Args:
            readings: List of readings from the database
            location_id: ID of the location
            date: The date for this summary (YYYY-MM-DD)
        
        Returns:
            DailySummary dataclass with calculated metrics
        """
        if not readings:
            return DailySummary(
                location_id=location_id,
                date=date,
                condition_most_common="No data",
                reading_count=0
            )
        
        temperatures = []
        humidities = []
        rainfall_values = []
        wind_speeds = []
        wind_directions = []
        conditions = []
        
        for reading in readings:
            if reading.get("temperature") is not None:
                temperatures.append(reading["temperature"])
            if reading.get("humidity") is not None:
                humidities.append(reading["humidity"])
            if reading.get("rainfall") is not None:
                rainfall_values.append(reading["rainfall"])
            if reading.get("wind_speed") is not None:
                wind_speeds.append(reading["wind_speed"])
            if reading.get("wind_direction") is not None:
                wind_directions.append(reading["wind_direction"])
            if reading.get("weather_condition"):
                conditions.append(reading["weather_condition"])
        
        def avg(values):
            return sum(values) / len(values) if values else None
        
        condition_most_common = "Unknown"
        if conditions:
            condition_counts = {}
            for cond in conditions:
                condition_counts[cond] = condition_counts.get(cond, 0) + 1
            condition_most_common = max(condition_counts.keys(), key=lambda k: condition_counts[k])
        
        return DailySummary(
            location_id=location_id,
            date=date,
            temperature_min=min(temperatures) if temperatures else None,
            temperature_max=max(temperatures) if temperatures else None,
            temperature_avg=avg(temperatures),
            humidity_min=min(humidities) if humidities else None,
            humidity_max=max(humidities) if humidities else None,
            humidity_avg=avg(humidities),
            rainfall_total=sum(rainfall_values),
            rainfall_count=len([r for r in rainfall_values if r > 0]),
            wind_speed_avg=avg(wind_speeds),
            wind_direction_avg=avg(wind_directions) if wind_directions else None,
            condition_most_common=condition_most_common,
            reading_count=len(readings)
        )

    @staticmethod
    def get_daily_trend(current_value: float, historical_avg: Optional[float]) -> tuple[str, str]:
        """
        Determine the trend direction and color for a metric.
        
        Returns:
            Tuple of (direction_symbol, color_class)
        """
        if historical_avg is None:
            return ("", "text-slate-500")
        
        diff = current_value - historical_avg
        if diff > 2:
            return ("↑", "text-green-500")
        elif diff < -2:
            return ("↓", "text-red-500")
        else:
            return ("→", "text-slate-400")
