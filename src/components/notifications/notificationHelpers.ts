import { supabase } from "@/lib/supabaseClient";
import type { NotificationPrefs } from "@/types";

const PREFS_KEY = "palminsight_notification_prefs";

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") {
    return { dailyReminder: true, lowProductivity: true, checkinReminder: true, browserPush: false };
  }
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { dailyReminder: true, lowProductivity: true, checkinReminder: true, browserPush: false };
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function fireBrowserPush(title: string, message: string, tag: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body: message,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag,
    } as NotificationOptions);
  }
}

export async function checkDailyReminder(userId: string) {
  const prefs = getNotificationPrefs();
  if (!prefs.dailyReminder) return;

  const hour = new Date().getHours();
  if (hour < 10) return;

  const today = new Date().toISOString().split("T")[0];

  const { data: todayEntries } = await supabase
    .from("daily_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .limit(1);

  if (!todayEntries || todayEntries.length === 0) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "daily_reminder")
      .gte("created_at", `${today}T00:00:00`)
      .limit(1);

    if (!existing || existing.length === 0) {
      const { data: inserted } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "daily_reminder",
          title: "Daily Harvest Reminder",
          message: "No harvest entries have been logged today. Make sure your team leaders submit their daily data.",
          is_read: false,
        })
        .select()
        .single();

      if (inserted && prefs.browserPush) {
        fireBrowserPush(inserted.title, inserted.message, inserted.type);
      }
    }
  }
}

export async function checkLowProductivity(userId: string) {
  const prefs = getNotificationPrefs();
  if (!prefs.lowProductivity) return;

  const today = new Date();
  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - today.getDay());
  const thisWeekStart = startOfThisWeek.toISOString().split("T")[0];
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const fourWeeksAgoStr = fourWeeksAgo.toISOString().split("T")[0];

  const { data: leaders } = await supabase
    .from("team_leaders")
    .select("id, name, plantation_id")
    .eq("user_id", userId);

  if (!leaders || leaders.length === 0) return;

  const todayStr = today.toISOString().split("T")[0];

  for (const leader of leaders) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "low_productivity")
      .eq("team_leader_id", leader.id)
      .gte("created_at", `${todayStr}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { data: recentEntries } = await supabase
      .from("daily_entries")
      .select("date, tons, bunches")
      .eq("team_leader_id", leader.id)
      .eq("work_status", "work")
      .gte("date", fourWeeksAgoStr)
      .order("date", { ascending: false });

    if (!recentEntries || recentEntries.length < 3) continue;

    const thisWeekEntries = recentEntries.filter((e) => e.date >= thisWeekStart);
    const prevEntries = recentEntries.filter((e) => e.date < thisWeekStart);

    if (thisWeekEntries.length === 0 || prevEntries.length === 0) continue;

    const thisWeekAvg = thisWeekEntries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0) / thisWeekEntries.length;
    const prevAvg = prevEntries.reduce((sum, e) => sum + (Number(e.tons) || 0), 0) / prevEntries.length;

    if (prevAvg > 0 && thisWeekAvg < prevAvg * 0.6) {
      const { data: inserted } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "low_productivity",
          title: "Low Productivity Alert",
          message: `${leader.name}'s tonnage this week is significantly below their recent average. Review their entries.`,
          team_leader_id: leader.id,
          plantation_id: leader.plantation_id,
          is_read: false,
        })
        .select()
        .single();

      if (inserted && prefs.browserPush) {
        fireBrowserPush(inserted.title, inserted.message, inserted.type);
      }
    }
  }
}

export async function checkCheckinReminder(userId: string) {
  const prefs = getNotificationPrefs();
  if (!prefs.checkinReminder) return;

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoff = threeDaysAgo.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: leaders } = await supabase
    .from("team_leaders")
    .select("id, name, plantation_id")
    .eq("user_id", userId);

  if (!leaders || leaders.length === 0) return;

  for (const leader of leaders) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "checkin_reminder")
      .eq("team_leader_id", leader.id)
      .gte("created_at", `${todayStr}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { data: recentEntry } = await supabase
      .from("daily_entries")
      .select("date")
      .eq("team_leader_id", leader.id)
      .gte("date", cutoff)
      .limit(1);

    if (!recentEntry || recentEntry.length === 0) {
      const { data: inserted } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "checkin_reminder",
          title: "Check-in Reminder",
          message: `${leader.name} has not logged any data in the last 3 days. Follow up with them.`,
          team_leader_id: leader.id,
          plantation_id: leader.plantation_id,
          is_read: false,
        })
        .select()
        .single();

      if (inserted && prefs.browserPush) {
        fireBrowserPush(inserted.title, inserted.message, inserted.type);
      }
    }
  }
}

export async function runAllChecks(userId: string) {
  await Promise.allSettled([
    checkDailyReminder(userId),
    checkLowProductivity(userId),
    checkCheckinReminder(userId),
  ]);
}
