import { useState, useEffect } from 'react';
import { getForecast } from '../api/locations';

export function ForecastDisplay({ locationId }) {
  const [forecast, setForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadForecast = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getForecast(locationId);
        setForecast(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadForecast();
  }, [locationId]);

  if (isLoading) return <p className="text-sm text-slate-500">Loading forecast...</p>;
  if (error) return <p className="text-sm text-red-600">Failed to load forecast</p>;
  if (!forecast) return null;

  return (
    <div className="mt-4 grid gap-4">
      {/* Hourly 24h Forecast */}
      {forecast.hourly_24h && forecast.hourly_24h.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-slate-700">24-Hour Forecast</h4>
          <div className="mt-2 overflow-x-auto">
            <div className="flex gap-3 min-w-max">
              {forecast.hourly_24h.map((period, idx) => (
                <div key={idx} className="flex min-w-[80px] flex-col items-center rounded bg-slate-50 p-2">
                  <span className="text-xs font-medium text-slate-700">{period.period || `Period ${idx + 1}`}</span>
                  <span className="mt-1 text-center text-sm">{period.forecast}</span>
                  {period.temperature && (
                    <span className="mt-1 text-xs text-slate-600">
                      {period.temperature.min}°C - {period.temperature.max}°C
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4-Day Forecast */}
      {forecast.daily_4day && forecast.daily_4day.length > 0 && (
        <section>
          <h4 className="text-sm font-semibold text-slate-700">4-Day Forecast</h4>
          <div className="mt-2 grid gap-2">
            {forecast.daily_4day.map((day, idx) => (
              <div key={idx} className="flex items-center justify-between rounded bg-slate-50 p-2">
                <div className="flex w-1/3 items-center">
                  <span className="w-16 font-medium text-slate-700">{day.day || `Day ${idx + 1}`}</span>
                  <span className="text-xs text-slate-500">{day.date}</span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-2">
                  <span className="text-sm text-slate-700">{day.outlook}</span>
                </div>
                <div className="w-24 text-right">
                  {day.temperature_high && day.temperature_low && (
                    <span className="text-sm font-medium text-slate-700">
                      {day.temperature_low}°C - {day.temperature_high}°C
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}