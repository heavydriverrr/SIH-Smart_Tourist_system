import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, User, Shield, MapPin, Eye } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/mapbox-custom.css';
import { touristAPI, getSocket } from '@/services/adminApi';

interface HighRiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
  alertCount: number;
  lastAlert?: string;
}

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
  const map = useRef<any>(null);
  const [locations, setLocations] = useState<TouristLocation[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<TouristLocation | null>(null);
  const [selectedRiskZone, setSelectedRiskZone] = useState<HighRiskZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const markersRef = useRef<any[]>([]);

  // Enhanced high-risk zones for admin monitoring
  const highRiskZones: HighRiskZone[] = [
    {
      id: 'forest-danger',
      lat: 26.1200,
      lng: 91.8000,
      radius: 1000,
      name: 'Remote Forest Area',
      riskLevel: 'high',
      description: 'Dense forest with limited mobile coverage and wildlife presence',
      alertCount: 3,
      lastAlert: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'industrial-zone',
      lat: 26.1100,
      lng: 91.7200,
      radius: 800,
      name: 'Industrial Zone',
      riskLevel: 'high',
      description: 'Chemical plant area - restricted access after 8 PM',
      alertCount: 1,
      lastAlert: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'construction-site',
      lat: 26.1350,
      lng: 91.7100,
      radius: 500,
      name: 'Major Construction Site',
      riskLevel: 'medium',
      description: 'Active construction with heavy machinery',
      alertCount: 0
    },
    {
      id: 'river-bank',
      lat: 26.1950,
      lng: 91.7600,
      radius: 300,
      name: 'Unstable River Bank',
      riskLevel: 'medium',
      description: 'Erosion-prone area during monsoon season',
      alertCount: 2,
      lastAlert: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Mock enhanced tourist data with more users
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
      updated_at: new Date(Date.now() - 5 * 60000).toISOString(),
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
      latitude: 26.1150,
      longitude: 91.8050,
      address: 'Near Forest Area, Guwahati',
      accuracy: 15,
      updated_at: new Date(Date.now() - 10 * 60000).toISOString(),
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
      updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
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
      latitude: 26.1120,
      longitude: 91.7180,
      address: 'Near Industrial Zone, Guwahati',
      accuracy: 12,
      updated_at: new Date(Date.now() - 1 * 60000).toISOString(),
      tourist: {
        name: 'David Wilson',
        digital_id: 'GWT005',
        safety_score: 35,
        is_verified: false
      }
    },
    {
      id: '6',
      user_id: 'user6',
      latitude: 26.1500,
      longitude: 91.7500,
      address: 'City Center, Guwahati',
      accuracy: 6,
      updated_at: new Date(Date.now() - 3 * 60000).toISOString(),
      tourist: {
        name: 'Sarah Ahmed',
        digital_id: 'GWT006',
        safety_score: 88,
        is_verified: true
      }
    },
    {
      id: '7',
      user_id: 'user7',
      latitude: 26.1300,
      longitude: 91.7300,
      address: 'Downtown Area, Guwahati',
      accuracy: 4,
      updated_at: new Date(Date.now() - 7 * 60000).toISOString(),
      tourist: {
        name: 'Ravi Sharma',
        digital_id: 'GWT007',
        safety_score: 72,
        is_verified: true
      }
    }
  ];

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Get token from multiple sources (same as user map)
    const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const savedToken = localStorage.getItem('mapbox_token');
    // Multiple fallback tokens to try
    const fallbackTokens = [
      'pk.eyJ1IjoienByYXRoYW14IiwiYTr6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQsA', // Full token
      'pk.eyJ1IjoienByYXRoYW14IiwiYTr6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQs'   // Vercel version
    ];
    
    console.log('🗺️ AdminMap: Initializing Mapbox...');
    console.log('Environment token available:', !!envToken);
    console.log('Environment token length:', envToken?.length || 0);
    console.log('Environment token preview:', envToken ? envToken.substring(0, 20) + '...' : 'undefined');
    console.log('Environment token starts with pk:', envToken?.startsWith('pk.') || false);
    console.log('Running in production:', import.meta.env.PROD);
    
    let tokenToUse = '';
    
    // Priority: environment token > saved token > fallback tokens
    if (envToken && envToken.trim().length > 50 && envToken.trim().startsWith('pk.')) {
      tokenToUse = envToken.trim();
      console.log('✅ AdminMap using environment token');
    } else if (savedToken && savedToken.length > 50 && savedToken.startsWith('pk.')) {
      tokenToUse = savedToken;
      console.log('✅ AdminMap using saved token');
    } else {
      // Try fallback tokens
      for (let i = 0; i < fallbackTokens.length; i++) {
        const fallbackToken = fallbackTokens[i];
        if (fallbackToken && fallbackToken.length > 50 && fallbackToken.startsWith('pk.')) {
          tokenToUse = fallbackToken;
          console.log(`✅ AdminMap using fallback token ${i + 1} (${fallbackToken.length} chars)`);
          break;
        }
      }
    }
    
    if (!tokenToUse) {
      console.error('❌ AdminMap: No valid Mapbox token found');
      setMapError('Mapbox access token is required for admin map.');
      setIsLoadingMap(false);
      return;
    }
    
    // Initialize map with valid token
    setIsLoadingMap(true);
    setMapError(null);
    initializeMap(tokenToUse);
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) {
      setIsLoadingMap(false);
      return;
    }

    try {
      console.log('🗺️ AdminMap initializing with token:', token.substring(0, 20) + '...');
      
      // Set the access token
      mapboxgl.accessToken = token;
      
      // Make mapboxgl available globally
      (window as any).mapboxgl = mapboxgl;

      // Initialize the admin map with streets view for better compatibility
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [91.7362, 26.1445], // Guwahati coordinates
        zoom: 11,
        pitch: 0,
        maxZoom: 18,
        minZoom: 8,
        attributionControl: true
      });

      // Handle map load success
      newMap.on('load', () => {
        console.log('✅ AdminMap loaded successfully!');
        setIsLoadingMap(false);
        setMapError(null);
        
        // Add high-risk zone geofences
        addHighRiskZones(newMap);
        
        // Load and display all tourist locations
        loadTouristLocations();
        
        // Start real-time updates
        startRealTimeUpdates();
      });
      
      // Handle map load errors
      newMap.on('error', (e) => {
        console.error('❌ AdminMap error details:', e);
        console.log('Error type:', e.error?.message || 'Unknown error');
        console.log('Token being used:', token);
        
        let errorMessage = 'Failed to load admin map tiles.';
        
        if (e.error?.message?.includes('Unauthorized') || e.error?.status === 401) {
          errorMessage = 'Invalid Mapbox token for admin map.';
        } else if (e.error?.message?.includes('rate limit') || e.error?.status === 429) {
          errorMessage = 'Mapbox rate limit exceeded.';
        } else if (e.error?.message?.includes('network') || e.error?.status === 0) {
          errorMessage = 'Network error loading admin map.';
        }
        
        setMapError(`${errorMessage} (Status: ${e.error?.status || 'unknown'})`);
        setIsLoadingMap(false);
      });

      // Add enhanced admin controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

      map.current = newMap;
      
      // Save token
      localStorage.setItem('mapbox_token', token);

    } catch (error) {
      console.error('❌ AdminMap initialization failed:', error);
      setMapError(`Failed to initialize admin map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingMap(false);
    }
  };
  
  const addHighRiskZones = (mapInstance: any) => {
    highRiskZones.forEach((zone) => {
      const sourceId = `admin-risk-zone-${zone.id}`;
      const layerId = `admin-risk-zone-layer-${zone.id}`;
      
      // Create circle data for geofence
      const circleData = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [zone.lng, zone.lat]
        },
        properties: {
          radius: zone.radius,
          riskLevel: zone.riskLevel,
          name: zone.name,
          description: zone.description,
          alertCount: zone.alertCount,
          lastAlert: zone.lastAlert
        }
      };

      // Add source
      mapInstance.addSource(sourceId, {
        type: 'geojson',
        data: circleData
      });

      // Add circle layer with enhanced styling
      mapInstance.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': {
            stops: [
              [9, zone.radius / 200],
              [12, zone.radius / 100],
              [16, zone.radius / 20]
            ]
          },
          'circle-color': zone.riskLevel === 'high' ? '#DC2626' : 
                         zone.riskLevel === 'medium' ? '#EA580C' : '#16A34A',
          'circle-opacity': 0.2,
          'circle-stroke-width': {
            stops: [
              [9, 1],
              [12, 2],
              [16, 3]
            ]
          },
          'circle-stroke-color': zone.riskLevel === 'high' ? '#B91C1C' : 
                                zone.riskLevel === 'medium' ? '#C2410C' : '#15803D',
          'circle-stroke-opacity': 0.8
        }
      });

      // Add center marker for zone
      const markerEl = document.createElement('div');
      markerEl.className = 'admin-risk-marker';
      markerEl.style.cssText = `
        width: 30px;
        height: 30px;
        background: ${zone.riskLevel === 'high' ? '#DC2626' : zone.riskLevel === 'medium' ? '#EA580C' : '#16A34A'};
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        animation: pulse-admin 2s infinite;
      `;
      markerEl.textContent = '⚠';

      // Add pulsing animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-admin {
          0% { box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 0 ${zone.riskLevel === 'high' ? 'rgba(220, 38, 38, 0.7)' : 'rgba(234, 88, 12, 0.7)'}; }
          70% { box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 10px rgba(220, 38, 38, 0); }
          100% { box-shadow: 0 2px 10px rgba(0,0,0,0.3), 0 0 0 0 rgba(220, 38, 38, 0); }
        }
      `;
      document.head.appendChild(style);

      const riskMarker = new (mapboxgl as any).Marker(markerEl)
        .setLngLat([zone.lng, zone.lat])
        .addTo(mapInstance);

      // Add click handler for risk zones
      markerEl.addEventListener('click', () => {
        setSelectedRiskZone(zone);
        
        const popup = new (mapboxgl as any).Popup({ offset: 25 })
          .setLngLat([zone.lng, zone.lat])
          .setHTML(`
            <div class="p-3 min-w-[250px]">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-bold text-sm">${zone.name}</h3>
                <span class="text-xs px-2 py-1 rounded" style="background: ${
                  zone.riskLevel === 'high' ? '#FEE2E2' : 
                  zone.riskLevel === 'medium' ? '#FEF3C7' : '#DCFCE7'
                }; color: ${
                  zone.riskLevel === 'high' ? '#991B1B' : 
                  zone.riskLevel === 'medium' ? '#92400E' : '#166534'
                }">
                  ${zone.riskLevel.toUpperCase()} RISK
                </span>
              </div>
              <p class="text-xs text-gray-600 mb-2">${zone.description}</p>
              <div class="text-xs space-y-1">
                <div class="flex justify-between">
                  <span>Coverage:</span>
                  <span class="font-mono">${zone.radius}m radius</span>
                </div>
                <div class="flex justify-between">
                  <span>Alerts Today:</span>
                  <span class="font-bold ${zone.alertCount > 0 ? 'text-red-600' : 'text-green-600'}">${zone.alertCount}</span>
                </div>
                ${zone.lastAlert ? `
                  <div class="flex justify-between">
                    <span>Last Alert:</span>
                    <span class="text-gray-500">${new Date(zone.lastAlert).toLocaleTimeString()}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          `)
          .addTo(mapInstance);
      });
    });
  };
  
  const startRealTimeUpdates = () => {
    // Set up real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on('location-update', handleLocationUpdate);
      socket.on('new-alert', handleNewAlert);
    }
  };

  const loadTouristLocations = async () => {
    try {
      setLoading(true);
      
      // Simulate API call with enhanced mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use mock data for demonstration - in production, replace with actual API call
      setLocations(mockTouristData);
      if (map.current) {
        updateMapMarkers(mockTouristData);
      }
      setError('');
      
    } catch (error: any) {
      console.error('Error loading locations:', error);
      setError('Failed to load tourist locations');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken.trim());
    }
  };

  const updateMapMarkers = (touristLocations: TouristLocation[]) => {
    if (!map.current) return;

    // Clear existing tourist markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Simple blue dot markers for all tourists (like user location)
    touristLocations.forEach((location, index) => {
      // Create blue dot marker similar to user location in user map
      const el = document.createElement('div');
      el.className = 'admin-tourist-marker';
      el.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #4285F4;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(66, 133, 244, 0.4);
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        z-index: ${100 + index};
      `;

      // Add hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = '1000';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = `${100 + index}`;
      });

      // Simple popup with tourist info
      const popup = new mapboxgl.Popup({
        offset: 15,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px'
      }).setHTML(`
        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <strong class="text-sm">${location.tourist.name}</strong>
            ${location.tourist.is_verified ? 
              '<span class="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">Verified</span>' : 
              '<span class="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded">Unverified</span>'
            }
          </div>
          
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-gray-600">ID:</span>
              <span class="font-mono">${location.tourist.digital_id}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Safety Score:</span>
              <span class="font-bold" style="color: ${getSafetyColor(location.tourist.safety_score)}">
                ${location.tourist.safety_score}%
              </span>
            </div>
            
            <div class="pt-1 border-t">
              <div class="text-gray-600 mb-1">Location:</div>
              <div class="text-gray-800">${location.address}</div>
            </div>
            
            <div class="flex justify-between text-gray-500">
              <span>Updated:</span>
              <span>${getTimeSince(location.updated_at)}</span>
            </div>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Handle marker click
      el.addEventListener('click', () => {
        setSelectedTourist(location);
      });

      markersRef.current.push(marker);
    });

    // Enhanced bounds fitting with padding
    if (touristLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      touristLocations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      
      // Add some padding and ensure good zoom level
      map.current.fitBounds(bounds, { 
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14
      });
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

  // Show loading state for map initialization
  if (isLoadingMap) {
    return (
      <div className="relative h-full w-full rounded-lg bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Admin Map</h2>
          <p className="text-gray-600">Initializing tourist monitoring system...</p>
        </div>
      </div>
    );
  }
  
  // Show error state for map initialization
  if (mapError) {
    return (
      <div className="relative h-full w-full rounded-lg bg-red-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">Admin Map Error</h2>
          <p className="text-red-700 mb-4">{mapError}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (error && locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Admin Map Error</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  const highRiskCount = locations.filter(l => l.tourist.safety_score < 60).length;
  const mediumRiskCount = locations.filter(l => l.tourist.safety_score >= 60 && l.tourist.safety_score < 80).length;
  const safeCount = locations.filter(l => l.tourist.safety_score >= 80).length;
  const verifiedCount = locations.filter(l => l.tourist.is_verified).length;
  const totalAlerts = highRiskZones.reduce((sum, zone) => sum + zone.alertCount, 0);

  return (
    <div className="relative h-full w-full">
      {/* Enhanced Admin Map Container */}
      <div ref={mapContainer} className="h-full w-full rounded-lg" />
      
      {/* Enhanced Admin Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button
          onClick={handleRefresh}
          variant="secondary"
          size="sm"
          className="bg-white/95 backdrop-blur shadow-lg hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync Data
        </Button>
        
        <Button
          onClick={handleFitBounds}
          variant="secondary"
          size="sm"
          className="bg-white/95 backdrop-blur shadow-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Center View
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/95 backdrop-blur shadow-lg hover:bg-green-50 hover:text-green-700 hover:border-green-300"
          title="Admin Tools"
        >
          <Shield className="h-4 w-4 mr-2" />
          Monitor
        </Button>
      </div>

      {/* Map Loading Overlay */}
      {isLoadingMap && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Loading Admin Map...</p>
              <p className="text-xs text-muted-foreground">Initializing tourist monitoring system</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tourist Data Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-3 text-red-500" />
            <p className="text-base font-medium text-gray-900">Syncing Tourist Data...</p>
            <p className="text-sm text-muted-foreground">Loading {mockTouristData.length} active locations</p>
          </div>
        </div>
      )}

      {/* Enhanced Admin Stats Panel */}
      <div className="absolute bottom-4 left-4">
        <Card className="bg-white/95 backdrop-blur shadow-lg border border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Live Dashboard</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                </div>
              </div>
              
              {/* Tourist Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{locations.length} Active Tourists</span>
                </div>
                <span className="text-xs text-gray-500">{verifiedCount} verified</span>
              </div>
              
              {/* Safety Distribution */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-1">Safety Distribution:</div>
                <div className="flex space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-700">{safeCount}</span>
                    <span className="text-gray-500">Safe</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-orange-700">{mediumRiskCount}</span>
                    <span className="text-gray-500">Caution</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-red-700">{highRiskCount}</span>
                    <span className="text-gray-500">Alert</span>
                  </div>
                </div>
              </div>
              
              {/* Risk Zones Stats */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Risk Zones:</span>
                  <span className="text-xs font-medium">{highRiskZones.length} active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Total Alerts:</span>
                  <span className={`text-xs font-medium ${totalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalAlerts} today
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Tourist Enhanced Info Panel */}
      {selectedTourist && (
        <div className="absolute top-4 left-4 w-96">
          <Card className="bg-white/98 backdrop-blur shadow-xl border-2" 
                style={{ borderColor: getSafetyColor(selectedTourist.tourist.safety_score) }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                         style={{ background: getSafetyColor(selectedTourist.tourist.safety_score) }}>
                      👤
                    </div>
                    {selectedTourist.tourist.is_verified && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{selectedTourist.tourist.name}</h3>
                    <p className="text-sm text-gray-500">Digital ID: {selectedTourist.tourist.digital_id}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTourist(null)}
                  className="hover:bg-gray-100"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3">
                {/* Safety Score */}
                <div className="flex items-center justify-between p-3 rounded-lg" 
                     style={{ backgroundColor: `${getSafetyColor(selectedTourist.tourist.safety_score)}15` }}>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" style={{ color: getSafetyColor(selectedTourist.tourist.safety_score) }} />
                    <span className="font-medium">Safety Score</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg" style={{ color: getSafetyColor(selectedTourist.tourist.safety_score) }}>
                      {selectedTourist.tourist.safety_score}%
                    </span>
                    <Badge
                      variant={selectedTourist.tourist.safety_score >= 80 ? 'default' : 
                              selectedTourist.tourist.safety_score >= 60 ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {selectedTourist.tourist.safety_score >= 80 ? 'SAFE' : 
                       selectedTourist.tourist.safety_score >= 60 ? 'CAUTION' : 'ALERT'}
                    </Badge>
                  </div>
                </div>
                
                {/* Location Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-700 mb-2">Current Location:</div>
                  <p className="text-sm text-gray-800 mb-2">{selectedTourist.address}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Last Update: {getTimeSince(selectedTourist.updated_at)}</span>
                    <span>Accuracy: ±{selectedTourist.accuracy}m</span>
                  </div>
                </div>
                
                {/* Status Indicators */}
                <div className="flex space-x-2 text-xs">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded ${
                    selectedTourist.tourist.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      selectedTourist.tourist.is_verified ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span>{selectedTourist.tourist.is_verified ? 'Verified' : 'Unverified'}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 px-2 py-1 rounded bg-blue-100 text-blue-800">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <span>Live Tracking</span>
                  </div>
                </div>
                
                {/* Emergency Alert for High Risk */}
                {selectedTourist.tourist.safety_score < 60 && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <div>
                        <div className="text-sm font-bold text-red-800">HIGH RISK ALERT</div>
                        <div className="text-xs text-red-600">Immediate attention required - Contact tourist</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Risk Zone Panel */}
      {selectedRiskZone && (
        <div className="absolute top-1/2 right-4 w-80 transform -translate-y-1/2">
          <Card className="bg-white/98 backdrop-blur shadow-xl border-2"
                style={{ borderColor: selectedRiskZone.riskLevel === 'high' ? '#DC2626' : '#EA580C' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                       style={{ background: selectedRiskZone.riskLevel === 'high' ? '#DC2626' : '#EA580C' }}>
                    ⚠
                  </div>
                  <h3 className="font-bold">{selectedRiskZone.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRiskZone(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3 text-sm">
                <p className="text-gray-700">{selectedRiskZone.description}</p>
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Risk Level:</span>
                      <div className={`font-bold uppercase ${
                        selectedRiskZone.riskLevel === 'high' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {selectedRiskZone.riskLevel}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Coverage:</span>
                      <div className="font-mono font-bold">{selectedRiskZone.radius}m</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Alerts Today:</span>
                      <div className={`font-bold ${
                        selectedRiskZone.alertCount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {selectedRiskZone.alertCount}
                      </div>
                    </div>
                    {selectedRiskZone.lastAlert && (
                      <div>
                        <span className="text-gray-500">Last Alert:</span>
                        <div className="text-gray-700 font-medium">
                          {new Date(selectedRiskZone.lastAlert).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Legend */}
      <div className="absolute bottom-4 right-4">
        <Card className="bg-white/95 backdrop-blur shadow-lg">
          <CardContent className="p-3">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-700 flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Map Legend</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">Tourist Safety:</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Safe (80%+)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span>Caution (60-79%)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Alert (&lt;60%)</span>
                  </div>
                </div>
                
                <div className="border-t pt-2 space-y-1">
                  <div className="text-xs font-medium text-gray-600">Risk Zones:</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-red-600 bg-red-600/20 rounded-full"></div>
                    <span>High Risk Areas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-orange-600 bg-orange-600/20 rounded-full"></div>
                    <span>Medium Risk Areas</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMap;







