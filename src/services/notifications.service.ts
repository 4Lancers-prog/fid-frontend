import { api } from '../lib/api';

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  list: async (): Promise<{ items: AppNotification[]; total: number; unread: number }> =>
    (await api.get('/notifications')).data.data,
  markRead: async (id: string) => (await api.patch(`/notifications/${id}/read`)).data.data,
  markAllRead: async () => (await api.patch('/notifications/read-all')).data.data,
};
