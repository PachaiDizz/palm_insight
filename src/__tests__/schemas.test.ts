import { describe, it, expect } from "vitest";
import {
  PlantationSchema,
  TeamLeaderSchema,
  DailyEntrySchema,
  DailyEntryWithRelationsSchema,
} from "@/lib/schemas";

describe("PlantationSchema", () => {
  it("validates a correct plantation", () => {
    const data = {
      id: "1",
      user_id: "user1",
      rancangan: "Rancangan A",
      peringkat: "Level 1",
      block: "Block A",
      ketua_block: null,
      biro_ladang: null,
      penyelia: null,
      mandor: null,
      area_hectare: 100,
      created_at: "2024-01-15T08:00:00Z",
    };
    expect(PlantationSchema.parse(data)).toEqual(data);
  });

  it("rejects missing required fields", () => {
    expect(() => PlantationSchema.parse({})).toThrow();
  });
});

describe("TeamLeaderSchema", () => {
  it("validates a correct team leader", () => {
    const data = {
      id: "1",
      user_id: "user1",
      plantation_id: "plant1",
      name: "John Doe",
      phone: "1234567890",
      created_at: "2024-01-15T08:00:00Z",
    };
    expect(TeamLeaderSchema.parse(data)).toEqual(data);
  });

  it("allows null phone", () => {
    const data = {
      id: "1",
      user_id: "user1",
      plantation_id: "plant1",
      name: "John Doe",
      phone: null,
      created_at: "2024-01-15T08:00:00Z",
    };
    expect(TeamLeaderSchema.parse(data)).toEqual(data);
  });
});

describe("DailyEntrySchema", () => {
  it("validates a correct daily entry", () => {
    const data = {
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
    };
    expect(DailyEntrySchema.parse(data)).toEqual(data);
  });

  it("rejects invalid work_status", () => {
    const data = {
      id: "1",
      user_id: "user1",
      team_leader_id: "leader1",
      plantation_id: "plant1",
      work_status: "invalid",
      date: "2024-01-15",
      num_workers: null,
      lot: null,
      bunches: null,
      tons: null,
      backlogs: null,
      notes: null,
      latitude: null,
      longitude: null,
      lot_label: null,
      created_at: "2024-01-15T08:00:00Z",
    };
    expect(() => DailyEntrySchema.parse(data)).toThrow();
  });
});

describe("DailyEntryWithRelationsSchema", () => {
  it("validates entry with relations", () => {
    const data = {
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
      team_leaders: { name: "John Doe" },
      plantations: { block: "Block A" },
    };
    expect(DailyEntryWithRelationsSchema.parse(data)).toEqual(data);
  });

  it("validates entry without relations", () => {
    const data = {
      id: "1",
      user_id: "user1",
      team_leader_id: "leader1",
      plantation_id: "plant1",
      work_status: "work",
      date: "2024-01-15",
      num_workers: null,
      lot: null,
      bunches: null,
      tons: null,
      backlogs: null,
      notes: null,
      latitude: null,
      longitude: null,
      lot_label: null,
      created_at: "2024-01-15T08:00:00Z",
    };
    expect(DailyEntryWithRelationsSchema.parse(data)).toEqual(data);
  });
});
