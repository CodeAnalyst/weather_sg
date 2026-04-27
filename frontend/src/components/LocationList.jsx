import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocations, useRefreshLocation, useDeleteLocation } from '../hooks/useLocations.jsx';
import { ForecastDisplay } from './ForecastDisplay';
import { WeatherIcon } from './WeatherIcon';

// Weather condition colors for cards
function getCardColor(condition) {
  if (condition?.includes('Rain') || condition?.includes('Showers')) return 'card-rainy';
  if (condition?.includes('Clear')) return 'card-sunny';
  if (condition?.includes('Cloudy')) return 'card-cloudy';
  return 'card-cloudy';
}

export function LocationList() {
  const [expandedLocation, setExpandedLocation] = useState(null);
  const { locations, isLoading, error } = useLocations();
  const { refresh, isPending, refreshingId, error: refreshError } = useRefreshLocation();
  const { del, isPending: deletePending, deletingId, error: deleteError } = useDeleteLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 animate-fade-in">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-sky-600 rounded-full"></div>
          </div>
        </div>
        <span className="ml-4 text-slate-600 font-medium">Loading locations...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="inline-block p-4 rounded-full bg-red-100 mb-3">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-red-600 font-medium">{error.message}</p>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in glass-panel rounded-3xl border-2 border-dashed border-sky-200/50">
        <div className="inline-block p-6 rounded-full bg-sky-50/50 mb-4">
          <svg className="w-16 h-16 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Locations Yet</h3>
        <p className="text-slate-600 max-w-sm mx-auto mb-6">Start tracking Singapore weather by adding your first location below.</p>
        <button
          onClick={() => document.querySelector('input[placeholder="Type to search Singapore areas..."]')?.focus()}
          className="glass-button px-8 py-3"
        >
          Add Location
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 animate-slide-in">
      {locations.map((location) => (
        <article 
          key={location.id} 
          className={`glass-panel rounded-3xl p-6 sm:p-8 shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border border-white/40 ${getCardColor(location.weather.condition)}`}
        >
          <header className="flex flex-wrap items-start justify-between gap-6 mb-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex-shrink-0">
                  <WeatherIcon condition={location.weather.condition} size="lg" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {location.weather.area || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Updated: {location.weather.observed_at ? new Date(location.weather.observed_at).toLocaleTimeString() : 'Not refreshed'}</span>
              </div>
            </div>
          </header>

          {/* Weather condition and validity */}
          <div className="mb-6 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/30">
            <p className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {location.weather.condition}
            </p>
            {location.weather.valid_period_text && (
              <p className="text-sm text-slate-500 mt-2">{location.weather.valid_period_text}</p>
            )}
            <p className="text-xs text-slate-400 mt-3 text-right">Source: {location.weather.source}</p>
          </div>

          {/* Current conditions grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {location.current_conditions?.temperature != null && (
              <div className="rounded-xl bg-gradient-to-br from-white/80 to-white/40 p-4 text-center border border-white/30 hover:shadow-lg transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Temperature</p>
                <p className="text-3xl font-bold text-slate-800">{location.current_conditions.temperature}°C</p>
              </div>
            )}
            {location.current_conditions?.humidity != null && (
              <div className="rounded-xl bg-gradient-to-br from-white/80 to-white/40 p-4 text-center border border-white/30 hover:shadow-lg transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Humidity</p>
                <p className="text-3xl font-bold text-slate-800">{location.current_conditions.humidity}%</p>
              </div>
            )}
            {location.current_conditions?.rainfall != null && (
              <div className="rounded-xl bg-gradient-to-br from-white/80 to-white/40 p-4 text-center border border-white/30 hover:shadow-lg transition-all">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Rainfall</p>
                <p className="text-3xl font-bold text-slate-800">{location.current_conditions.rainfall} mm</p>
              </div>
            )}
          </div>

          {/* Wind info */}
          {location.current_conditions?.wind_speed != null && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-white/60 to-white/40 border border-white/30">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Wind</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-slate-800">{location.current_conditions.wind_speed} km/h</p>
                    {location.current_conditions.wind_direction != null && (
                      <span className="text-sm text-slate-500">from {location.current_conditions.wind_direction}°</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast toggle button */}
          <button
            onClick={() => setExpandedLocation(expandedLocation === location.id ? null : location.id)}
            className="w-full mb-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {expandedLocation === location.id ? 'Hide Forecast Details' : 'Show 24-Hour & 4-Day Forecast'}
          </button>

          {expandedLocation === location.id && <ForecastDisplay locationId={location.id} />}

          {/* Action buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => refresh(location.id)}
              disabled={isPending}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending && refreshingId === location.id ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
            <button
              onClick={() => del(location.id)}
              disabled={deletePending}
              className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-4 py-3 font-semibold text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {deletePending && deletingId === location.id ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-1a1 1 0 00-1 1v6H4a1 1 0 00-1 1v1a1 1 0 001 1h2a1 1 0 001-1v-1h12a1 1 0 001-1V4a1 1 0 00-1-1h-1z" />
                  </svg>
                  Delete
                </>
              )}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
