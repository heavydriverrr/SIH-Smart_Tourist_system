import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/mapbox-custom.css';

interface MapComponentProps {
  center: [number, number];
  onLocationChange: (location: { lat: number; lng: number; address: string }) => void;
}

interface HighRiskZone {
  id: string;
  lat: number;
  lng: number;
  radius: number; // in meters
  name: string;
  riskLevel: 'high' | 'medium' | 'low';
  description: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, onLocationChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false); // Changed to false to load map immediately
  const [map, setMap] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>(center);
  const [selectedZone, setSelectedZone] = useState<HighRiskZone | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null);

  // High-risk zones with geofences around Guwahati
  const highRiskZones: HighRiskZone[] = [
    {
      id: 'forest-danger',
      lat: 26.1200,
      lng: 91.8000,
      radius: 1000, // 1km radius
      name: 'Remote Forest Area',
      riskLevel: 'high',
      description: 'Dense forest with limited mobile coverage and wildlife presence'
    },
    {
      id: 'industrial-zone',
      lat: 26.1100,
      lng: 91.7200,
      radius: 800,
      name: 'Industrial Zone',
      riskLevel: 'high',
      description: 'Chemical plant area - restricted access after 8 PM'
    },
    {
      id: 'construction-site',
      lat: 26.1350,
      lng: 91.7100,
      radius: 500,
      name: 'Major Construction Site',
      riskLevel: 'medium',
      description: 'Active construction with heavy machinery - avoid during work hours'
    },
    {
      id: 'river-bank',
      lat: 26.1950,
      lng: 91.7600,
      radius: 300,
      name: 'Unstable River Bank',
      riskLevel: 'medium',
      description: 'Erosion-prone area during monsoon season'
    }
  ];

  // Safe tourist zones
  const [touristZones] = useState([
    {
      id: 1,
      name: 'Kamakhya Temple',
      lat: 26.1665,
      lng: 91.7047,
      type: 'safe',
      description: 'Major tourist attraction - Safe zone with high security'
    },
    {
      id: 2,
      name: 'Umananda Temple',
      lat: 26.1844,
      lng: 91.7458,
      type: 'safe',
      description: 'Peacock Island - Safe zone with ferry access'
    },
    {
      id: 3,
      name: 'Assam State Zoo',
      lat: 26.1791,
      lng: 91.7847,
      type: 'safe',
      description: 'Family-friendly safe zone with security'
    }
  ]);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Get token from multiple sources
    const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    const savedToken = localStorage.getItem('mapbox_token');
    // Multiple fallback tokens to try
    const fallbackTokens = [
      'pk.eyJ1IjoienByYXRoYW14IiwiYTr6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQsA', // Full token
      'pk.eyJ1IjoienByYXRoYW14IiwiYTr6ImNtZnIyd2xoYzA0Ymwya3NkejFqemhkMW0ifQ.Da77w6Dyml0JEuHHc_RQs'   // Vercel version
    ];
    
    console.log('🗺️ MapComponent: Initializing Mapbox...');
    console.log('Environment token available:', !!envToken);
    console.log('Environment token length:', envToken?.length || 0);
    console.log('Environment token preview:', envToken ? envToken.substring(0, 20) + '...' : 'undefined');
    console.log('Environment token starts with pk:', envToken?.startsWith('pk.') || false);
    console.log('Running in production:', import.meta.env.PROD);
    console.log('All env vars:', Object.keys(import.meta.env));
    
    let tokenToUse = '';
    
    // Priority: environment token > saved token > fallback tokens
    if (envToken && envToken.trim().length > 50 && envToken.trim().startsWith('pk.')) {
      tokenToUse = envToken.trim();
      console.log('✅ Using environment token');
    } else if (savedToken && savedToken.length > 50 && savedToken.startsWith('pk.')) {
      tokenToUse = savedToken;
      console.log('✅ Using saved token');
    } else {
      // Try fallback tokens
      for (let i = 0; i < fallbackTokens.length; i++) {
        const fallbackToken = fallbackTokens[i];
        if (fallbackToken && fallbackToken.length > 50 && fallbackToken.startsWith('pk.')) {
          tokenToUse = fallbackToken;
          console.log(`✅ Using fallback token ${i + 1} (${fallbackToken.length} chars)`);
          break;
        }
      }
    }
    
    if (!tokenToUse) {
      console.error('❌ No valid Mapbox token found');
      console.log('Environment token:', envToken ? envToken.substring(0, 20) + '...' : 'undefined');
      console.log('Environment variable VITE_MAPBOX_ACCESS_TOKEN exists:', !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN);
      console.log('All environment variables:', Object.keys(import.meta.env));
      
      // Show token input form for manual entry
      setMapError('Mapbox access token is required. Please add your token or contact support.');
      setIsLoadingMap(false);
      setShowTokenInput(true);
      return;
    }
    
    // Initialize map with valid token
    setMapboxToken(tokenToUse);
    setIsLoadingMap(true);
    setMapError(null);
    setShowTokenInput(false);
    initializeMap(tokenToUse);
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) {
      setIsLoadingMap(false);
      return;
    }

    try {
      console.log('🗺️ Initializing Mapbox with token:', token.substring(0, 20) + '...');
      console.log('Full token (for debugging):', token);
      console.log('Token length:', token.length);
      console.log('User Agent:', navigator.userAgent);
      console.log('Current URL:', window.location.href);
      
      // Validate token format more thoroughly
      if (!token.startsWith('pk.')) {
        throw new Error('Invalid token format: must start with pk.');
      }
      
      if (token.length < 80) {
        throw new Error('Token appears to be incomplete or truncated');
      }
      
      // Set the access token
      mapboxgl.accessToken = token;
      console.log('Mapbox access token set successfully');
      
      // Make mapboxgl available globally for marker functions
      (window as any).mapboxgl = mapboxgl;

      // Try multiple map styles for better compatibility
      const mapStyles = [
        'mapbox://styles/mapbox/streets-v12',
        'mapbox://styles/mapbox/outdoors-v12', 
        'mapbox://styles/mapbox/light-v11',
        'mapbox://styles/mapbox/satellite-streets-v12'
      ];
      
      const primaryStyle = mapStyles[0]; // Use streets as primary for better reliability
      
      console.log('Attempting to create map with style:', primaryStyle);
      console.log('Map container exists:', !!mapContainer.current);
      console.log('Token validated:', token.length, 'characters');
      
      // Initialize the map
      const newMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: primaryStyle,
        center: center,
        zoom: 12,
        pitch: 0,
        maxZoom: 18,
        minZoom: 8,
        attributionControl: true,
        // Add additional options for better compatibility
        transformRequest: (url, resourceType) => {
          console.log('Mapbox API request:', resourceType, url);
          return { url };
        }
      });
      
      // Handle map load success
      newMap.on('load', () => {
        console.log('✅ Map loaded successfully!');
        setIsLoadingMap(false);
        setMapError(null);
        setShowTokenInput(false);
        
        // Customize attribution styling (make it less prominent)
        setTimeout(() => {
          const attributionElements = document.querySelectorAll('.mapboxgl-ctrl-attrib');
          attributionElements.forEach((element: any) => {
            if (element) {
              element.style.fontSize = '9px';
              element.style.opacity = '0.5';
              element.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
              element.style.backdropFilter = 'blur(4px)';
              element.style.borderRadius = '4px';
              element.style.padding = '1px 4px';
              element.style.maxWidth = '180px';
              element.style.overflow = 'hidden';
              element.style.textOverflow = 'ellipsis';
              element.style.whiteSpace = 'nowrap';
            }
          });
          
          // Also style the attribution links
          const attributionLinks = document.querySelectorAll('.mapboxgl-ctrl-attrib a');
          attributionLinks.forEach((link: any) => {
            if (link) {
              link.style.color = '#666';
              link.style.textDecoration = 'none';
            }
          });
        }, 1000);
      });
      
      // Handle map load errors
      newMap.on('error', (e) => {
        console.error('❌ Mapbox error details:', e);
        console.log('Error object:', JSON.stringify(e, null, 2));
        console.log('Error type:', e.error?.message || 'Unknown error');
        console.log('Token being used:', token);
        console.log('Map style used:', primaryStyle);
        console.log('Network online:', navigator.onLine);
        console.log('Mapbox GL JS version:', mapboxgl.version);
        
        // Test token with direct API call
        fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`)
          .then(response => {
            console.log('Direct API test status:', response.status);
            console.log('Direct API test ok:', response.ok);
            return response.text();
          })
          .then(data => console.log('Direct API response:', data.substring(0, 200)))
          .catch(apiError => console.error('Direct API test failed:', apiError));
        
        let errorMessage = 'Failed to load map tiles.';
        
        if (e.error?.message?.includes('Unauthorized') || e.error?.status === 401) {
          errorMessage = 'Invalid Mapbox token. Token authentication failed.';
        } else if (e.error?.message?.includes('rate limit') || e.error?.status === 429) {
          errorMessage = 'Mapbox rate limit exceeded. Please try again later.';
        } else if (e.error?.message?.includes('network') || e.error?.status === 0) {
          errorMessage = 'Network error loading map tiles. Please check your connection.';
        } else if (e.error?.status === 404) {
          errorMessage = 'Map style not found. Using outdated Mapbox style.';
        }
        
        setMapError(`${errorMessage} (Status: ${e.error?.status || 'unknown'})`);
        setIsLoadingMap(false);
      });

      // Add navigation controls
      newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add risk zones and safe zones after the map loads
      newMap.on('load', () => {
        console.log('Map adding risk zones and safe zones...');
        addHighRiskZones(newMap);
        addSafeZoneMarkers(newMap);
        addUserLocationMarker(newMap);
        startLocationTracking(newMap);
      });

      setMap(newMap);
      
      // Save token to localStorage
      localStorage.setItem('mapbox_token', token);

      // Map is ready for interaction (removed click handler that was causing issues)

    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setMapError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoadingMap(false);
      setShowTokenInput(true);
    }
  };
  
  const initializeFallbackMap = () => {
    if (!mapContainer.current) return;
    
    // Create a simple static map representation
    const fallbackMapElement = document.createElement('div');
    fallbackMapElement.className = 'fallback-map';
    fallbackMapElement.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    `;
    
    fallbackMapElement.innerHTML = `
      <div style="
        background: rgba(255, 255, 255, 0.95);
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        max-width: 300px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">Interactive Map</h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">Your current location: Guwahati, Assam</p>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 16px;">
          <div style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite;"></div>
          <span style="color: #10b981; font-size: 12px; font-weight: 500;">GPS Active</span>
        </div>
        <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-top: 12px;">
          <div style="font-size: 12px; color: #4b5563; margin-bottom: 8px; font-weight: 500;">Safety Features Active:</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; color: #6b7280;">
            <div>🟢 Safe Zones</div>
            <div>🔴 Risk Areas</div>
            <div>📍 Location Tracking</div>
            <div>🚨 Emergency SOS</div>
          </div>
        </div>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
    
    // Clear container and add fallback map
    mapContainer.current.innerHTML = '';
    mapContainer.current.appendChild(fallbackMapElement);
    
    console.log('✅ Fallback map initialized');
  };
  
  const addHighRiskZones = (map: any) => {
    highRiskZones.forEach((zone) => {
      const sourceId = `risk-zone-${zone.id}`;
      const layerId = `risk-zone-layer-${zone.id}`;
      
      // Create circle data
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
          description: zone.description
        }
      };

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: circleData
      });

      // Add circle layer
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': {
            stops: [
              [10, zone.radius / 100],
              [15, zone.radius / 50],
              [20, zone.radius / 10]
            ]
          },
          'circle-color': zone.riskLevel === 'high' ? '#EF4444' : 
                         zone.riskLevel === 'medium' ? '#F59E0B' : '#10B981',
          'circle-opacity': 0.3,
          'circle-stroke-width': 2,
          'circle-stroke-color': zone.riskLevel === 'high' ? '#DC2626' : 
                                zone.riskLevel === 'medium' ? '#D97706' : '#059669',
          'circle-stroke-opacity': 0.8
        }
      });

      // Add click handler for zones
      map.on('click', layerId, (e: any) => {
        setSelectedZone(zone);
        
        // Create popup
        new mapboxgl.Popup()
          .setLngLat([zone.lng, zone.lat])
          .setHTML(`
            <div class="p-3 min-w-[200px]">
              <h3 class="font-bold text-sm mb-2">${zone.name}</h3>
              <p class="text-xs text-gray-600 mb-2">${zone.description}</p>
              <div class="flex items-center space-x-2">
                <div class="w-3 h-3 rounded-full" style="background: ${
                  zone.riskLevel === 'high' ? '#EF4444' : 
                  zone.riskLevel === 'medium' ? '#F59E0B' : '#10B981'
                }"></div>
                <span class="text-xs font-medium capitalize">${zone.riskLevel} Risk</span>
              </div>
              <p class="text-xs text-gray-500 mt-2">Radius: ${zone.radius}m</p>
            </div>
          `)
          .addTo(map);
      });

      // Change cursor on hover
      map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
      });
    });
  };

  const addSafeZoneMarkers = (map: any) => {
    const mapboxgl = (window as any).mapboxgl;
    
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
              <div class="flex items-center space-x-1 mt-1">
                <div class="w-3 h-3 rounded-full" style="background: ${color}"></div>
                <span class="text-xs capitalize font-medium">${zone.type} zone</span>
              </div>
            </div>
          `)
        )
        .addTo(map);
    });
  };

  const addUserLocationMarker = (map: any) => {
    // Add user location as a blue dot with accuracy circle (Google Maps style)
    const userLocationData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: userLocation
          },
          properties: {
            type: 'user-location'
          }
        }
      ]
    };

    // Add source for user location
    map.addSource('user-location', {
      type: 'geojson',
      data: userLocationData
    });

    // Add accuracy circle (light blue)
    map.addLayer({
      id: 'user-location-accuracy',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 20,
        'circle-color': '#4285F4',
        'circle-opacity': 0.2,
        'circle-stroke-width': 0
      }
    });

    // Add blue dot (main location indicator)
    map.addLayer({
      id: 'user-location-dot',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 8,
        'circle-color': '#4285F4',
        'circle-opacity': 1,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-opacity': 1
      }
    });

    // Add click handler for user location
    map.on('click', 'user-location-dot', (e: any) => {
      const mapboxgl = (window as any).mapboxgl;
      new mapboxgl.Popup()
        .setLngLat(userLocation)
        .setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-sm mb-1">Your Current Location</h3>
            <p class="text-xs text-gray-600 mb-1">Guwahati, Assam</p>
            <p class="text-xs text-gray-500">📍 Real-time GPS tracking active</p>
            <p class="text-xs text-gray-400 mt-1">${userLocation[1].toFixed(6)}, ${userLocation[0].toFixed(6)}</p>
          </div>
        `)
        .addTo(map);
    });

    // Change cursor on hover
    map.on('mouseenter', 'user-location-dot', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'user-location-dot', () => {
      map.getCanvas().style.cursor = '';
    });
  };
  
  const updateUserLocationOnMap = (map: any, newLocation: [number, number]) => {
    // Update the user location source data
    const userLocationData = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: newLocation
          },
          properties: {
            type: 'user-location'
          }
        }
      ]
    };
    
    // Update the source data
    const source = map.getSource('user-location');
    if (source) {
      source.setData(userLocationData);
    }
  };
  
  const startLocationTracking = (map: any) => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setUserLocation(newLocation);
          
          // Update user location on map
          updateUserLocationOnMap(map, newLocation);
          
          // Update location in parent component
          if (onLocationChange) {
            onLocationChange({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location'
            });
          }
          
          // Check if user is entering high-risk zones
          checkHighRiskZoneEntry(newLocation);
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
      
      // Cleanup on unmount
      return () => navigator.geolocation.clearWatch(watchId);
    }
  };
  
  const checkHighRiskZoneEntry = (location: [number, number]) => {
    highRiskZones.forEach(zone => {
      const distance = calculateDistance(
        location[1], location[0],
        zone.lat, zone.lng
      );
      
      if (distance <= zone.radius) {
        // User entered high-risk zone - could trigger alert
        console.warn(`User entered high-risk zone: ${zone.name}`);
        // You can add notification/alert logic here
      }
    });
  };
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      initializeMap(mapboxToken.trim());
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
          
          // Update user location on map
          if (map) {
            updateUserLocationOnMap(map, newLocation);
          }
          
          if (onLocationChange) {
            onLocationChange({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: 'Current Location'
            });
          }
          
          // Center map on user location with smooth animation
          if (map) {
            map.flyTo({ 
              center: newLocation, 
              zoom: 16,
              essential: true,
              duration: 2000
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };
  
  const recenterToUserLocation = () => {
    if (map && userLocation) {
      map.flyTo({
        center: userLocation,
        zoom: 16,
        essential: true,
        duration: 1500
      });
    }
  };

  const handleRefresh = () => {
    if (map) {
      map.resize();
    }
  };

  // Never show token input form - always show map

  return (
    <div className="relative w-full" style={{ height: '600px', minHeight: '500px' }}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg" 
        style={{ height: '100%', minHeight: '500px' }}
      />
      
      {/* Loading Overlay */}
      {isLoadingMap && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Loading Enhanced Map...</p>
              <p className="text-xs text-muted-foreground">Initializing safety features and location tracking</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Overlay */}
      {mapError && (
        <div className="absolute inset-0 bg-red-50/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="text-center space-y-3 p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900">Map Loading Error</p>
              <p className="text-xs text-red-700">{mapError}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setMapError(null);
                setShowTokenInput(true);
              }}
            >
              Try Different Token
            </Button>
          </div>
        </div>
      )}
      
      {/* Enhanced Zone Legend */}
      <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
        <h4 className="text-xs font-semibold mb-2 text-primary">Map Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <span>Safe Zones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 border-2 border-red-500 bg-red-500/30 rounded-full"></div>
            <span>High Risk Areas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 border-2 border-orange-500 bg-orange-500/30 rounded-full"></div>
            <span>Medium Risk Areas</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-blue-500 rounded-full border border-white" style={{ backgroundColor: '#4285F4' }}></div>
            <span>Your Location</span>
          </div>
        </div>
      </div>

      {/* Enhanced Map Controls */}
      <div className="absolute top-3 right-3 space-y-2">
        <Button
          size="icon"
          variant="secondary"
          onClick={recenterToUserLocation}
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
          title="Recenter to My Location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleGetCurrentLocation}
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
          title="Update Current Location"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          onClick={handleRefresh}
          className="shadow-lg bg-background/95 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground"
          title="Refresh Map"
        >
          <Shield className="h-4 w-4" />
        </Button>
      </div>

      {/* Location Status */}
      <div className="absolute bottom-3 left-3">
        <Card className="bg-background/95 backdrop-blur-sm border border-border">
          <div className="p-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">GPS Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Location: {userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)}
            </p>
          </div>
        </Card>
      </div>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div className="absolute bottom-3 right-3 w-80">
          <Card className="bg-background/95 backdrop-blur-sm border-2" 
                style={{ borderColor: selectedZone.riskLevel === 'high' ? '#EF4444' : 
                                      selectedZone.riskLevel === 'medium' ? '#F59E0B' : '#10B981' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" style={{ 
                    color: selectedZone.riskLevel === 'high' ? '#EF4444' : 
                           selectedZone.riskLevel === 'medium' ? '#F59E0B' : '#10B981' 
                  }} />
                  <h3 className="font-semibold text-sm">{selectedZone.name}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedZone(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{selectedZone.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <span className="font-medium capitalize" style={{ 
                    color: selectedZone.riskLevel === 'high' ? '#EF4444' : 
                           selectedZone.riskLevel === 'medium' ? '#F59E0B' : '#10B981' 
                  }}>
                    {selectedZone.riskLevel}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Coverage:</span>
                  <span className="font-mono text-xs">{selectedZone.radius}m radius</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
