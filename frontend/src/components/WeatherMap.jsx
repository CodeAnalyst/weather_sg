import { useState, useEffect, useRef } from 'react';

export function WeatherMap({ locations, onToggleView }) {
  const [loaded, setLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.onload = () => {
      setLoaded(true);
    };
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setLoaded(true);
    };
    script.onerror = (err) => {
      console.error('Failed to load Leaflet JS:', err);
    };
    document.body.appendChild(script);

    return () => {};
  }, []);

  useEffect(() => {
    // Initialize map when Leaflet is loaded
    if (!loaded || !window.L) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.error('Error removing map:', e);
      }
    }

    const mapContainer = document.getElementById('weather-map');
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    try {
      mapRef.current = window.L.map(mapContainer, {
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current.setView([1.3521, 103.8198], 11);

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '',
        maxZoom: 19,
      }).addTo(mapRef.current);

      setMapReady(true);
    } catch (e) {
      console.error('Error initializing map:', e);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      }
    };
  }, [loaded]);

  useEffect(() => {
    // Add markers when locations change and map is ready
    if (!mapReady || !window.L || !mapRef.current || locations.length === 0) return;

    try {
      // Clear existing markers
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.Marker) {
          mapRef.current.removeLayer(layer);
        }
      });

      // Add markers for each location
      locations.forEach(location => {
        const popupContent = `
          <div style="width: 220px;">
            <h3 style="font-weight: bold; color: #1e293b; margin-bottom: 8px; font-size: 14px;">${location.weather.area || 'Unknown Area'}</h3>
            <div style="font-size: 13px; color: #475569; line-height: 1.4;">
              <p style="display: flex; justify-content: space-between; margin: 4px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                <span>Condition:</span>
                <strong style="color: #334155;">${location.weather.condition || 'N/A'}</strong>
              </p>
              ${location.current_conditions?.temperature != null ? `
              <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Temperature:</span>
                <strong style="color: #334155;">${location.current_conditions.temperature}°C</strong>
              </p>` : ''}
              ${location.current_conditions?.humidity != null ? `
              <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Humidity:</span>
                <strong style="color: #334155;">${location.current_conditions.humidity}%</strong>
              </p>` : ''}
              ${location.current_conditions?.wind_speed != null ? `
              <p style="display: flex; justify-content: space-between; margin: 4px 0;">
                <span>Wind:</span>
                <strong style="color: #334155;">${location.current_conditions.wind_speed} km/h</strong>
              </p>` : ''}
            </div>
          </div>
        `;

        const marker = window.L.marker([location.latitude, location.longitude], {
          icon: window.L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/616/616400.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          }),
        });
        marker.bindPopup(popupContent, {
          minWidth: 220,
          maxWidth: 220,
          autoPan: true,
        });
        marker.addTo(mapRef.current);
      });

      // Zoom to fit all markers
      if (locations.length > 0) {
        const bounds = locations.map(l => [l.latitude, l.longitude]);
        if (bounds.length === 1) {
          mapRef.current.setView(bounds[0], 11);
        } else {
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    } catch (e) {
      console.error('Error adding markers:', e);
    }
  }, [locations, mapReady]);

  if (locations.length === 0) {
    return (
      <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-lg">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-slate-500 font-medium">Add locations to see them on the map</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl relative">
      <div 
        id="weather-map" 
        className="h-full w-full"
        style={{ minHeight: '600px' }}
      />
      
      {/* Floating Panel Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto glass-panel rounded-xl p-3 shadow-xl max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-600">{locations.length} Location{locations.length !== 1 ? 's' : ''} Tracked</span>
          </div>
          <div className="text-sm text-slate-500">
            Click on markers for detailed weather info
          </div>
        </div>

        <div className="pointer-events-auto">
          <button
            onClick={onToggleView}
            className="glass-panel px-4 py-2 rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List View
          </button>
        </div>
      </div>

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 z-10">
        <div className="bg-white/60 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-slate-500 font-medium">
          © OpenStreetMap contributors
        </div>
      </div>
    </div>
  );
}