import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listLocations, getReadings, getSummary } from '../api/locations';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export function LocationDetail() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [readings, setReadings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get all locations to find the matching one
        const data = await listLocations();
        const foundLocation = (data.locations || []).find(loc => loc.id === parseInt(id));
        setLocation(foundLocation);
        
        if (foundLocation) {
          const readingsData = await getReadings(foundLocation.id);
          setReadings(readingsData.readings || []);
          
          // Also fetch daily summary
          const summaryData = await getSummary(foundLocation.id);
          setSummary(summaryData);
        }
      } catch (err) {
        setError('Failed to load location data');
      }
      
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <p className="text-slate-600">Loading location details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="rounded-lg bg-slate-100 p-4 text-slate-600">Location not found</div>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-sky-500 px-4 py-2 font-semibold text-white hover:bg-sky-600">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const chartData = readings.slice().reverse().map((reading) => ({
    time: new Date(reading.created_at).toLocaleTimeString(),
    temperature: reading.temperature,
    humidity: reading.humidity,
    rainfall: reading.rainfall,
    windSpeed: reading.wind_speed,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-sky-600 hover:text-sky-800">
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-800">{location.weather.area || 'Unknown Area'}</h1>
          <p className="text-slate-500">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
        </div>

        {/* Current Weather */}
        <div className="glass-card rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-sky-100 flex items-center justify-center">
              <span className="text-4xl">
                {location.weather.condition?.includes('Rain') ? '🌧️' :
                 location.weather.condition?.includes('Clear') ? '☀️' :
                 location.weather.condition?.includes('Cloudy') ? '☁️' : '/weather'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{location.weather.condition || 'N/A'}</h2>
              <p className="text-slate-500">Updated: {location.weather.observed_at ? new Date(location.weather.observed_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4">
            {location.current_conditions?.temperature != null && (
              <div className="text-center">
                <p className="text-sm text-slate-500">Temperature</p>
                <p className="text-2xl font-bold text-slate-800">{location.current_conditions.temperature}°C</p>
              </div>
            )}
            {location.current_conditions?.humidity != null && (
              <div className="text-center">
                <p className="text-sm text-slate-500">Humidity</p>
                <p className="text-2xl font-bold text-slate-800">{location.current_conditions.humidity}%</p>
              </div>
            )}
            {location.current_conditions?.rainfall != null && (
              <div className="text-center">
                <p className="text-sm text-slate-500">Rainfall</p>
                <p className="text-2xl font-bold text-slate-800">{location.current_conditions.rainfall} mm</p>
              </div>
            )}
            {location.current_conditions?.wind_speed != null && (
              <div className="text-center">
                <p className="text-sm text-slate-500">Wind</p>
                <p className="text-2xl font-bold text-slate-800">{location.current_conditions.wind_speed} km/h</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily Summary */}
        {summary && (
          <div className="glass-card rounded-2xl p-6 mb-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Avg Temperature</p>
                <p className="text-2xl font-bold text-slate-800">{summary.summary.temperature_avg?.toFixed(1) || 'N/A'}°C</p>
                {summary.trends.temperature && (
                  <span className={`text-xs font-semibold ${summary.trends.temperature[1].replace('text-', 'text-')}`}>
                    {summary.trends.temperature[0]}
                  </span>
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Avg Humidity</p>
                <p className="text-2xl font-bold text-slate-800">{summary.summary.humidity_avg?.toFixed(0) || 'N/A'}%</p>
                {summary.trends.humidity && (
                  <span className={`text-xs font-semibold ${summary.trends.humidity[1].replace('text-', 'text-')}`}>
                    {summary.trends.humidity[0]}
                  </span>
                )}
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Total Rainfall</p>
                <p className="text-2xl font-bold text-slate-800">{summary.summary.rainfall_total?.toFixed(1) || '0.0'}mm</p>
                <p className="text-xs text-slate-500 mt-1">{summary.summary.rainfall_count} hours with rain</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Avg Wind Speed</p>
                <p className="text-2xl font-bold text-slate-800">{summary.summary.wind_speed_avg?.toFixed(1) || 'N/A'} km/h</p>
                {summary.trends.wind && (
                  <span className={`text-xs font-semibold ${summary.trends.wind[1].replace('text-', 'text-')}`}>
                    {summary.trends.wind[0]}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Dominant Condition</p>
              <p className="text-lg font-semibold text-slate-800">{summary.summary.condition_most_common || 'No data'}</p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {chartData.length > 0 && (
          <div className="glass-card rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Historical Readings</h2>
            
            {/* Temperature Chart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Temperature (°C)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#6366f1' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      name="Temperature"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Humidity Chart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Humidity (%)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#0ea5e9' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="humidity" 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      name="Humidity"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Wind Speed Chart */}
            <div>
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Wind Speed (km/h)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#10b981' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="windSpeed" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Wind Speed"
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {chartData.length === 0 && (
          <div className="glass-card rounded-2xl p-8 text-center shadow-lg">
            <svg className="mx-auto h-16 w-16 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-slate-600">No historical data available yet. Refresh the location to start collecting readings.</p>
          </div>
        )}
      </div>
    </div>
  );
}