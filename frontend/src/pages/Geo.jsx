import { useState, useEffect, useRef } from 'react';
import { useLocations } from '../hooks/useLocations.jsx';

// AQI color mapping
const getAQIColor = (aqi) => {
  if (aqi <= 50) return '#4CAF50';
  if (aqi <= 100) return '#8BC34A';
  if (aqi <= 150) return '#FFC107';
  if (aqi <= 200) return '#FF9800';
  if (aqi <= 300) return '#F44336';
  return '#7E57C2';
};

export function Geo() {
  const { locations } = useLocations();
  const [loaded, setLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    heat: false,
    airQuality: false,
    wind: true,
    rain: false,
  });
  const [latestData, setLatestData] = useState({
    temperature: null,
    psi: null,
    rainfall: null
  });
  const [heatLayer, setHeatLayer] = useState(null);
  const [airQualityLayer, setAirQualityLayer] = useState(null);
  const [rainLayer, setRainLayer] = useState(null);
  const mapRef = useRef(null);
  const windCanvasRef = useRef(null);
  const rainCanvasRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.onload = () => setLoaded(true);
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {};
  }, []);

  useEffect(() => {
    if (!loaded || !window.L) return;
    const osmLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });
    if (mapRef.current) { try { mapRef.current.remove(); } catch (e) {} }
    const mapContainer = document.getElementById('geo-map');
    if (!mapContainer) return;
    try {
      mapRef.current = window.L.map(mapContainer, {
        attributionControl: true,
        zoomControl: false,
      });
      mapRef.current.setView([1.3521, 103.8198], 11);
      osmLayer.addTo(mapRef.current);
      setMapReady(true);
    } catch (e) { console.error('Error initializing map:', e); }
    return () => {
      if (mapRef.current) { try { mapRef.current.remove(); } catch (e) {} }
    };
  }, [loaded]);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const tempResponse = await fetch('https://api.data.gov.sg/v1/environment/2-hour-temperature-forecast');
        console.log('Temperature API response:', tempResponse.status);
        if (tempResponse.ok) {
          const tempData = await tempResponse.json();
          console.log('Temperature data:', tempData);
          setLatestData(prev => ({ ...prev, temperature: tempData }));
        }
      } catch (e) {
        console.error('Error fetching temperature:', e);
      }
    };

    const fetchPSIData = async () => {
      try {
        const psiResponse = await fetch('https://api.data.gov.sg/v1/environment/psi');
        console.log('PSI API response:', psiResponse.status);
        if (psiResponse.ok) {
          const psiData = await psiResponse.json();
          console.log('PSI data:', psiData);
          setLatestData(prev => ({ ...prev, psi: psiData }));
        }
      } catch (e) {
        console.error('Error fetching PSI:', e);
      }
    };

    const fetchRainfallData = async () => {
      try {
        const rainResponse = await fetch('https://api.data.gov.sg/v1/environment/rainfall');
        console.log('Rainfall API response:', rainResponse.status);
        if (rainResponse.ok) {
          const rainData = await rainResponse.json();
          console.log('Rainfall data:', rainData);
          setLatestData(prev => ({ ...prev, rainfall: rainData }));
        }
      } catch (e) {
        console.error('Error fetching rainfall:', e);
      }
    };

    fetchWeatherData();
    fetchPSIData();
    fetchRainfallData();

    const interval = setInterval(() => {
      fetchWeatherData();
      fetchPSIData();
      fetchRainfallData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!window.L) return;
    if (!latestData.temperature) {
      console.log('No temperature data available');
      return;
    }
    try {
      const temps = latestData.temperature.items?.[0]?.forecast || [];
      const avgTemp = temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 30;
      console.log('Avg temp:', avgTemp, 'Temps:', temps);

      const heatCanvas = document.createElement('canvas');
      heatCanvas.width = 200;
      heatCanvas.height = 100;
      const ctx = heatCanvas.getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 200, 0);
      gradient.addColorStop(0, '#00ffff');
      gradient.addColorStop(0.5, '#ffff00');
      gradient.addColorStop(1, '#ff0000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(avgTemp)}°C`, 100, 50);

      const heatIcon = window.L.icon({
        iconUrl: heatCanvas.toDataURL('image/png'),
        iconSize: [200, 100],
        iconAnchor: [100, 50],
      });

      const marker = window.L.marker([1.3521, 103.8198], { icon: heatIcon });
      setHeatLayer(marker);
      console.log('Heat layer created:', marker);
    } catch (e) {
      console.error('Error creating heat layer:', e);
    }
  }, [latestData.temperature]);

  useEffect(() => {
    if (!window.L) return;
    if (!latestData.psi) {
      console.log('No PSI data available');
      return;
    }
    try {
      const psiValue = latestData.psi.items?.[0]?.area_average?.['psiOverall'] || 50;
      const aqiColor = getAQIColor(psiValue);
      console.log('PSI value:', psiValue, 'Color:', aqiColor);

      const psiCanvas = document.createElement('canvas');
      psiCanvas.width = 200;
      psiCanvas.height = 100;
      const ctx = psiCanvas.getContext('2d');

      ctx.fillStyle = aqiColor;
      ctx.beginPath();
      ctx.arc(100, 50, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PSI: ${psiValue}`, 100, 50);

      const psiIcon = window.L.icon({
        iconUrl: psiCanvas.toDataURL('image/png'),
        iconSize: [200, 100],
        iconAnchor: [100, 50],
      });

      const marker = window.L.marker([1.3521, 103.8198], { icon: psiIcon });
      setAirQualityLayer(marker);
      console.log('Air quality layer created:', marker);
    } catch (e) {
      console.error('Error creating air quality layer:', e);
    }
  }, [latestData.psi]);

  useEffect(() => {
    if (!window.L) return;
    if (!latestData.rainfall) {
      console.log('No rainfall data available');
      return;
    }
    try {
      const hasRain = latestData.rainfall.items?.[0]?.readings?.some(r => r.value > 0);
      console.log('Has rain:', hasRain);

      const rainCanvas = document.createElement('canvas');
      rainCanvas.width = 200;
      rainCanvas.height = 100;
      const ctx = rainCanvas.getContext('2d');

      if (hasRain) {
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(100, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RAIN', 100, 50);
      } else {
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.arc(100, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No Rain', 100, 50);
      }

      const rainIcon = window.L.icon({
        iconUrl: rainCanvas.toDataURL('image/png'),
        iconSize: [200, 100],
        iconAnchor: [100, 50],
      });

      const marker = window.L.marker([1.3521, 103.8198], { icon: rainIcon });
      setRainLayer(marker);
      console.log('Rain layer created:', marker);
    } catch (e) {
      console.error('Error creating rain layer:', e);
    }
  }, [latestData.rainfall]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (activeLayers.heat && heatLayer) {
      mapRef.current.addLayer(heatLayer);
      console.log('Heat layer added');
    } else if (heatLayer) {
      mapRef.current.removeLayer(heatLayer);
      console.log('Heat layer removed');
    }
  }, [activeLayers.heat, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (activeLayers.airQuality && airQualityLayer) {
      mapRef.current.addLayer(airQualityLayer);
      console.log('Air quality layer added');
    } else if (airQualityLayer) {
      mapRef.current.removeLayer(airQualityLayer);
      console.log('Air quality layer removed');
    }
  }, [activeLayers.airQuality, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    if (activeLayers.rain && rainLayer) {
      mapRef.current.addLayer(rainLayer);
      console.log('Rain layer added');
    } else if (rainLayer) {
      mapRef.current.removeLayer(rainLayer);
      console.log('Rain layer removed');
    }
  }, [activeLayers.rain, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !activeLayers.rain || !latestData.rainfall) return;
    if (!latestData.rainfall.items?.[0]?.readings?.some(r => r.value > 0)) return;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1998';
    document.getElementById('geo-map').appendChild(canvas);
    rainCanvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const updateCanvasSize = () => {
      const container = document.getElementById('geo-map');
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
      }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const rainDrops = [];
    for (let i = 0; i < 50; i++) {
      rainDrops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: 10 + Math.random() * 20,
        speed: 5 + Math.random() * 10
      });
    }

    const drawRain = () => {
      if (!mapRef.current) return;
      const container = document.getElementById('geo-map');
      if (!container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(33, 150, 243, 0.7)';
      ctx.lineWidth = 2;

      rainDrops.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
          drop.y = -20;
          drop.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(drawRain);
    };

    drawRain();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [activeLayers.rain, mapReady, latestData.rainfall]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !activeLayers.wind) return;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2000';
    document.getElementById('geo-map').appendChild(canvas);
    windCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const updateCanvasSize = () => {
      const container = document.getElementById('geo-map');
      if (container) { canvas.width = container.offsetWidth; canvas.height = container.offsetHeight; }
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    const drawWindArrows = () => {
      if (!mapRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(66, 165, 245, 0.6)';
      ctx.strokeStyle = 'rgba(66, 165, 245, 0.4)';
      const time = Date.now() * 0.001;
      const gridSize = 80;
      const offsetX = (time * 30) % gridSize;
      for (let x = offsetX - gridSize; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          const arrowSize = 12;
          const arrowAngle = (y / canvas.height) * Math.PI * 2 + time * 0.5;
          const arrowX = x + gridSize / 2;
          const arrowY = y + gridSize / 2;
          const endX = arrowX + Math.cos(arrowAngle) * arrowSize;
          const endY = arrowY + Math.sin(arrowAngle) * arrowSize;
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          const headSize = 6;
          const headAngle = 0.5;
          const headLeftX = endX + headSize * Math.cos(arrowAngle - headAngle);
          const headLeftY = endY + headSize * Math.sin(arrowAngle - headAngle);
          const headRightX = endX + headSize * Math.cos(arrowAngle + headAngle);
          const headRightY = endY + headSize * Math.sin(arrowAngle + headAngle);
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(headLeftX, headLeftY);
          ctx.lineTo(headRightX, headRightY);
          ctx.closePath();
          ctx.fill();
        }
      }
      animationFrameId = requestAnimationFrame(drawWindArrows);
    };
    drawWindArrows();
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [activeLayers.wind, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !activeLayers.airQuality || !latestData.psi) return;
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1999';
    document.getElementById('geo-map').appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const updateAQI = () => {
      if (!mapRef.current) return;
      const container = document.getElementById('geo-map');
      if (!container) return;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      const areaSize = Math.max(100, 5000 / Math.pow(2, zoom - 10));
      const screenCenter = mapRef.current.latLngToContainerPoint(center);
      const radius = areaSize / 4;
      const psiValue = latestData.psi?.items?.[0]?.area_average?.['psiOverall'] || 50;
      const aqiColor = getAQIColor(psiValue);
      const gradient = ctx.createRadialGradient(screenCenter.x, screenCenter.y, radius * 0.2, screenCenter.x, screenCenter.y, radius);
      gradient.addColorStop(0, aqiColor + '0.6');
      gradient.addColorStop(1, aqiColor + '0');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenCenter.x, screenCenter.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = aqiColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PSI: ' + psiValue, screenCenter.x, screenCenter.y);
    };
    updateAQI();
    const zoomHandler = () => updateAQI();
    mapRef.current.on('zoom', zoomHandler);
    return () => {
      mapRef.current.off('zoom', zoomHandler);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [activeLayers.airQuality, mapReady, latestData.psi]);

  const toggleLayer = (layer) => { setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] })); };

  const getWindDirection = () => {
    for (const loc of locations) {
      if (loc.current_conditions?.wind_direction != null) return loc.current_conditions.wind_direction;
    }
    return null;
  };

  const getCardinalDirection = (degrees) => {
    if (degrees == null) return 'Unknown';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">GeoView</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toggleLayer('heat')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeLayers.heat ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Heat</button>
          <button onClick={() => toggleLayer('airQuality')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeLayers.airQuality ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>AQI</button>
          <button onClick={() => toggleLayer('wind')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeLayers.wind ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Wind</button>
          <button onClick={() => toggleLayer('rain')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeLayers.rain ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/50' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Rain</button>
        </div>
        <button onClick={() => window.history.back()} className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium text-sm transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>
      <div className="flex-1 relative">
        <div id="geo-map" className="absolute inset-0 w-full h-full"></div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2">
          <button onClick={() => mapRef.current && mapRef.current.zoomIn()} className="w-10 h-10 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 hover:border-slate-600 transition-all shadow-lg" aria-label="Zoom in">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button onClick={() => mapRef.current && mapRef.current.zoomOut()} className="w-10 h-10 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 hover:border-slate-600 transition-all shadow-lg" aria-label="Zoom out">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>
        <div className="absolute top-4 left-20 z-30">
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-2xl min-w-[220px]">
            <div className="mb-3 pb-3 border-b border-slate-700">
              <h3 className="text-white font-semibold text-sm mb-1">Tracked Locations</h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className={`w-2 h-2 rounded-full ${locations.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
                {locations.length} Active {locations.length !== 1 ? 'Locations' : 'Location'}
              </div>
            </div>
            <div className="space-y-2">
              {locations.length > 0 && locations.map((loc) => (
                <div key={loc.id} className="text-xs text-slate-300 border-b border-slate-700 pb-2 last:border-0">
                  <div className="font-medium text-sky-300">{loc.weather.area || 'Unknown'}</div>
                  <div className="text-slate-500">{loc.weather.condition || 'No data'}</div>
                  {loc.current_conditions?.temperature != null && <div className="text-amber-400 font-semibold">{loc.current_conditions.temperature}C</div>}
                  {loc.current_conditions?.wind_speed != null && <div className="text-sky-400">{loc.current_conditions.wind_speed} km/h</div>}
                  {loc.current_conditions?.wind_direction != null && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Wind:</span>
                      <span className="font-semibold text-blue-400">{loc.current_conditions.wind_direction}deg</span>
                      <span>({getCardinalDirection(loc.current_conditions.wind_direction)})</span>
                    </div>
                  )}
                </div>
              ))}
              {locations.length === 0 && <div className="text-xs text-slate-500 italic">No locations tracked yet</div>}
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 z-30 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-400">
          1 cm = 1 km
        </div>
      </div>
    </div>
  );
}
