"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import NotificationCard from "./NotificationCard";
import type { Notification } from "@/types";

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClose: () => void;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClose,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[var(--z-modal)]"
          style={{ background: "rgba(0, 0, 0, 0.6)" }}
          onClick={onClose}
        />
        {/* Bottom sheet */}
        <div
          ref={panelRef}
          className="fixed bottom-0 left-0 right-0 z-[var(--z-modal)] flex flex-col rounded-t-[20px] border-t shadow-2xl animate-slide-up"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-default)",
            maxHeight: "70vh",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <span className="text-sm font-semibold text-theme">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
                  style={{ color: "var(--accent-primary)" }}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg transition-colors hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onMarkAsRead={onMarkAsRead}
                  onDismiss={onDismiss}
                />
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      className="absolute rounded-2xl border shadow-2xl shadow-black/40 z-[var(--z-modal)] flex flex-col overflow-hidden"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-default)",
        left: "100%",
        top: 0,
        marginLeft: 8,
        width: "min(360px, calc(100vw - 32px))",
        maxHeight: 500,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span className="text-sm font-semibold text-theme">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--accent-primary)" }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <NotificationCard
              key={n.id}
              notification={n}
              onMarkAsRead={onMarkAsRead}
              onDismiss={onDismiss}
            />
          ))
        )}
      </div>
    </div>
  );
}
