import { useQuery } from 'react-query';
import { getSummary } from '../api/locations';

const formatValue = (value, unit = '') => {
  if (value == null) return 'N/A';
  return unit ? `${value}${unit}` : `${value}`;
};

const TrendIndicator = ({ trend }) => {
  if (!trend) return null;
  const [symbol, colorClass] = trend;
  if (!symbol) return null;
  
  return (
    <span className={`text-xs font-semibold ${colorClass}`}>
      {symbol}
    </span>
  );
};

export function LocationSummary({ locationId }) {
  const { data, isLoading, error } = useQuery(
    ['summary', locationId],
    () => getSummary(locationId),
    { refetchInterval: 60000 } // Auto-refresh every minute
  );

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700">
        <div className="text-slate-400 text-center py-4">
          Unable to load daily summary
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const trends = data?.trends || {};

  const tempUnit = summary.temperature_avg != null ? '°C' : '';
  const humidityUnit = summary.humidity_avg != null ? '%' : '';
  const rainfallUnit = summary.rainfall_total != null ? 'mm' : '';
  const windUnit = summary.wind_speed_avg != null ? ' km/h' : '';

  return (
    <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-3 text-sm">
        Daily Summary
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Temperature */}
        <div className="bg-slate-700/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs">Temperature</span>
            <TrendIndicator trend={trends.temperature} />
          </div>
          <div className="text-amber-400 text-lg font-bold">
            {formatValue(summary.temperature_avg, tempUnit)}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Min: {formatValue(summary.temperature_min, tempUnit)} | 
            Max: {formatValue(summary.temperature_max, tempUnit)}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-slate-700/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs">Humidity</span>
            <TrendIndicator trend={trends.humidity} />
          </div>
          <div className="text-sky-400 text-lg font-bold">
            {formatValue(summary.humidity_avg, humidityUnit)}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Min: {formatValue(summary.humidity_min, humidityUnit)} | 
            Max: {formatValue(summary.humidity_max, humidityUnit)}
          </div>
        </div>

        {/* Rainfall */}
        <div className="bg-slate-700/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs">Rainfall</span>
          </div>
          <div className="text-blue-400 text-lg font-bold">
            {formatValue(summary.rainfall_total, rainfallUnit)}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            {summary.rainfall_count} hours with rain
          </div>
        </div>

        {/* Wind */}
        <div className="bg-slate-700/30 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs">Wind</span>
            <TrendIndicator trend={trends.wind} />
          </div>
          <div className="text-emerald-400 text-lg font-bold">
            {formatValue(summary.wind_speed_avg, windUnit)}
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Avg: {summary.wind_direction_avg?.toFixed(0) || 0}°
          </div>
        </div>
      </div>

      {/* Weather Condition */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs">Dominant Condition</span>
          <span className="text-slate-200 text-sm font-medium">
            {summary.condition_most_common || 'No data'}
          </span>
        </div>
        <div className="text-slate-500 text-xs mt-1">
          {summary.reading_count} readings taken
        </div>
      </div>
    </div>
  );
}