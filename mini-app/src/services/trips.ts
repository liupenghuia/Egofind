import { request } from './request';

export const createDriverTrip = (data: unknown) =>
  request('/driver-trips', { method: 'POST', data });

export const createPassengerRequest = (data: unknown) =>
  request('/passenger-requests', { method: 'POST', data });

export const setVisibility = (id: string, visibility: 'PUBLIC' | 'HIDDEN') =>
  request(`/passenger-requests/${id}/visibility`, {
    method: 'PATCH',
    data: { visibility },
  });

export const mapMarkers = (mode: 'passenger' | 'driver', adcode?: string) =>
  request<
    {
      id: string;
      type: string;
      lat: number;
      lng: number;
      title: string;
      seats: number;
      departStart: string;
      priceCents?: number;
    }[]
  >(`/map/markers?mode=${mode}${adcode ? `&adcode=${adcode}` : ''}`);

export const getDriverTrip = (id: string) => request(`/driver-trips/${id}`);
export const getPassengerRequest = (id: string) => request(`/passenger-requests/${id}`);

export const matchForPassenger = (requestId: string) =>
  request(`/matching/for-passenger/${requestId}`);

export const confirmMatch = (driverTripId: string, passengerRequestId: string) =>
  request('/matching/confirm', {
    method: 'POST',
    data: { driverTripId, passengerRequestId },
  });

export const contactPhone = (matchOrderId: string) =>
  request<{ phone: string }>(`/users/contact-phone/${matchOrderId}`);

export const bindPhoneMock = (phoneNumber: string) =>
  request('/users/phone/bind', {
    method: 'POST',
    data: { phoneNumber },
  });

export const myDriverTrips = () => request('/driver-trips/mine');
export const myPassengerRequests = () => request('/passenger-requests/mine');
export const myMatches = () => request('/matching/mine');

export const report = (data: unknown) => request('/reports', { method: 'POST', data });

export type TripFeedbackReason = 'DRIVER_REASON' | 'PASSENGER_REASON';

export const submitTripFeedback = (data: {
  driverTripId: string;
  reason: TripFeedbackReason;
  remark?: string;
}) => request('/trip-feedbacks', { method: 'POST', data });

export type DriverQuotaStatus = {
  yearMonth: string;
  driverReasonCount: number;
  limit: number;
  remaining: number;
  restricted: boolean;
  message: string;
  resetHint: string;
};

export const getDriverQuotaStatus = () =>
  request<DriverQuotaStatus>('/trip-feedbacks/me/driver-status');
