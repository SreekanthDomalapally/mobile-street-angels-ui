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
  accuracyMeters?: number;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  accountStatus?: string;
  avatarUrl?: string;
  photoURL?: string;
}

export interface OnboardingStatus {
  needs_phone_verification: boolean;
  needs_profile_setup?: boolean;
  needs_contacts_permission: boolean;
  onboarding_complete: boolean;
  account_status?: string;
  contacts_synced?: boolean;
  trusted_contacts_count?: number;
  groups_created_count?: number;
}

export type OnboardingStep =
  | 'intro'
  | 'login'
  | 'phone_verify'
  | 'profile_setup'
  | 'contact_sync'
  | 'trusted_contacts'
  | 'create_group'
  | 'device_permissions'
  | 'home';

export interface OnboardingFlags {
  is_registered: boolean;
  is_phone_verified: boolean;
  contacts_synced: boolean;
  trusted_contacts_count: number;
  groups_created_count: number;
  onboarding_complete: boolean;
  next_step: OnboardingStep;
}

export type TrustedContactStatus = 'invited' | 'pending' | 'accepted' | 'blocked' | 'removed';

export interface TrustedContactRelationship {
  id: string;
  userId?: string;
  displayName: string;
  email?: string;
  phone?: string;
  status: TrustedContactStatus;
  isIncoming?: boolean;
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

export interface GroupPendingInvite {
  id: string;
  inviteeEmail: string;
  inviteePhone?: string;
  inviterName: string;
  status: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  members: GroupMember[];
  pendingInvites?: GroupPendingInvite[];
  myRole?: string;
  isTemporary?: boolean;
  expiresAt?: string;
  color?: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviterName: string;
  inviteeEmail: string;
  status: string;
  createdAt: string;
}

export interface CircleContact {
  id: string;
  userId?: string;
  displayName: string;
  email?: string;
  phone?: string;
  groupIds: string[];
  onPlatform: boolean;
  status: 'member' | 'invited';
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

export type TripWatchStatus = 'active' | 'arrived' | 'ended' | 'expired';

export interface TripDestination {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface TripWatch {
  id: string;
  groupId: string;
  groupName?: string;
  label?: string;
  status: TripWatchStatus;
  destination?: TripDestination;
  currentLocation?: Coordinates;
  startedAt: string;
  expiresAt: string;
  arrivedAt?: string;
  endedAt?: string;
  travelerUserId: string;
  travelerName?: string;
  isLocalOnly?: boolean;
}
