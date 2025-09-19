import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, User, Shield, MapPin } from 'lucide-react';

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

const FreeAdminMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<TouristLocation[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<TouristLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapInitialized = useRef(false);

  // Mock tourist data for demonstration - in real app this would come from API
  const mockTouristData: TouristLocation[] = [
    {
      id: '1',
      user_id: 'user1',
      latitude: 26.1665,
      longitude: 91.7047,
      address: 'Near Kamakhya Temple, Guwahati',
      accuracy: 5,
      updated_at: new Date().toISOString(),
      tourist: {
        name: 'Raj Kumar',
        digital_id: 'GWT001',
        safety_score: 85,
        is_verified: true
      }
    },
    {
      id: '2',
      user_id: 'user2',
      latitude: 26.1844,
      longitude: 91.7458,
      address: 'Umananda Island, Guwahati',
      accuracy: 8,
      updated_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      tourist: {
        name: 'Priya Singh',
        digital_id: 'GWT002',
        safety_score: 92,
        is_verified: true
      }
    },
    {
      id: '3',
      user_id: 'user3',
      latitude: 26.1200,
      longitude: 91.8000,
      address: 'Remote Forest Area, Guwahati',
      accuracy: 15,
      updated_at: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
      tourist: {
        name: 'Mike Johnson',
        digital_id: 'GWT003',
        safety_score: 45,
        is_verified: false
      }
    },
    {
      id: '4',
      user_id: 'user4',
      latitude: 26.1791,
      longitude: 91.7847,
      address: 'Assam State Zoo, Guwahati',
      accuracy: 3,
      updated_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
      tourist: {
        name: 'Anjali Devi',
        digital_id: 'GWT004',
        safety_score: 78,
        is_verified: true
      }
    },
    {
      id: '5',
      user_id: 'user5',
      latitude: 26.1350,
      longitude: 91.7200,
      address: 'Construction Zone, Guwahati',
      accuracy: 12,
      updated_at: new Date(Date.now() - 1 * 60000).toISOString(), // 1 minute ago
      tourist: {
        name: 'David Wilson',
        digital_id: 'GWT005',
        safety_score: 60,
        is_verified: false
      }
    }
  ];

  useEffect(() => {
    if (!mapContainer.current || mapInitialized.current) return;
    
    initializeMap();
    loadTouristLocations();
    mapInitialized.current = true;
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    const mapDiv = mapContainer.current;
    mapDiv.innerHTML = '';

    // Create map viewport
    const viewport = document.createElement('div');
    viewport.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 30%, #10b981 70%, #059669 100%);
      overflow: hidden;
      border-radius: 8px;
      cursor: grab;
    `;

    // Add map grid
    const grid = document.createElement('div');
    grid.style.cssText = `
      position: absolute;
      width: 300%;
      height: 300%;
      background-image: 
        linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: 40px 40px;
      animation: admin-grid-move 30s linear infinite;
      transform: translate(-50%, -50%);
      top: 50%;
      left: 50%;
    `;
    viewport.appendChild(grid);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes admin-grid-move {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      .admin-marker-pulse {
        animation: admin-pulse 3s infinite;
      }
      @keyframes admin-pulse {
        0% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        50% { transform: translate(-50%, -50%) scale(1.15); box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
        100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
      }
      .admin-marker:hover {
        transform: translate(-50%, -50%) scale(1.3) !important;
        z-index: 1000 !important;
      }
    `;
    document.head.appendChild(style);

    mapDiv.appendChild(viewport);
  };

  const loadTouristLocations = async () => {
    try {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLocations(mockTouristData);
      updateMapMarkers(mockTouristData);
      setError('');
    } catch (error: any) {
      console.error('Error loading locations:', error);
      setError('Failed to load tourist locations');
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (touristLocations: TouristLocation[]) => {
    if (!mapContainer.current) return;

    const viewport = mapContainer.current.querySelector('div');
    if (!viewport) return;

    // Remove existing tourist markers (keep grid)
    const existingMarkers = viewport.querySelectorAll('.admin-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Calculate center point for positioning
    const centerLat = 26.1445; // Guwahati center
    const centerLng = 91.7362;

    touristLocations.forEach((location, index) => {
      const markerEl = document.createElement('div');
      markerEl.className = 'admin-marker admin-marker-pulse';
      
      // Calculate relative position
      const relativeX = (location.longitude - centerLng) * 2000 + 50;
      const relativeY = (centerLat - location.latitude) * 2000 + 50;
      
      markerEl.style.cssText = `
        position: absolute;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: ${getSafetyColor(location.tourist.safety_score)};
        border: 4px solid white;
        cursor: pointer;
        z-index: ${100 + index};
        left: ${Math.max(5, Math.min(95, relativeX))}%;
        top: ${Math.max(5, Math.min(95, relativeY))}%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;

      // Add tourist info
      const touristInfo = document.createElement('div');
      touristInfo.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
      `;
      
      touristInfo.innerHTML = `
        <div style="font-size: 14px;">👤</div>
        <div style="font-size: 8px; margin-top: -2px;">${location.tourist.safety_score}%</div>
      `;

      markerEl.appendChild(touristInfo);

      // Add click handler
      markerEl.addEventListener('click', () => {
        setSelectedTourist(location);
        showTouristPopup(location, markerEl);
      });

      // Add hover effect
      markerEl.addEventListener('mouseenter', () => {
        showTouristPopup(location, markerEl);
      });

      markerEl.addEventListener('mouseleave', () => {
        hideTouristPopup();
      });

      markerEl.title = `${location.tourist.name} - ${location.tourist.safety_score}% Safe`;

      viewport.appendChild(markerEl);
    });
  };

  const getSafetyColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 60) return '#F59E0B'; // Orange  
    return '#EF4444'; // Red
  };

  const showTouristPopup = (location: TouristLocation, element: HTMLElement) => {
    hideTouristPopup();

    const popup = document.createElement('div');
    popup.id = 'admin-tourist-popup';
    popup.style.cssText = `
      position: absolute;
      background: white;
      border: 2px solid ${getSafetyColor(location.tourist.safety_score)};
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      z-index: 2000;
      min-width: 280px;
      max-width: 320px;
      left: ${element.offsetLeft + 60}px;
      top: ${Math.max(10, element.offsetTop - 20)}px;
    `;

    const timeSince = getTimeSince(location.updated_at);
    const verifiedBadge = location.tourist.is_verified ? 
      '<span style="color: #10B981; font-weight: bold;">✓ Verified</span>' : 
      '<span style="color: #EF4444; font-weight: bold;">⚠ Unverified</span>';

    popup.innerHTML = `
      <div style="font-family: system-ui; line-height: 1.4;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold; color: #1f2937;">${location.tourist.name}</h3>
          ${verifiedBadge}
        </div>
        
        <div style="margin-bottom: 8px;">
          <span style="color: #6b7280; font-size: 12px;">Digital ID:</span>
          <span style="font-family: monospace; font-size: 14px; font-weight: bold; margin-left: 8px;">${location.tourist.digital_id}</span>
        </div>
        
        <div style="margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 12px;">Safety Score:</span>
          <span style="
            display: inline-block;
            background: ${getSafetyColor(location.tourist.safety_score)};
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
          ">${location.tourist.safety_score}%</span>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-bottom: 8px;">
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">Current Location:</div>
          <div style="font-size: 13px; color: #374151;">${location.address}</div>
        </div>
        
        <div style="display: flex; justify-content: space-between; color: #9ca3af; font-size: 10px;">
          <span>Last Update: ${timeSince}</span>
          <span>±${location.accuracy}m accuracy</span>
        </div>
      </div>
    `;

    if (mapContainer.current) {
      mapContainer.current.appendChild(popup);
    }
  };

  const hideTouristPopup = () => {
    const popup = document.getElementById('admin-tourist-popup');
    if (popup) {
      popup.remove();
    }
  };

  const getTimeSince = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleRefresh = () => {
    loadTouristLocations();
  };

  const handleFitBounds = () => {
    // Re-initialize map to show all markers
    if (mapContainer.current) {
      updateMapMarkers(locations);
    }
  };

  const handleLocationUpdate = (data: any) => {
    console.log('Location update received:', data);
    loadTouristLocations();
  };

  const handleNewAlert = (data: any) => {
    console.log('New alert received:', data);
    loadTouristLocations();
  };

  if (error && locations.length === 0) {
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
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">Live</span>
              </div>
            </div>
            <div className="mt-2 flex space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span>{locations.filter(l => l.tourist.safety_score >= 80).length} Safe</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <span>{locations.filter(l => l.tourist.safety_score >= 60 && l.tourist.safety_score < 80).length} Caution</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <span>{locations.filter(l => l.tourist.safety_score < 60).length} Alert</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Tourist Info */}
      {selectedTourist && (
        <div className="absolute top-4 left-4 w-80">
          <Card className="bg-white/95 backdrop-blur shadow-lg border-2" style={{ borderColor: getSafetyColor(selectedTourist.tourist.safety_score) }}>
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
                  <span>{getTimeSince(selectedTourist.updated_at)}</span>
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

export default FreeAdminMap;