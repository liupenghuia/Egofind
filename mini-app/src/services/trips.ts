import Taro from '@tarojs/taro';
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

export type MatchCandidateTrip = {
  score: number;
  distanceKm: number;
  ratingAvg?: number | null;
  ratingCount?: number;
  trip: {
    id: string;
    originName: string;
    destName: string;
    departStart: string;
    departEnd?: string;
    seatsLeft?: number;
    seatsTotal?: number;
    priceCents?: number;
    status?: string;
  };
};

export type MatchCandidateRequest = {
  score: number;
  distanceKm: number;
  ratingAvg?: number | null;
  ratingCount?: number;
  request: {
    id: string;
    originName: string;
    destName: string;
    expectStart: string;
    expectEnd?: string;
    seatsNeeded?: number;
    status?: string;
  };
};

export const matchForPassenger = (requestId: string) =>
  request<MatchCandidateTrip[]>(`/matching/for-passenger/${requestId}`);

export const matchForDriver = (tripId: string) =>
  request<MatchCandidateRequest[]>(`/matching/for-driver/${tripId}`);

export const confirmMatch = (driverTripId: string, passengerRequestId: string) =>
  request('/matching/confirm', {
    method: 'POST',
    data: { driverTripId, passengerRequestId },
  });

export const completeMatch = (matchOrderId: string) =>
  request(`/matching/${matchOrderId}/complete`, { method: 'POST' });

export const cancelMatch = (matchOrderId: string, reason?: string) =>
  request(`/matching/${matchOrderId}/cancel`, {
    method: 'POST',
    data: reason ? { reason } : {},
  });

export type RatingSummary = {
  ratingAvg?: number | null;
  ratingCount?: number;
};

export const uploadImage = (filePath: string) => {
  const BASE = process.env.TARO_APP_API_BASE || 'http://localhost:3000';
  const token = useUserStoreGetToken();
  return new Promise<{ url: string }>((resolve, reject) => {
    Taro.uploadFile({
      url: `${BASE}/uploads`,
      filePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data as string) as {
            code?: number;
            message?: string;
            data?: { url: string };
          };
          if (res.statusCode >= 400 || (body.code != null && body.code !== 0)) {
            reject(new Error(body.message || '上传失败'));
            return;
          }
          const url = body.data?.url;
          if (!url) {
            reject(new Error('上传响应无效'));
            return;
          }
          resolve({ url: url.startsWith('http') ? url : `${BASE}${url}` });
        } catch {
          reject(new Error('上传解析失败'));
        }
      },
      fail: () => reject(new Error('上传失败')),
    });
  });
};

function useUserStoreGetToken(): string | null {
  try {
    // lazy import avoid cycle: trips already uses request which uses store
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUserStore } = require('../stores/user') as typeof import('../stores/user');
    return useUserStore.getState().token;
  } catch {
    return null;
  }
}

export const submitReview = (data: {
  matchOrderId: string;
  rating: number;
  content?: string;
  tags?: string[];
}) => request('/reviews', { method: 'POST', data });

export const reviewsByMatch = (matchOrderId: string) =>
  request<
    {
      id: string;
      fromUserId: string;
      toUserId: string;
      rating: number;
      content?: string;
      createdAt: string;
    }[]
  >(`/reviews/by-match/${matchOrderId}`);

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

export const cancelDriverTrip = (id: string) =>
  request(`/driver-trips/${id}/cancel`, { method: 'POST' });

export const cancelPassengerRequest = (id: string) =>
  request(`/passenger-requests/${id}/cancel`, { method: 'POST' });

export type ReportTargetType =
  | 'USER'
  | 'DRIVER_TRIP'
  | 'PASSENGER_REQUEST'
  | 'MATCH';

export type ReportReasonCode =
  | 'harassment'
  | 'fraud'
  | 'safety'
  | 'abuse'
  | 'other';

export const submitReport = (data: {
  targetType: ReportTargetType;
  targetId: string;
  targetUserId?: string;
  reasonCode: ReportReasonCode | string;
  detail?: string;
}) => request('/reports', { method: 'POST', data });

/** @deprecated use submitReport */
export const report = (data: unknown) =>
  request('/reports', { method: 'POST', data });

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

export type DriverVerifyStatus = {
  status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  rejectReason?: string | null;
  canSubmit: boolean;
  canPublish: boolean;
  profile?: {
    plateNo?: string | null;
    carModel?: string | null;
    carColor?: string | null;
    verifyStatus?: string;
    rejectReason?: string | null;
  } | null;
  latest?: {
    id: string;
    status: string;
    realName?: string | null;
    idCardMask?: string | null;
    plateNo?: string | null;
    carModel?: string | null;
    carColor?: string | null;
    licenseImg?: string | null;
    vehicleImg?: string | null;
    rejectReason?: string | null;
  } | null;
};

export const getDriverVerifyStatus = () =>
  request<DriverVerifyStatus>('/driver-verifications/me');

export const submitDriverVerification = (data: {
  realName: string;
  plateNo: string;
  carModel?: string;
  carColor?: string;
  idCardMask?: string;
  licenseImg?: string;
  vehicleImg?: string;
}) => request('/driver-verifications', { method: 'POST', data });

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown> | null;
  readAt?: string | null;
  createdAt: string;
};

export const listNotifications = () =>
  request<NotificationItem[]>('/notifications');

export const notificationsUnreadCount = () =>
  request<{ count: number }>('/notifications/unread-count');

export const markNotificationRead = (id: string) =>
  request(`/notifications/${id}/read`, { method: 'POST' });

export const markAllNotificationsRead = () =>
  request('/notifications/read-all', { method: 'POST' });

export const CURRENT_LEGAL_VERSION = '2026-07-29';

export const acceptLegal = (version = CURRENT_LEGAL_VERSION) =>
  request('/users/me/legal-accept', {
    method: 'POST',
    data: { version },
  });

export const setServerMode = (mode: 'passenger' | 'driver') =>
  request('/users/me/mode', {
    method: 'PATCH',
    data: { mode: mode === 'driver' ? 'DRIVER' : 'PASSENGER' },
  });
