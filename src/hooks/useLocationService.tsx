import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import axios from 'axios';

const ADMIN_API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:5000';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface UseLocationServiceProps {
  userId?: string;
  enabled?: boolean;
  updateInterval?: number; // in milliseconds
}

export const useLocationService = ({
  userId,
  enabled = true,
  updateInterval = 30000 // 30 seconds default
}: UseLocationServiceProps = {}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Send location update to admin backend
  const sendLocationToAdmin = useCallback(async (location: LocationData, currentUserId: string) => {
    try {
      const response = await axios.post(`${ADMIN_API_BASE_URL}/api/tourists/${currentUserId}/location`, {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading
      });
      
      console.log('Location sent to admin backend:', response.data);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Failed to send location to admin backend:', error);
      // Don't show error to user, just log it
      if (error.response?.status !== 404) { // Ignore if admin backend is not running
        setError('Failed to sync location with admin system');
      }
    }
  }, []);

  // Update location in Supabase
  const updateLocationInSupabase = useCallback(async (location: LocationData, currentUserId: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('tourist_locations')
        .upsert({
          user_id: currentUserId,
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address,
          accuracy: location.accuracy,
          altitude: location.altitude,
          speed: location.speed,
          heading: location.heading,
          updated_at: new Date().toISOString()
        });

      if (supabaseError) {
        console.error('Supabase location update error:', supabaseError);
      }
    } catch (error) {
      console.error('Failed to update location in Supabase:', error);
    }
  }, []);

  // Get current position using Geolocation API
  const getCurrentPosition = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Cache for 1 minute
        }
      );
    });
  }, []);

  // Reverse geocoding to get address
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      // You can use any geocoding service here
      // For demonstration, we'll return a simple format
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }, []);

  // Update location function
  const updateLocation = useCallback(async (force = false) => {
    if (!enabled && !force) return;
    if (!userId) return;

    try {
      setError(null);
      const position = await getCurrentPosition();
      
      const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);

      const locationData: LocationData = {
        latitude,
        longitude,
        address,
        accuracy: accuracy || undefined,
        altitude: altitude || undefined,
        speed: speed || undefined,
        heading: heading || undefined
      };

      setCurrentLocation(locationData);

      // Update in Supabase
      await updateLocationInSupabase(locationData, userId);

      // Send to admin backend
      await sendLocationToAdmin(locationData, userId);

    } catch (error: any) {
      console.error('Location update error:', error);
      setError(error.message || 'Failed to update location');
    }
  }, [enabled, userId, getCurrentPosition, getAddressFromCoordinates, updateLocationInSupabase, sendLocationToAdmin]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!userId || !enabled) return;

    setIsTracking(true);
    setError(null);

    // Initial location update
    updateLocation(true);

    // Set up interval for periodic updates
    const interval = setInterval(() => {
      updateLocation();
    }, updateInterval);

    return () => {
      clearInterval(interval);
      setIsTracking(false);
    };
  }, [userId, enabled, updateLocation, updateInterval]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  // Manual location update
  const manualUpdate = useCallback(() => {
    updateLocation(true);
  }, [updateLocation]);

  // Auto-start tracking when enabled and userId is available
  useEffect(() => {
    if (enabled && userId) {
      const cleanup = startTracking();
      return cleanup;
    }
  }, [enabled, userId, startTracking]);

  return {
    currentLocation,
    isTracking,
    error,
    lastUpdate,
    startTracking,
    stopTracking,
    manualUpdate,
    updateLocation: (location: LocationData) => {
      if (userId) {
        setCurrentLocation(location);
        updateLocationInSupabase(location, userId);
        sendLocationToAdmin(location, userId);
      }
    }
  };
};

export default useLocationService;