import { useState, useEffect } from 'react';
import { useCreateLocation, useRefreshLocation } from '../hooks/useLocations.jsx';
import { listAreas } from '../api/locations';

// Weather condition icons (simple SVGs)
const weatherIcons = {
  'Light Rain': (
    <svg className="h-8 w-8 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  'Heavy Rain': (
    <svg className="h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  'Showers': (
    <svg className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  'Cloudy': (
    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  'Clear': (
    <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  'Fog': (
    <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  'Unknown': (
    <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
    </svg>
  ),
};

export function LocationForm() {
  const [searchTerm, setSearchTerm] = useState('');
  const [areas, setAreas] = useState([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const { create, isPending, error } = useCreateLocation();
  const { refresh, isPending: refreshPending } = useRefreshLocation();

  // Load areas on mount
  useEffect(() => {
    const loadAreas = async () => {
      setIsLoadingAreas(true);
      try {
        const data = await listAreas();
        setAreas(data.areas || []);
      } catch (err) {
        console.error('Failed to load areas:', err);
      } finally {
        setIsLoadingAreas(false);
      }
    };
    loadAreas();
  }, []);

  // Filter areas based on search term
  const filteredAreas = areas.filter(area =>
    area.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!selectedArea) return;

    try {
      await create({
        latitude: Number(selectedArea.latitude),
        longitude: Number(selectedArea.longitude),
      });
      setSearchTerm('');
      setSelectedArea(null);
    } catch {
      // error is already captured in hook state
    }
  };

  const useMyLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setSearchTerm('');
        setSelectedArea({
          name: 'My Location',
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6)
        });

        try {
          const newLocation = await create({
            latitude: latitude,
            longitude: longitude,
          });

          if (newLocation?.id) {
            await refresh(newLocation.id);
          }
        } catch (err) {
          try {
            await refresh(newLocation?.id);
          } catch {
            // Ignore refresh errors for already-existing locations
          }
        }
      },
      (error) => {
        let message = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Please enable location access to use this feature.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get user location timed out.';
            break;
          default:
            message = 'An unknown error occurred.';
        }
        alert(message);
      }
    );
  };

  return (
    <form onSubmit={onSubmit} className="glass-panel rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Add Location</h2>
        <p className="text-sm text-slate-500 mt-1">Track weather for a specific location in Singapore</p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-600 ml-1">Search Area</span>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur-sm px-4 py-3 pl-10 text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all"
              placeholder="Type to search Singapore areas..."
              required
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </label>

        {isLoadingAreas ? (
          <div className="py-3 px-4 rounded-xl bg-slate-100/50 animate-shimmer text-slate-500 text-center">
            Loading areas...
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedArea?.name || ''}
              onChange={(event) => {
                const area = areas.find(a => a.name === event.target.value);
                setSelectedArea(area);
                setSearchTerm(area?.name || '');
              }}
              className="w-full rounded-xl border border-slate-300 bg-white/70 backdrop-blur-sm px-4 py-3 text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all appearance-none"
              required
            >
              <option value="">Select an area...</option>
              {filteredAreas.map((area) => (
                <option key={area.name} value={area.name}>
                  {area.name}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Use my location
        </button>

        <button
          type="submit"
          disabled={isPending || !selectedArea}
          className={`w-full rounded-xl px-4 py-3 font-semibold text-white shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
            ${isPending || !selectedArea 
              ? 'bg-sky-300 cursor-not-allowed' 
              : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 shadow-sky-500/30 hover:shadow-sky-500/40'}`}
        >
          {isPending ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Location
            </>
          )}
        </button>

        {error && (
          <div className="rounded-lg bg-red-50/80 backdrop-blur-sm border border-red-200 px-4 py-3 text-sm text-red-600 animate-fade-in">
            <span className="font-semibold">Error:</span> {error.message}
          </div>
        )}

        {refreshPending && (
          <div className="rounded-lg bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 px-4 py-3 text-sm text-emerald-600 animate-fade-in">
            <span className="font-semibold">Auto-refreshing weather...</span>
          </div>
        )}
      </div>
    </form>
  );
}