// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/notificationsApi';
import { useAuth } from '../contexts/AuthContext';
import type { Notification } from '../types/database';

export function useNotifications() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [count, recent] = await Promise.all([
      notificationsApi.getUnreadCount(user.id),
      notificationsApi.getRecent(user.id),
    ]);
    setUnreadCount(count);
    setNotifications((recent.data as Notification[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [user, fetchAll]);

  const markAllRead = async () => {
    if (!user) return;
    await notificationsApi.markAllRead(user.id);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return { unreadCount, notifications, loading, markAllRead, refresh: fetchAll };
}