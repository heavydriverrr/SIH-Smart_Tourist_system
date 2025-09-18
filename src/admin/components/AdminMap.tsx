import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, User, Shield, MapPin } from 'lucide-react';
import { touristAPI, getSocket } from '@/services/adminApi';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGVmYXVsdCIsImEiOiJkZWZhdWx0In0.default';

interface TouristLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number;
  updated_at: string;
  tourist: {
    name: string;
    digital_id: string;
    safety_score: number;
    is_verified: boolean;
  };
}

const AdminMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<TouristLocation[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<TouristLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [91.7362, 26.1445], // Guwahati, Assam coordinates
      zoom: 12,
    });

    map.current.on('load', () => {
      loadTouristLocations();
    });

    // Set up real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on('location-update', handleLocationUpdate);
      socket.on('new-alert', handleNewAlert);

      return () => {
        socket.off('location-update', handleLocationUpdate);
        socket.off('new-alert', handleNewAlert);
      };
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  const loadTouristLocations = async () => {
    try {
      setLoading(true);
      const response = await touristAPI.getLiveLocations();
      
      if (response.success) {
        setLocations(response.data);
        updateMapMarkers(response.data);
      } else {
        setError('Failed to load tourist locations');
      }
    } catch (error: any) {
      console.error('Error loading locations:', error);
      setError('Failed to load tourist locations');
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (touristLocations: TouristLocation[]) => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each tourist
    touristLocations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'tourist-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${getSafetyColor(location.tourist.safety_score)};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      `;

      // Add user icon
      const icon = document.createElement('div');
      icon.innerHTML = '👤';
      icon.style.fontSize = '16px';
      el.appendChild(icon);

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup content
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center space-x-2 mb-2">
            <strong>${location.tourist.name}</strong>
            ${location.tourist.is_verified ? '<span class="text-green-500">✓</span>' : ''}
          </div>
          <p class="text-sm text-gray-600 mb-1">ID: ${location.tourist.digital_id}</p>
          <p class="text-sm text-gray-600 mb-2">Safety: ${location.tourist.safety_score}%</p>
          <p class="text-sm text-gray-500 mb-2">${location.address}</p>
          <p class="text-xs text-gray-400">
            Last update: ${new Date(location.updated_at).toLocaleString()}
          </p>
          <p class="text-xs text-gray-400">
            Accuracy: ±${location.accuracy}m
          </p>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      // Handle marker click
      el.addEventListener('click', () => {
        setSelectedTourist(location);
        popup.addTo(map.current!);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (touristLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      touristLocations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const getSafetyColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Yellow/Orange
    return '#EF4444'; // Red
  };

  const handleLocationUpdate = (data: any) => {
    console.log('Location update received:', data);
    loadTouristLocations();
  };

  const handleNewAlert = (data: any) => {
    console.log('New alert received:', data);
    // Highlight the tourist with an alert
    loadTouristLocations();
  };

  const handleRefresh = () => {
    loadTouristLocations();
  };

  const handleFitBounds = () => {
    if (locations.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Map Loading Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          onClick={handleRefresh}
          variant="secondary"
          size="sm"
          className="bg-white/90 backdrop-blur shadow-lg"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button
          onClick={handleFitBounds}
          variant="secondary"
          size="sm"
          className="bg-white/90 backdrop-blur shadow-lg"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Fit All
        </Button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading locations...</p>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4">
        <Card className="bg-white/90 backdrop-blur shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{locations.length} Tourists</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-xs">Online</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Tourist Info */}
      {selectedTourist && (
        <div className="absolute top-4 left-4 w-80">
          <Card className="bg-white/95 backdrop-blur shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">{selectedTourist.tourist.name}</h3>
                  {selectedTourist.tourist.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTourist(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Digital ID:</span>
                  <span className="font-mono">{selectedTourist.tourist.digital_id}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Safety Score:</span>
                  <Badge
                    variant={selectedTourist.tourist.safety_score >= 80 ? 'default' : 
                            selectedTourist.tourist.safety_score >= 60 ? 'secondary' : 'destructive'}
                  >
                    {selectedTourist.tourist.safety_score}%
                  </Badge>
                </div>
                
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Current Location:</p>
                  <p className="text-xs">{selectedTourist.address}</p>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Last Update:</span>
                  <span>{new Date(selectedTourist.updated_at).toLocaleTimeString()}</span>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Accuracy:</span>
                  <span>±{selectedTourist.accuracy}m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4">
        <Card className="bg-white/90 backdrop-blur shadow-lg">
          <CardContent className="p-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Safe (80%+)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Caution (60-79%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Alert (Below 60%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMap;







