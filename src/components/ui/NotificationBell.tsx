// src/components/ui/NotificationBell.tsx
import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  match_found: 'search', claim_accepted: 'verified', claim_declined: 'cancel',
  claim_submitted: 'assignment', item_resolved: 'handshake', message: 'mail', system: 'info',
  finder_found: 'search',
};

export default function NotificationBell() {
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = async () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) await markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={handleOpen} className="relative p-2 rounded-full hover:bg-surface-container transition-colors" aria-label="Notifications">
        <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-error rounded-full text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-high z-50 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-surface-container-high">
            <h3 className="font-headline font-bold text-on-surface text-sm">Notifications</h3>
            <span className="text-[10px] font-bold text-outline uppercase">{unreadCount} unread</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant block mb-2">notifications_none</span>
                <p className="text-sm text-on-surface-variant">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`flex gap-3 px-5 py-4 border-b border-surface-container-low hover:bg-surface-container-low ${!n.is_read ? 'bg-primary-container/5' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-primary-container/20' : 'bg-surface-container-high'}`}>
                    <span className={`material-symbols-outlined text-[16px] ${!n.is_read ? 'text-primary' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {TYPE_ICON[n.type] ?? 'circle_notifications'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold' : ''}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-outline mt-1 uppercase">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-primary rounded-full mt-2" />}
                </div>
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-surface-container-high text-center">
            <p className="text-[10px] text-outline uppercase">Updates every 30 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}