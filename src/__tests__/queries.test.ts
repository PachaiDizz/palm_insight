import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {},
}));

import { computeLeaderStats } from "@/lib/queries";
import type { DailyEntry } from "@/types";

function makeEntry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    id: "1",
    user_id: "user1",
    team_leader_id: "leader1",
    plantation_id: "plant1",
    work_status: "work",
    date: "2024-01-15",
    num_workers: 5,
    lot: "A",
    bunches: 100,
    tons: 2.5,
    backlogs: 10,
    notes: null,
    latitude: null,
    longitude: null,
    lot_label: null,
    created_at: "2024-01-15T08:00:00Z",
    ...overrides,
  };
}

describe("computeLeaderStats", () => {
  it("returns zeros for empty entries", () => {
    const stats = computeLeaderStats([]);
    expect(stats.totalEntries).toBe(0);
    expect(stats.workDays).toBe(0);
    expect(stats.noWorkDays).toBe(0);
    expect(stats.totalBunches).toBe(0);
    expect(stats.totalTons).toBe(0);
    expect(stats.totalBacklogs).toBe(0);
  });

  it("calculates stats for work days only", () => {
    const entries = [
      makeEntry({ work_status: "work", bunches: 100, tons: 2.5, backlogs: 10, num_workers: 5 }),
      makeEntry({ work_status: "no_work", bunches: 0, tons: 0, backlogs: 0, num_workers: 0 }),
      makeEntry({ work_status: "work", bunches: 200, tons: 5.0, backlogs: 20, num_workers: 8 }),
    ];
    const stats = computeLeaderStats(entries);

    expect(stats.totalEntries).toBe(3);
    expect(stats.workDays).toBe(2);
    expect(stats.noWorkDays).toBe(1);
    expect(stats.totalBunches).toBe(300);
    expect(stats.totalTons).toBe(7.5);
    expect(stats.totalBacklogs).toBe(30);
  });

  it("calculates averages correctly", () => {
    const entries = [
      makeEntry({ work_status: "work", bunches: 100, tons: 2.0, num_workers: 4 }),
      makeEntry({ work_status: "work", bunches: 200, tons: 4.0, num_workers: 6 }),
    ];
    const stats = computeLeaderStats(entries);

    expect(stats.avgBunches).toBe(150);
    expect(stats.avgTons).toBe("3.00");
    expect(stats.avgWorkers).toBe(5);
  });

  it("handles null values gracefully", () => {
    const entries = [
      makeEntry({ bunches: null, tons: null, backlogs: null, num_workers: null }),
    ];
    const stats = computeLeaderStats(entries);

    expect(stats.totalBunches).toBe(0);
    expect(stats.totalTons).toBe(0);
    expect(stats.totalBacklogs).toBe(0);
  });
});
