import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw, Maximize2 } from 'lucide-react';

interface MapComponentProps {
  center: [number, number];
  onLocationChange?: (location: { lat: number; lng: number; address: string }) => void;
  height?: string;
  showControls?: boolean;
}

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'user' | 'safe' | 'caution' | 'danger';
  description: string;
}

const FreeMapComponent: React.FC<MapComponentProps> = ({ 
  center, 
  onLocationChange,
  height = "400px",
  showControls = true 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>(center);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Sample tourist zones around Guwahati
  const defaultMarkers: MapMarker[] = [
    {
      id: 'kamakhya',
      lat: 26.1665,
      lng: 91.7047,
      name: 'Kamakhya Temple',
      type: 'safe',
      description: 'Major tourist attraction - Safe zone with high security'
    },
    {
      id: 'umananda',
      lat: 26.1844,
      lng: 91.7458,
      name: 'Umananda Temple',
      type: 'safe',
      description: 'Peacock Island - Safe zone with ferry access'
    },
    {
      id: 'zoo',
      lat: 26.1791,
      lng: 91.7847,
      name: 'Assam State Zoo',
      type: 'safe',
      description: 'Family-friendly safe zone'
    },
    {
      id: 'forest-area',
      lat: 26.1200,
      lng: 91.8000,
      name: 'Remote Forest Area',
      type: 'caution',
      description: 'Limited connectivity - Exercise caution'
    },
    {
      id: 'construction',
      lat: 26.1350,
      lng: 91.7200,
      name: 'Construction Zone',
      type: 'caution',
      description: 'Under development - Avoid during night'
    }
  ];

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize the map container
    initializeMap();
    setMapLoaded(true);
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    // Create a simple interactive map using HTML/CSS/JS
    const mapDiv = mapContainer.current;
    mapDiv.innerHTML = ''; // Clear existing content

    // Create map viewport
    const viewport = document.createElement('div');
    viewport.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #4CAF50 0%, #45a049 50%, #2196F3 100%);
      overflow: hidden;
      border-radius: 8px;
      cursor: grab;
    `;

    // Add map grid pattern
    const grid = document.createElement('div');
    grid.style.cssText = `
      position: absolute;
      width: 200%;
      height: 200%;
      background-image: 
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: grid-move 20s linear infinite;
    `;
    viewport.appendChild(grid);

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes grid-move {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 50px); }
      }
      .marker-pulse {
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Add location markers
    addMarkersToMap(viewport);

    // Add user location marker
    addUserLocationMarker(viewport);

    mapDiv.appendChild(viewport);

    // Add click handler for location selection
    viewport.addEventListener('click', handleMapClick);
  };

  const addMarkersToMap = (viewport: HTMLElement) => {
    defaultMarkers.forEach((marker, index) => {
      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        position: absolute;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${getMarkerColor(marker.type)};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        z-index: ${10 + index};
        transform: translate(-50%, -50%);
        left: ${(marker.lng - center[0]) * 1000 + 50}%;
        top: ${(center[1] - marker.lat) * 1000 + 50}%;
        transition: all 0.2s ease;
      `;

      markerEl.className = 'marker-pulse';
      markerEl.title = marker.name;

      markerEl.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'translate(-50%, -50%) scale(1.3)';
        showMarkerPopup(marker, markerEl);
      });

      markerEl.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'translate(-50%, -50%) scale(1)';
        hideMarkerPopup();
      });

      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedMarker(marker);
        if (onLocationChange) {
          onLocationChange({
            lat: marker.lat,
            lng: marker.lng,
            address: marker.name
          });
        }
      });

      viewport.appendChild(markerEl);
    });
  };

  const addUserLocationMarker = (viewport: HTMLElement) => {
    const userMarker = document.createElement('div');
    userMarker.style.cssText = `
      position: absolute;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      z-index: 100;
      transform: translate(-50%, -50%);
      left: 50%;
      top: 50%;
    `;

    // Add user icon
    const userIcon = document.createElement('div');
    userIcon.innerHTML = '📍';
    userIcon.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px;
    `;
    userMarker.appendChild(userIcon);

    viewport.appendChild(userMarker);
  };

  const getMarkerColor = (type: string): string => {
    switch (type) {
      case 'safe': return '#10B981';
      case 'caution': return '#F59E0B';
      case 'danger': return '#EF4444';
      default: return '#6366F1';
    }
  };

  const showMarkerPopup = (marker: MapMarker, element: HTMLElement) => {
    // Remove existing popup
    hideMarkerPopup();

    const popup = document.createElement('div');
    popup.id = 'marker-popup';
    popup.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      z-index: 1000;
      min-width: 200px;
      max-width: 250px;
      left: ${element.offsetLeft + 30}px;
      top: ${element.offsetTop - 10}px;
    `;

    popup.innerHTML = `
      <div class="space-y-2">
        <h3 class="font-bold text-sm text-gray-900">${marker.name}</h3>
        <p class="text-xs text-gray-600">${marker.description}</p>
        <div class="flex items-center space-x-1">
          <div class="w-3 h-3 rounded-full" style="background: ${getMarkerColor(marker.type)}"></div>
          <span class="text-xs capitalize font-medium">${marker.type} zone</span>
        </div>
      </div>
    `;

    if (mapContainer.current) {
      mapContainer.current.appendChild(popup);
    }
  };

  const hideMarkerPopup = () => {
    const popup = document.getElementById('marker-popup');
    if (popup) {
      popup.remove();
    }
  };

  const handleMapClick = (e: MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 0.01;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -0.01;
    
    const newLat = center[1] + y;
    const newLng = center[0] + x;
    
    if (onLocationChange) {
      onLocationChange({
        lat: newLat,
        lng: newLng,
        address: `Lat: ${newLat.toFixed(4)}, Lng: ${newLng.toFixed(4)}`
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(newLocation);
          if (onLocationChange) {
            onLocationChange({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location'
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const handleRefresh = () => {
    initializeMap();
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapContainer} className="w-full h-full rounded-lg border border-border" />
      
      {/* Zone Legend */}
      {showControls && (
        <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <h4 className="text-xs font-semibold mb-2">Safety Zones</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span>Safe Zone</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
              <span>Caution Area</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
              <span>Your Location</span>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 space-y-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleGetCurrentLocation}
            className="shadow-lg bg-background/90 backdrop-blur-sm"
            title="Get Current Location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={handleRefresh}
            className="shadow-lg bg-background/90 backdrop-blur-sm"
            title="Refresh Map"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected Location Info */}
      {selectedMarker && (
        <div className="absolute bottom-3 left-3 right-3">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm">{selectedMarker.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedMarker.description}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMarker(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FreeMapComponent;