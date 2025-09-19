import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, RefreshCw, User, Shield, MapPin, Eye } from 'lucide-react';
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
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [locations, setLocations] = useState<TouristLocation[]>([]);
  const [selectedTourist, setSelectedTourist] = useState<TouristLocation | null>(null);
  const [selectedRiskZone, setSelectedRiskZone] = useState<HighRiskZone | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    // Check for saved token in localStorage first
    const savedToken = localStorage.getItem('admin_mapbox_token');
    // Fall back to environment variable
    const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    console.log('AdminMap: Checking tokens...');
    console.log('Saved token:', savedToken ? 'Found' : 'Not found');
    console.log('Env token:', envToken);
    
    if (savedToken && savedToken.length > 10) {
      console.log('Using saved admin token');
      setMapboxToken(savedToken);
      initializeMap(savedToken);
    } else if (envToken && envToken.startsWith('pk.') && envToken.length > 50) {
      console.log('Using environment token for admin');
      setMapboxToken(envToken);
      initializeMap(envToken);
    } else {
      console.log('No valid admin token found, showing input form');
    }
  }, []);

  const initializeMap = async (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      // Dynamic import for mapbox-gl
      const mapboxgl = await import('mapbox-gl');
      
      // Set the access token
      (mapboxgl as any).accessToken = token;

      // Initialize the admin map with satellite view
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [91.7362, 26.1445], // Guwahati coordinates
        zoom: 11,
        pitch: 30,
      });

      // Add enhanced admin controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
      newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      newMap.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

      newMap.on('load', () => {
        // Add high-risk zone geofences
        addHighRiskZones(newMap);
        
        // Load and display all tourist locations
        loadTouristLocations();
        
        // Start real-time updates
        startRealTimeUpdates();
      });

      map.current = newMap;
      setShowTokenInput(false);
      
      // Save token
      localStorage.setItem('admin_mapbox_token', token);

    } catch (error) {
      console.error('Error initializing admin map:', error);
      alert('Error loading admin map. Please check your Mapbox token.');
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

    // Enhanced markers for each tourist with risk-based styling
    touristLocations.forEach((location, index) => {
      const isHighRisk = location.tourist.safety_score < 60;
      const isMediumRisk = location.tourist.safety_score < 80 && location.tourist.safety_score >= 60;
      
      const el = document.createElement('div');
      el.className = 'admin-tourist-marker';
      el.style.cssText = `
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: ${getSafetyColor(location.tourist.safety_score)};
        border: 4px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        position: relative;
        z-index: ${100 + index};
        ${isHighRisk ? 'animation: emergency-pulse 1.5s infinite;' : ''}
      `;

      // Add tourist info display
      const touristInfo = document.createElement('div');
      touristInfo.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      `;
      
      touristInfo.innerHTML = `
        <div style="font-size: 18px; margin-bottom: -2px;">👤</div>
        <div style="font-size: 8px; font-weight: bold;">${location.tourist.safety_score}%</div>
      `;

      el.appendChild(touristInfo);

      // Add verification badge
      if (location.tourist.is_verified) {
        const badge = document.createElement('div');
        badge.style.cssText = `
          position: absolute;
          top: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: #10B981;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
        `;
        badge.innerHTML = '✓';
        el.appendChild(badge);
      }

      // Enhanced emergency pulse animation
      if (isHighRisk && !document.getElementById('emergency-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'emergency-pulse-style';
        style.textContent = `
          @keyframes emergency-pulse {
            0% { 
              transform: scale(1);
              box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 0 0 rgba(239, 68, 68, 0.7);
            }
            50% { 
              transform: scale(1.05);
              box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 0 15px rgba(239, 68, 68, 0);
            }
            100% { 
              transform: scale(1);
              box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 0 0 rgba(239, 68, 68, 0);
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Hover effects
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.zIndex = '1000';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.zIndex = `${100 + index}`;
      });

      // Enhanced popup with admin details
      const popup = new (map.current.constructor as any).Popup({
        offset: 30,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '300px'
      }).setHTML(`
        <div class="admin-tourist-popup p-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2">
              <strong class="text-lg">${location.tourist.name}</strong>
              ${location.tourist.is_verified ? 
                '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>' : 
                '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Unverified</span>'
              }
            </div>
          </div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Digital ID:</span>
              <span class="font-mono font-bold">${location.tourist.digital_id}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Safety Score:</span>
              <span class="px-2 py-1 rounded text-xs font-bold" style="
                background: ${location.tourist.safety_score >= 80 ? '#DCFCE7' : location.tourist.safety_score >= 60 ? '#FEF3C7' : '#FEE2E2'};
                color: ${location.tourist.safety_score >= 80 ? '#166534' : location.tourist.safety_score >= 60 ? '#92400E' : '#991B1B'};
              ">${location.tourist.safety_score}%</span>
            </div>
            
            <div class="border-t pt-2 mt-2">
              <div class="text-gray-600 text-xs mb-1">Current Location:</div>
              <div class="text-xs">${location.address}</div>
            </div>
            
            <div class="flex justify-between text-xs text-gray-500">
              <span>Last Update:</span>
              <span>${getTimeSince(location.updated_at)}</span>
            </div>
            
            <div class="flex justify-between text-xs text-gray-500">
              <span>GPS Accuracy:</span>
              <span>±${location.accuracy}m</span>
            </div>
            
            ${isHighRisk ? `
              <div class="bg-red-50 border border-red-200 rounded p-2 mt-2">
                <div class="flex items-center space-x-1 text-red-800">
                  <span class="text-red-600">⚠</span>
                  <span class="text-xs font-bold">HIGH RISK ALERT</span>
                </div>
                <div class="text-xs text-red-600 mt-1">Tourist requires immediate attention</div>
              </div>
            ` : ''}
          </div>
        </div>
      `);

      const marker = new (map.current.constructor as any).Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current);

      // Handle marker click for admin selection
      el.addEventListener('click', () => {
        setSelectedTourist(location);
        popup.addTo(map.current);
      });

      markersRef.current.push(marker);
    });

    // Enhanced bounds fitting with padding
    if (touristLocations.length > 0) {
      const bounds = new (map.current.constructor as any).LngLatBounds();
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

  if (showTokenInput) {
    return (
      <Card className="p-6 space-y-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-12 w-12 text-red-500" />
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Admin Map Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox token to access the enhanced admin monitoring system
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
            <Shield className="h-4 w-4 mr-2" />
            Initialize Admin Map
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
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="font-semibold text-red-900 mb-2">🔒 Admin Features:</h4>
            <ul className="text-red-800 space-y-1">
              <li>• Real-time monitoring of all {mockTouristData.length} tourists</li>
              <li>• High-risk geofence zones with alert system</li>
              <li>• Emergency pulse notifications for critical safety scores</li>
              <li>• Satellite imagery and enhanced admin controls</li>
              <li>• Detailed tourist profiles with verification status</li>
              <li>• Live location tracking with accuracy indicators</li>
            </ul>
          </div>
        </div>
      </Card>
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

      {/* Loading Overlay */}
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







