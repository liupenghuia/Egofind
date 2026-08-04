import { request } from './request';

export const listUsers = (page = 1, pageSize = 20) =>
  request.get('/users', { params: { page, pageSize } }).then((r) => r.data);

export const listDriverTrips = (adcode?: string) =>
  request.get('/admin/orders/driver-trips', { params: { adcode } }).then((r) => r.data);

export const listPassengerRequests = (adcode?: string) =>
  request.get('/admin/orders/passenger-requests', { params: { adcode } }).then((r) => r.data);

export const listMatches = () => request.get('/admin/orders/matches').then((r) => r.data);

export const listVerifications = () =>
  request.get('/admin/driver-verifications').then((r) => r.data);

export const reviewVerification = (id: string, approve: boolean, rejectReason?: string) =>
  request.post(`/admin/driver-verifications/${id}/review`, { approve, rejectReason }).then((r) => r.data);

export const statsByAdcode = () => request.get('/admin/stats/by-adcode').then((r) => r.data);

export const mapPreview = (adcode?: string) =>
  request.get('/admin/map/preview', { params: { adcode } }).then((r) => r.data);

export const setUserStatus = (id: string, status: number) =>
  request.patch(`/admin/users/${id}/status`, { status }).then((r) => r.data);

export const listReports = () =>
  request.get('/admin/reports').then((r) => r.data);

export const resolveReport = (
  id: string,
  data: {
    status: 'REVIEWING' | 'CLOSED';
    adminNote?: string;
    banTargetUser?: boolean;
  },
) => request.post(`/admin/reports/${id}/resolve`, data).then((r) => r.data);
