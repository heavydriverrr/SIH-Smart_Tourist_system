import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  MapPin, 
  CreditCard, 
  Phone, 
  Navigation,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Settings,
  LogOut
} from 'lucide-react';
import SOSButton from './SOSButton';
import MapComponent from './MapComponent';
import DigitalIDCard from './DigitalIDCard';
import { useLocationService } from '@/hooks/useLocationService';

interface TouristDashboardProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    safetyScore: number;
    digitalId: string;
    isVerified: boolean;
  };
  onLogout: () => void;
}

const TouristDashboard: React.FC<TouristDashboardProps> = ({ user, onLogout }) => {
  const [currentLocation, setCurrentLocation] = useState({
    lat: 26.1445, // Guwahati coordinates
    lng: 91.7362,
    address: "Guwahati, Assam"
  });
  const [showDigitalID, setShowDigitalID] = useState(false);
  const [alerts] = useState([
    { id: 1, type: 'info', message: 'Welcome to Assam! Check local guidelines.', time: '2 min ago' },
    { id: 2, type: 'warning', message: 'High tourist area detected. Stay alert.', time: '1 hour ago' },
  ]);

  // Initialize location service
  const locationService = useLocationService({
    userId: user.id,
    enabled: true,
    updateInterval: 30000 // Update every 30 seconds
  });

  // Update location when GPS location changes
  useEffect(() => {
    if (locationService.currentLocation) {
      setCurrentLocation({
        lat: locationService.currentLocation.latitude,
        lng: locationService.currentLocation.longitude,
        address: locationService.currentLocation.address || 'Unknown location'
      });
    }
  }, [locationService.currentLocation]);

  const handleSOSPress = () => {
    // Simulate SOS alert
    console.log('SOS Alert triggered!', {
      userId: user.id,
      location: currentLocation,
      timestamp: new Date().toISOString()
    });
    alert('🚨 SOS Alert sent! Emergency services have been notified.');
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'emergency';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary shadow-primary p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary-foreground" />
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">SmartShield</h1>
              <p className="text-primary-foreground/80 text-sm">Tourist Safety</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} className="text-primary-foreground hover:bg-primary-foreground/20">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6 pb-24">
        {/* User Info & Safety Score */}
        <Card className="shadow-card bg-gradient-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{user.name}</CardTitle>
                  <CardDescription className="flex items-center space-x-1">
                    <span>{user.digitalId}</span>
                    {user.isVerified && <CheckCircle className="h-4 w-4 text-success" />}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getSafetyScoreColor(user.safetyScore) as any} className="text-xs">
                Safety Score: {user.safetyScore}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Safety Score</span>
                <span className="font-medium">{user.safetyScore}%</span>
              </div>
              <Progress value={user.safetyScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Based on location, activity, and compliance with safety guidelines
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => setShowDigitalID(true)}
            className="h-20 flex-col"
          >
            <CreditCard className="h-6 w-6 mb-1" />
            <span className="text-sm">Digital ID</span>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="h-20 flex-col"
          >
            <Phone className="h-6 w-6 mb-1" />
            <span className="text-sm">Emergency Contacts</span>
          </Button>
        </div>

        {/* Live Location */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-primary" />
              <span>Current Location</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{currentLocation.address}</span>
                </div>
                {locationService.isTracking && (
                  <div className="flex items-center space-x-1 text-xs text-green-600">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                )}
              </div>
              {locationService.lastUpdate && (
                <p className="text-xs text-muted-foreground">
                  Last update: {locationService.lastUpdate.toLocaleTimeString()}
                </p>
              )}
              <div className="h-48 rounded-lg overflow-hidden">
                <MapComponent 
                  center={[currentLocation.lng, currentLocation.lat]}
                  onLocationChange={setCurrentLocation}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Safety Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    alert.type === 'warning' ? 'bg-warning' : 'bg-primary'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Travel Itinerary */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle>Today's Itinerary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-success/10 rounded-lg border border-success/20">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-sm">Kamakhya Temple</p>
                  <p className="text-xs text-muted-foreground">Completed - 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">Umananda Temple</p>
                  <p className="text-xs text-muted-foreground">Current - 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Brahmaputra River Cruise</p>
                  <p className="text-xs text-muted-foreground">Upcoming - 5:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SOS Button - Fixed at bottom */}
      <SOSButton onPress={handleSOSPress} userId={user.id} />

      {/* Digital ID Modal */}
      {showDigitalID && (
        <DigitalIDCard 
          user={user} 
          onClose={() => setShowDigitalID(false)} 
        />
      )}
    </div>
  );
};

export default TouristDashboard;