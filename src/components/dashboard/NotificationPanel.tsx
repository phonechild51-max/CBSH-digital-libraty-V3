"use client";

import { timeAgo } from "@/lib/utils";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  info: { color: "var(--color-info)", icon: Info },
  success: { color: "var(--color-success)", icon: CheckCircle },
  warning: { color: "var(--color-warning)", icon: AlertTriangle },
  error: { color: "var(--color-danger)", icon: XCircle },
};

export function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAllRead,
  isOpen,
  onClose,
}: NotificationPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden animate-fade-in-up"
        style={{
          width: "340px",
          backgroundColor: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--color-border-divider)" }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-heading)" }}
          >
            Notifications
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs font-medium transition-colors hover:underline"
              style={{ color: "var(--color-accent-amber)" }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4">
              <Bell
                size={32}
                className="mb-3"
                style={{ color: "var(--color-text-muted)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No notifications
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  className="flex gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderLeft: `3px solid ${config.color}`,
                    backgroundColor: notif.read
                      ? "transparent"
                      : "var(--color-accent-amber-subtle)",
                    borderBottom: "1px solid var(--color-border-divider)",
                  }}
                >
                  <Icon
                    size={16}
                    className="mt-0.5 flex-shrink-0"
                    style={{ color: config.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-snug"
                      style={{
                        color: notif.read
                          ? "var(--color-text-secondary)"
                          : "var(--color-text-primary)",
                      }}
                    >
                      {notif.message}
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
