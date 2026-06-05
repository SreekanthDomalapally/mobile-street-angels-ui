import {
  mapApiAlertToSOSAlert,
  mapApiGroupToGroup,
  mapEmergencyTypeToApi,
  type ApiAlertOut,
} from '@/services/api/mappers';

describe('mapEmergencyTypeToApi', () => {
  it('maps mobile emergency types to API alert types', () => {
    expect(mapEmergencyTypeToApi('medical')).toBe('medical_help');
    expect(mapEmergencyTypeToApi('safety')).toBe('unsafe_situation');
    expect(mapEmergencyTypeToApi('accident')).toBe('car_breakdown');
    expect(mapEmergencyTypeToApi('other')).toBe('custom');
  });
});

describe('mapApiAlertToSOSAlert', () => {
  it('maps flat API alert payload to SOSAlert', () => {
    const apiAlert: ApiAlertOut = {
      id: 'alert-1',
      created_by: 'user-1',
      group_id: 'group-1',
      alert_type: 'medical_help',
      message: 'Need help',
      latitude: 12.34,
      longitude: 56.78,
      status: 'active',
      created_at: '2026-06-05T12:00:00.000Z',
      resolved_at: null,
      responses: [],
    };

    const alert = mapApiAlertToSOSAlert(apiAlert);

    expect(alert.id).toBe('alert-1');
    expect(alert.type).toBe('medical');
    expect(alert.location).toEqual({ latitude: 12.34, longitude: 56.78 });
    expect(alert.timeline[0]?.title).toBe('SOS alert sent');
  });
});

describe('mapApiGroupToGroup', () => {
  it('maps API group without members to mobile Group', () => {
    const group = mapApiGroupToGroup({
      id: 'group-1',
      name: 'Family',
      description: null,
      is_temporary: true,
      expires_at: '2026-06-05T13:00:00.000Z',
      created_by: 'user-1',
      created_at: '2026-06-05T12:00:00.000Z',
    });

    expect(group.name).toBe('Family');
    expect(group.isTemporary).toBe(true);
    expect(group.memberCount).toBe(0);
  });
});
