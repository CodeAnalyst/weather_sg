import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LocationsProvider } from './hooks/useLocations.jsx';
import { Dashboard } from './pages/Dashboard';
import { Geo } from './pages/Geo.jsx';
import { LocationDetail } from './components/LocationDetail';

export function App() {
  return (
    <LocationsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/geo" element={<Geo />} />
          <Route path="/location/:id" element={<LocationDetail />} />
        </Routes>
      </BrowserRouter>
    </LocationsProvider>
  );
}