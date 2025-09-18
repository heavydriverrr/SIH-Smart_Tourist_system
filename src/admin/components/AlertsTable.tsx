import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Eye, Edit, Clock, User, MapPin, RefreshCw, Search, Filter } from 'lucide-react';
import { alertsAPI, getSocket } from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  message: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  admin_notes?: string;
  tourist: {
    name: string;
    phone: string;
    digital_id: string;
    safety_score: number;
  };
  assigned_admin?: {
    name: string;
  };
}

const AlertsTable: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: '',
    priority: '',
    notes: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 25,
    offset: 0,
    total: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();

    // Set up real-time updates
    const socket = getSocket();
    if (socket) {
      socket.on('new-alert', handleNewAlert);
      socket.on('alert-updated', handleAlertUpdate);

      return () => {
        socket.off('new-alert', handleNewAlert);
        socket.off('alert-updated', handleAlertUpdate);
      };
    }
  }, [pagination.offset, filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority })
      };

      const response = await alertsAPI.getAlerts(params);
      
      if (response.success) {
        let filteredAlerts = response.data;

        // Client-side search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          filteredAlerts = filteredAlerts.filter((alert: Alert) =>
            alert.message.toLowerCase().includes(searchTerm) ||
            alert.tourist.name.toLowerCase().includes(searchTerm) ||
            alert.tourist.digital_id.toLowerCase().includes(searchTerm)
          );
        }

        setAlerts(filteredAlerts);
        setPagination(prev => ({
          ...prev,
          total: response.pagination.total
        }));
      }
    } catch (error: any) {
      console.error('Failed to load alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load alerts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewAlert = (data: any) => {
    console.log('New alert received:', data);
    loadAlerts();
    toast({
      title: 'New Emergency Alert',
      description: `Alert from ${data.tourist?.name}`,
      variant: 'destructive'
    });
  };

  const handleAlertUpdate = (data: any) => {
    console.log('Alert updated:', data);
    loadAlerts();
  };

  const handleUpdateAlert = async () => {
    if (!selectedAlert || !statusUpdate.status) return;

    try {
      const response = await alertsAPI.updateAlertStatus(selectedAlert.id, {
        status: statusUpdate.status as any,
        ...(statusUpdate.priority && { priority: statusUpdate.priority as any }),
        ...(statusUpdate.notes && { notes: statusUpdate.notes })
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Alert status updated to ${statusUpdate.status}`,
        });
        setIsUpdateDialogOpen(false);
        setStatusUpdate({ status: '', priority: '', notes: '' });
        loadAlerts();
      }
    } catch (error: any) {
      console.error('Failed to update alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert status',
        variant: 'destructive'
      });
    }
  };

  const openUpdateDialog = (alert: Alert) => {
    setSelectedAlert(alert);
    setStatusUpdate({
      status: alert.status,
      priority: alert.priority,
      notes: alert.admin_notes || ''
    });
    setIsUpdateDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'destructive',
      acknowledged: 'secondary',
      resolved: 'default',
      false_alarm: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      critical: 'destructive'
    };
    return <Badge variant={variants[priority] || 'outline'}>{priority}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'next' 
      ? pagination.offset + pagination.limit 
      : Math.max(0, pagination.offset - pagination.limit);
    
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search alerts, tourists..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="false_alarm">False Alarm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority-filter">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadAlerts} variant="outline" className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Emergency Alerts</span>
            </div>
            <Badge variant="outline">{pagination.total} total</Badge>
          </CardTitle>
          <CardDescription>
            Monitor and manage emergency alerts from tourists
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p>No alerts found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Tourist</th>
                      <th className="text-left p-3 font-medium">Message</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Priority</th>
                      <th className="text-left p-3 font-medium">Created</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="space-y-1">
                            <p className="font-medium">{alert.tourist.name}</p>
                            <p className="text-sm text-muted-foreground">{alert.tourist.digital_id}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm max-w-xs truncate" title={alert.message}>
                            {alert.message}
                          </p>
                          <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                          </div>
                        </td>
                        <td className="p-3">{getStatusBadge(alert.status)}</td>
                        <td className="p-3">{getPriorityBadge(alert.priority)}</td>
                        <td className="p-3">
                          <div className="space-y-1">
                            <p className="text-sm">{formatDateTime(alert.created_at)}</p>
                            {alert.assigned_admin && (
                              <p className="text-xs text-muted-foreground">
                                by {alert.assigned_admin.name}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUpdateDialog(alert)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{alert.tourist.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(alert.status)}
                          {getPriorityBadge(alert.priority)}
                        </div>
                      </div>
                      
                      <p className="text-sm">{alert.message}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(alert.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUpdateDialog(alert)}
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update Alert
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange('prev')}
                    disabled={pagination.offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange('next')}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Alert Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Alert Status</DialogTitle>
            <DialogDescription>
              Update the status and priority of this emergency alert
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedAlert.tourist.name}</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDateTime(selectedAlert.created_at)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-update">Status</Label>
                <Select
                  value={statusUpdate.status}
                  onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="false_alarm">False Alarm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority-update">Priority</Label>
                <Select
                  value={statusUpdate.priority}
                  onValueChange={(value) => setStatusUpdate(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this alert..."
                  value={statusUpdate.notes}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAlert} disabled={!statusUpdate.status}>
              Update Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlertsTable;







