import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertTriangle, Shield } from 'lucide-react';

interface MapComponentProps {
  center: [number, number];
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, onLocationChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [map, setMap] = useState<any>(null);

  // Sample data for demonstration
  const [touristZones] = useState([
    {
      id: 1,
      name: 'Kamakhya Temple',
      lat: 26.1665,
      lng: 91.7047,
      type: 'safe',
      description: 'Major tourist attraction - Safe zone'
    },
    {
      id: 2,
      name: 'Umananda Temple',
      lat: 26.1844,
      lng: 91.7458,
      type: 'safe',
      description: 'Peacock Island - Safe zone'
    },
    {
      id: 3,
      name: 'Remote Forest Area',
      lat: 26.1200,
      lng: 91.8000,
      type: 'caution',
      description: 'Restricted area - Exercise caution'
    }
  ]);

  const initializeMap = async (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      // Dynamic import for mapbox-gl
      const mapboxgl = await import('mapbox-gl');
      
      // Set the access token
      (mapboxgl as any).accessToken = token;

      // Initialize the map
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: center,
        zoom: 12,
        pitch: 0,
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add current location marker
      new mapboxgl.Marker({ 
        color: '#1d4ed8',
        scale: 1.2 
      })
        .setLngLat(center)
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">Your Current Location</h3>
              <p class="text-xs text-gray-600">Guwahati, Assam</p>
            </div>
          `)
        )
        .addTo(newMap);

      // Add tourist zone markers
      touristZones.forEach((zone) => {
        const color = zone.type === 'safe' ? '#22c55e' : 
                     zone.type === 'caution' ? '#f59e0b' : '#ef4444';
        
        const marker = new mapboxgl.Marker({ 
          color: color,
          scale: 0.8
        })
          .setLngLat([zone.lng, zone.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div class="p-2">
                <h3 class="font-bold text-sm">${zone.name}</h3>
                <p class="text-xs text-gray-600">${zone.description}</p>
              </div>
            `)
          )
          .addTo(newMap);
      });

      setMap(newMap);
      setShowTokenInput(false);

      // Update location when map is clicked
      newMap.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onLocationChange({
          lat,
          lng,
          address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      alert('Error loading map. Please check your Mapbox token.');
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken.trim());
    }
  };

  if (showTokenInput) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center space-y-3">
          <MapPin className="h-12 w-12 text-primary mx-auto" />
          <h3 className="text-lg font-semibold">Map Integration</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public token to enable live map features
          </p>
        </div>
        
        <form onSubmit={handleTokenSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="Mapbox Public Token (pk.ey...)"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="font-mono text-xs"
          />
          <Button type="submit" variant="hero" className="w-full">
            Load Map
          </Button>
        </form>
        
        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            Get your free Mapbox token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <p>
            For production use, this would be handled securely via backend integration.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full rounded-lg" />
      
      {/* Zone Legend */}
      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-soft">
        <h4 className="text-xs font-semibold mb-2">Safety Zones</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-success rounded-full"></div>
            <span>Safe Zone</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-warning rounded-full"></div>
            <span>Caution Area</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-primary rounded-full"></div>
            <span>Your Location</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="absolute bottom-3 right-3 space-y-2">
        <Button size="icon" variant="secondary" className="shadow-soft bg-background/90 backdrop-blur-sm">
          <Navigation className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="secondary" className="shadow-soft bg-background/90 backdrop-blur-sm">
          <Shield className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MapComponent;