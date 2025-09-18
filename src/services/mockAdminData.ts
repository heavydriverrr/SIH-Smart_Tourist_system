// Mock data for admin dashboard demonstration

export const mockDashboardData = {
  stats: {
    active_tourists: 12,
    total_tourists: 25,
    active_alerts: 3,
    alerts_resolved_today: 8,
    average_safety_score: 87
  },
  active_alerts: [
    {
      id: '1',
      message: 'Lost in Kamakhya Temple area',
      priority: 'high',
      status: 'active',
      latitude: 26.1584,
      longitude: 91.7626,
      profiles: { name: 'John Smith' },
      created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
    },
    {
      id: '2',
      message: 'Medical emergency near Fancy Bazaar',
      priority: 'critical',
      status: 'active',
      latitude: 26.1408,
      longitude: 91.7417,
      profiles: { name: 'Sarah Johnson' },
      created_at: new Date(Date.now() - 900000).toISOString() // 15 minutes ago
    },
    {
      id: '3',
      message: 'Phone battery low - unable to contact',
      priority: 'medium',
      status: 'acknowledged',
      latitude: 26.1445,
      longitude: 91.7362,
      profiles: { name: 'Mike Brown' },
      created_at: new Date(Date.now() - 2700000).toISOString() // 45 minutes ago
    }
  ],
  recent_activities: [
    {
      id: '1',
      tourist_name: 'Emma Wilson',
      digital_id: 'TUR-001',
      location: { address: 'Umananda Temple, Guwahati' },
      timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    },
    {
      id: '2',
      tourist_name: 'David Chen',
      digital_id: 'TUR-002',
      location: { address: 'Guwahati Railway Station' },
      timestamp: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
    },
    {
      id: '3',
      tourist_name: 'Lisa Anderson',
      digital_id: 'TUR-003',
      location: { address: 'Lokpriya Gopinath Bordoloi Airport' },
      timestamp: new Date(Date.now() - 900000).toISOString() // 15 minutes ago
    },
    {
      id: '4',
      tourist_name: 'Robert Garcia',
      digital_id: 'TUR-004',
      location: { address: 'Assam State Museum' },
      timestamp: new Date(Date.now() - 1200000).toISOString() // 20 minutes ago
    },
    {
      id: '5',
      tourist_name: 'Jennifer Lee',
      digital_id: 'TUR-005',
      location: { address: 'Nehru Park, Guwahati' },
      timestamp: new Date(Date.now() - 1500000).toISOString() // 25 minutes ago
    }
  ]
};

export const mockTouristLocations = [
  {
    id: '1',
    tourist: {
      name: 'John Smith',
      digital_id: 'TUR-001',
      is_verified: true,
      safety_score: 85
    },
    latitude: 26.1584,
    longitude: 91.7626,
    address: 'Kamakhya Temple, Guwahati, Assam',
    accuracy: 12,
    updated_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: '2',
    tourist: {
      name: 'Sarah Johnson',
      digital_id: 'TUR-002',
      is_verified: true,
      safety_score: 92
    },
    latitude: 26.1408,
    longitude: 91.7417,
    address: 'Fancy Bazaar, Guwahati, Assam',
    accuracy: 8,
    updated_at: new Date(Date.now() - 180000).toISOString()
  },
  {
    id: '3',
    tourist: {
      name: 'Mike Brown',
      digital_id: 'TUR-003',
      is_verified: false,
      safety_score: 78
    },
    latitude: 26.1445,
    longitude: 91.7362,
    address: 'Guwahati Railway Station, Guwahati, Assam',
    accuracy: 15,
    updated_at: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: '4',
    tourist: {
      name: 'Emma Wilson',
      digital_id: 'TUR-004',
      is_verified: true,
      safety_score: 90
    },
    latitude: 26.1739,
    longitude: 91.7514,
    address: 'Umananda Temple, Guwahati, Assam',
    accuracy: 5,
    updated_at: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: '5',
    tourist: {
      name: 'David Chen',
      digital_id: 'TUR-005',
      is_verified: true,
      safety_score: 88
    },
    latitude: 26.1195,
    longitude: 91.7898,
    address: 'Lokpriya Gopinath Bordoloi Airport, Guwahati, Assam',
    accuracy: 10,
    updated_at: new Date(Date.now() - 480000).toISOString()
  }
];

export const mockAlertStats = {
  total: 35,
  active: 3,
  resolved: 8,
  false_alarms: 2,
  by_priority: {
    critical: 1,
    high: 2,
    medium: 4,
    low: 1
  }
};