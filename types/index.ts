export type EmergencyType = 'medical' | 'safety' | 'harassment' | 'accident' | 'other';

export type AlertStatus =
  | 'idle'
  | 'arming'
  | 'active'
  | 'responding'
  | 'resolved'
  | 'cancelled';

export type ResponderStatus = 'notified' | 'viewing' | 'en_route' | 'arrived' | 'completed';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  photoURL?: string;
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  relationship?: string;
  isOnline?: boolean;
  distanceKm?: number;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  email: string;
  role: string;
}

export interface DeviceContact {
  id: string;
  name: string;
  emails: string[];
  phoneNumbers: string[];
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  members: GroupMember[];
  isTemporary?: boolean;
  expiresAt?: string;
  color?: string;
}

export interface Responder {
  id: string;
  name: string;
  avatarUrl?: string;
  status: ResponderStatus;
  etaMinutes?: number;
  distanceKm?: number;
  coordinates?: Coordinates;
  phone?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  type: 'system' | 'responder' | 'user';
}

export interface SOSAlert {
  id: string;
  userId: string;
  type: EmergencyType;
  status: AlertStatus;
  createdAt: string;
  resolvedAt?: string;
  location: Coordinates;
  responders: Responder[];
  timeline: TimelineEvent[];
  message?: string;
}

export interface ActivityItem {
  id: string;
  alertId?: string;
  type: 'alert' | 'check_in' | 'group_update';
  title: string;
  subtitle: string;
  timestamp: string;
  status?: AlertStatus;
}

export interface NotificationPreferences {
  emergencyAlerts: boolean;
  groupUpdates: boolean;
  responderUpdates: boolean;
  marketing: boolean;
}

export interface EmergencySettings {
  holdDurationMs: number;
  countdownSeconds: number;
  shareLocationByDefault: boolean;
  silentMode: boolean;
  defaultSosGroupId: string | null;
}
