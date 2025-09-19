import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Shield,
  Clock,
  Zap,
  LogOut,
  Settings
} from 'lucide-react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { adminDashboardAPI, alertsAPI, getSocket } from '@/services/adminApi';
import AdminMap from '../components/AdminMap';
import AlertsTable from '../components/AlertsTable';

interface DashboardStats {
  active_tourists: number;
  total_tourists: number;
  active_alerts: number;
  alerts_resolved_today: number;
  average_safety_score: number;
}

interface DashboardData {
  stats: DashboardStats;
  active_alerts: any[];
  recent_activities: any[];
}

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { admin, logout } = useAdminAuth();

  useEffect(() => {
    loadDashboardData();
    loadAlertStats();

    // Set up real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on('new-alert', handleNewAlert);
      socket.on('alert-updated', handleAlertUpdate);
      socket.on('location-update', handleLocationUpdate);

      return () => {
        socket.off('new-alert', handleNewAlert);
        socket.off('alert-updated', handleAlertUpdate);
        socket.off('location-update', handleLocationUpdate);
      };
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await adminDashboardAPI.getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAlertStats = async () => {
    try {
      const response = await alertsAPI.getAlertStats();
      if (response.success) {
        setAlertStats(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load alert stats:', error);
    }
  };

  const handleNewAlert = (data: any) => {
    console.log('New alert received:', data);
    loadDashboardData();
    loadAlertStats();
  };

  const handleAlertUpdate = (data: any) => {
    console.log('Alert updated:', data);
    loadDashboardData();
    loadAlertStats();
  };

  const handleLocationUpdate = (data: any) => {
    console.log('Location updated:', data);
    // Refresh dashboard stats periodically
    loadDashboardData();
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img src="/trusttour-logo.svg" alt="TrustTour" className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">TrustTour Admin</h1>
                  <p className="text-sm text-muted-foreground">Travel Security Command Center</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {admin?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Welcome, {admin?.name}
              </span>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tourists</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {dashboardData?.stats.active_tourists || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {dashboardData?.stats.total_tourists || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData?.stats.active_alerts || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requiring attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData?.stats.alerts_resolved_today || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alerts resolved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {Math.round(dashboardData?.stats.average_safety_score || 0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average score
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Online</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Active Alerts Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Active Emergency Alerts</span>
                </CardTitle>
                <CardDescription>
                  Recent emergency alerts requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.active_alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <p>No active emergency alerts</p>
                    <p className="text-sm">All systems running smoothly</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.active_alerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                          <div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm text-muted-foreground">
                              Tourist: {alert.profiles?.name} | 
                              Location: {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">{alert.priority}</Badge>
                          <Badge variant="outline">{alert.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {dashboardData?.active_alerts.length > 3 && (
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('alerts')}
                        className="w-full"
                      >
                        View All {dashboardData.active_alerts.length} Active Alerts
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>
                  Latest location updates and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recent_activities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg"
                    >
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <strong>{activity.tourist_name}</strong> updated location
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.location.address || 'Unknown location'} | 
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {activity.digital_id}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Live Tourist Locations</span>
                </CardTitle>
                <CardDescription>
                  Real-time view of all active tourist locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] rounded-lg overflow-hidden">
                  <AdminMap />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Emergency Alerts Management</span>
                </CardTitle>
                <CardDescription>
                  Monitor and manage all emergency alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>System Activity Log</span>
                </CardTitle>
                <CardDescription>
                  Complete log of system events and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-16 w-16 mx-auto mb-4" />
                  <p>Activity log will be implemented here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;







