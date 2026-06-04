import type {
  ActivityItem,
  Group,
  Responder,
  SOSAlert,
  TimelineEvent,
  TrustedContact,
} from '@/types';

export const MOCK_USER_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const mockTrustedContacts: TrustedContact[] = [
  {
    id: 'c1',
    name: 'Maya Chen',
    phone: '+1 555-0101',
    relationship: 'Sister',
    isOnline: true,
    distanceKm: 0.8,
  },
  {
    id: 'c2',
    name: 'James Okonkwo',
    phone: '+1 555-0102',
    relationship: 'Neighbor',
    isOnline: true,
    distanceKm: 1.2,
  },
  {
    id: 'c3',
    name: 'Sarah Williams',
    phone: '+1 555-0103',
    relationship: 'Friend',
    isOnline: false,
    distanceKm: 2.4,
  },
];

export const mockGroups: Group[] = [
  {
    id: 'g1',
    name: 'Family Circle',
    memberCount: 4,
    members: mockTrustedContacts.slice(0, 2),
    color: '#4a8f6a',
  },
  {
    id: 'g2',
    name: 'Neighborhood Watch',
    memberCount: 8,
    members: mockTrustedContacts,
    color: '#5d7a9a',
  },
  {
    id: 'g3',
    name: 'Late Night Walk',
    memberCount: 3,
    members: mockTrustedContacts.slice(1, 3),
    isTemporary: true,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    color: '#c9a04a',
  },
];

export const mockResponders: Responder[] = [
  {
    id: 'r1',
    name: 'Maya Chen',
    status: 'en_route',
    etaMinutes: 4,
    distanceKm: 0.8,
    coordinates: { latitude: 37.778, longitude: -122.415 },
    phone: '+1 555-0101',
  },
  {
    id: 'r2',
    name: 'James Okonkwo',
    status: 'viewing',
    distanceKm: 1.2,
    coordinates: { latitude: 37.771, longitude: -122.422 },
    phone: '+1 555-0102',
  },
];

export const mockTimeline: TimelineEvent[] = [
  {
    id: 't1',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    title: 'SOS alert sent',
    description: 'Your trusted contacts have been notified',
    type: 'system',
  },
  {
    id: 't2',
    timestamp: new Date(Date.now() - 90000).toISOString(),
    title: 'Maya Chen is on the way',
    description: 'ETA approximately 4 minutes',
    type: 'responder',
  },
  {
    id: 't3',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    title: 'James Okonkwo viewed your alert',
    type: 'responder',
  },
  {
    id: 't4',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    title: 'Location shared',
    description: 'Live location is being updated',
    type: 'system',
  },
];

export const mockActiveAlert: SOSAlert = {
  id: 'alert-001',
  userId: 'user-1',
  type: 'safety',
  status: 'responding',
  createdAt: new Date(Date.now() - 120000).toISOString(),
  location: MOCK_USER_LOCATION,
  responders: mockResponders,
  timeline: mockTimeline,
  message: 'Need help — feeling unsafe',
};

export const mockActivity: ActivityItem[] = [
  {
    id: 'a1',
    type: 'alert',
    title: 'Safety alert resolved',
    subtitle: '3 responders · Downtown SF',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'resolved',
  },
  {
    id: 'a2',
    type: 'check_in',
    title: 'Safe arrival check-in',
    subtitle: 'Shared with Family Circle',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'a3',
    type: 'group_update',
    title: 'Added to Neighborhood Watch',
    subtitle: '8 members',
    timestamp: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'a4',
    type: 'alert',
    title: 'Medical assistance requested',
    subtitle: 'Resolved in 8 minutes',
    timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
    status: 'resolved',
  },
];

export const emergencyTypes = [
  { id: 'medical' as const, label: 'Medical', icon: 'medkit' as const },
  { id: 'safety' as const, label: 'Safety', icon: 'shield' as const },
  { id: 'harassment' as const, label: 'Harassment', icon: 'alert-circle' as const },
  { id: 'accident' as const, label: 'Accident', icon: 'car' as const },
  { id: 'other' as const, label: 'Other', icon: 'help-circle' as const },
];
