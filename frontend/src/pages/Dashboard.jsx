import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocations } from '../hooks/useLocations.jsx';
import { LocationForm } from '../components/LocationForm';
import { LocationList } from '../components/LocationList';
import { WeatherMap } from '../components/WeatherMap';

export function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const { locations } = useLocations();

  // Determine background theme based on dominant weather condition
  const getBackgroundClass = () => {
    if (locations.length === 0) return 'from-slate-50 via-sky-50 to-blue-50';
    
    const conditions = locations.map(l => l.weather.condition);
    const hasRain = conditions.some(c => c?.includes('Rain') || c?.includes('Showers'));
    const hasClear = conditions.some(c => c?.includes('Clear'));
    const hasCloudy = conditions.some(c => c?.includes('Cloudy'));

    if (hasRain) return 'from-blue-50 via-sky-50 to-cyan-50';
    if (hasClear) return 'from-amber-50 via-yellow-50 to-orange-50';
    if (hasCloudy) return 'from-slate-100 via-slate-50 to-gray-50';
    return 'from-slate-50 via-sky-50 to-blue-50';
  };

  const bgClass = getBackgroundClass();

  // SVG pattern for background
  const bgPattern = `data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Ccircle cx="20" cy="20" r="5" fill="rgba(255,255,255,0.2)"/%3E%3Ccircle cx="80" cy="30" r="8" fill="rgba(255,255,255,0.15)"/%3E%3Ccircle cx="50" cy="70" r="6" fill="rgba(255,255,255,0.25)"/%3E%3C/svg%3E`;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgClass} transition-colors duration-1000`}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-0 w-full h-full"
          style={{ 
            backgroundImage: `url('${bgPattern}')`,
            opacity: 0.6 
          }}
        />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-white/20 to-sky-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-40 right-20 w-72 h-72 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/30 border-b border-white/40 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 rounded-xl blur-lg opacity-60"></div>
                <div className="relative bg-white/80 rounded-xl p-2 shadow-lg">
                  <svg className="w-8 h-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  WeatherSync
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  Real-time Singapore weather tracking
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setView('list')}
                className={`${view === 'list' ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white/60 text-slate-600 hover:bg-white/80'} rounded-xl px-6 py-3 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/40 backdrop-blur-md`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  List View
                </span>
              </button>
              <button
                onClick={() => setView('map')}
                className={`${view === 'map' ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/30' : 'bg-white/60 text-slate-600 hover:bg-white/80'} rounded-xl px-6 py-3 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border border-white/40 backdrop-blur-md`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Map View
                </span>
              </button>
              <button
                onClick={() => navigate('/geo')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl px-6 py-3 font-semibold shadow-xl hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95 border border-emerald-500/40 backdrop-blur-md"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Geo View
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          {/* Add Location Section */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Add New Location</h2>
                <p className="text-slate-600">Track weather for a specific location in Singapore</p>
              </div>
            </div>
            <LocationForm />
          </div>

          {/* Weather Display */}
          {view === 'list' ? (
            <div className="animate-slide-in">
              <LocationList />
            </div>
          ) : (
            <div className="rounded-3xl bg-white/50 backdrop-blur-xl border border-white/40 shadow-2xl p-4 animate-fade-in">
              <WeatherMap locations={locations} onToggleView={() => setView('list')} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-8 py-6 border-t border-white/30 bg-white/20 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-slate-500 text-sm">
            Weather data provided by <span className="font-semibold text-sky-600">data.gov.sg</span>
          </p>
        </div>
      </footer>
    </div>
  );
}