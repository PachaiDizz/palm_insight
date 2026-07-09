"use client";

import { useRouter } from "next/navigation";
import { X, ClipboardList, TrendingDown, Users } from "lucide-react";
import type { Notification } from "@/types";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const typeConfig = {
  daily_reminder: {
    icon: ClipboardList,
    color: "var(--accent-primary)",
    bgColor: "var(--accent-primary-light)",
    actionLabel: "Go to Teams",
    actionHref: "/team",
  },
  low_productivity: {
    icon: TrendingDown,
    color: "var(--accent-red)",
    bgColor: "var(--accent-red-light)",
    actionLabel: "View Details",
    actionHref: "", // dynamic
  },
  checkin_reminder: {
    icon: Users,
    color: "var(--accent-blue)",
    bgColor: "var(--accent-blue-light)",
    actionLabel: "View Details",
    actionHref: "", // dynamic
  },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-MY", { month: "short", day: "numeric" });
}

export default function NotificationCard({ notification, onMarkAsRead, onDismiss }: NotificationCardProps) {
  const router = useRouter();
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const handleAction = () => {
    onMarkAsRead(notification.id);
    if (notification.type === "daily_reminder") {
      router.push("/team");
    } else if (notification.team_leader_id) {
      router.push(`/team?leader=${notification.team_leader_id}`);
    }
  };

  const handleClick = () => {
    if (!notification.is_read) onMarkAsRead(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5 ${
        !notification.is_read ? "border-l-2" : ""
      }`}
      style={{
        borderLeftColor: !notification.is_read ? "var(--accent-primary)" : undefined,
        backgroundColor: !notification.is_read ? "rgba(99,102,241,0.04)" : undefined,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon className="w-4 h-4" style={{ color: config.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-theme leading-snug">{notification.title}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            className="p-1 rounded-lg hover:bg-white/10 shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          </button>
        </div>
        <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {notification.message}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {timeAgo(notification.created_at)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAction();
            }}
            className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--accent-primary)" }}
          >
            {config.actionLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}
