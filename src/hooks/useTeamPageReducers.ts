import { useReducer } from "react";
import { DailyEntry, BijiRelai } from "@/types";
import { toLocalDateKey } from "@/lib/date";

// --- Entry Form ---
export interface EntryFormState {
  workStatus: string;
  date: string;
  numWorkers: string;
  lot: string;
  bunches: string;
  tons: string;
  backlogs: string;
  notes: string;
  latitude: string;
  longitude: string;
  lotLabel: string;
}

export const emptyEntryForm: EntryFormState = {
  workStatus: "work",
  date: toLocalDateKey(new Date()),
  numWorkers: "",
  lot: "",
  bunches: "",
  tons: "",
  backlogs: "",
  notes: "",
  latitude: "",
  longitude: "",
  lotLabel: "",
};

type EntryFormAction =
  | { type: "SET"; field: keyof EntryFormState; value: string }
  | { type: "RESET" }
  | { type: "LOAD"; entry: DailyEntry };

function entryFormReducer(state: EntryFormState, action: EntryFormAction): EntryFormState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...emptyEntryForm, date: toLocalDateKey(new Date()) };
    case "LOAD": {
      const e = action.entry;
      return {
        workStatus: e.work_status || "work",
        date: e.date || state.date,
        numWorkers: e.work_status === "work" ? String(e.num_workers ?? "") : "",
        lot: e.lot || "",
        bunches: e.work_status === "work" ? String(e.bunches ?? "") : "",
        tons: e.tons != null ? String(e.tons) : "",
        backlogs: e.work_status === "work" ? String(e.backlogs ?? "") : "",
        notes: e.notes || "",
        latitude: e.latitude != null ? String(e.latitude) : "",
        longitude: e.longitude != null ? String(e.longitude) : "",
        lotLabel: e.lot_label || "",
      };
    }
  }
}

// --- Filter ---
export type FilterState = {
  filterMode: "single" | "range";
  filterDate: string;
  filterFrom: string;
  filterTo: string;
  showFilterPanel: boolean;
};

export const emptyFilter: FilterState = {
  filterMode: "single",
  filterDate: "",
  filterFrom: "",
  filterTo: "",
  showFilterPanel: false,
};

type FilterAction =
  | { type: "SET"; field: keyof FilterState; value: string | boolean }
  | { type: "RESET" };

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...emptyFilter };
  }
}

// --- Detail Edit ---
export interface DetailEditState {
  workStatus: string;
  date: string;
  numWorkers: string;
  lot: string;
  bunches: string;
  tons: string;
  backlogs: string;
  notes: string;
  latitude: string;
  longitude: string;
  lotLabel: string;
}

export const emptyDetailEdit: DetailEditState = {
  workStatus: "work",
  date: "",
  numWorkers: "",
  lot: "",
  bunches: "",
  tons: "",
  backlogs: "",
  notes: "",
  latitude: "",
  longitude: "",
  lotLabel: "",
};

type DetailEditAction =
  | { type: "SET"; field: keyof DetailEditState; value: string }
  | { type: "RESET" }
  | { type: "LOAD"; entry: DailyEntry };

function detailEditReducer(state: DetailEditState, action: DetailEditAction): DetailEditState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return emptyDetailEdit;
    case "LOAD": {
      const e = action.entry;
      return {
        workStatus: e.work_status || "work",
        date: e.date || state.date,
        numWorkers: e.work_status === "work" ? String(e.num_workers ?? "") : "",
        lot: e.lot || "",
        bunches: e.work_status === "work" ? String(e.bunches ?? "") : "",
        tons: e.tons != null ? String(e.tons) : "",
        backlogs: e.work_status === "work" ? String(e.backlogs ?? "") : "",
        notes: e.notes || "",
        latitude: e.latitude != null ? String(e.latitude) : "",
        longitude: e.longitude != null ? String(e.longitude) : "",
        lotLabel: e.lot_label || "",
      };
    }
  }
}

// --- Detail View ---
const nowYM = (() => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
})();

export type DetailViewState = {
  month: string;
  dateFrom: string;
  dateTo: string;
  showEditModal: boolean;
  editEntry: DailyEntry | null;
  saving: boolean;
};

export const emptyDetailViewState: DetailViewState = {
  month: nowYM,
  dateFrom: "",
  dateTo: "",
  showEditModal: false,
  editEntry: null,
  saving: false,
};

type DetailViewAction =
  | { type: "SET"; field: keyof DetailViewState; value: any }
  | { type: "PREV_MONTH" }
  | { type: "NEXT_MONTH" }
  | { type: "OPEN_EDIT"; entry: DailyEntry }
  | { type: "CLOSE_EDIT" }
  | { type: "RESET_MONTH" };

function detailViewReducer(state: DetailViewState, action: DetailViewAction): DetailViewState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "PREV_MONTH": {
      const [y, m] = state.month.split("-").map(Number);
      const d = new Date(y, m - 2, 1);
      return { ...state, month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }
    case "NEXT_MONTH": {
      const [y, m] = state.month.split("-").map(Number);
      const d = new Date(y, m, 1);
      return { ...state, month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    }
    case "OPEN_EDIT":
      return { ...state, showEditModal: true, editEntry: action.entry };
    case "CLOSE_EDIT":
      return { ...state, showEditModal: false, editEntry: null };
    case "RESET_MONTH":
      return { ...state, month: nowYM, dateFrom: "", dateTo: "" };
  }
}

// --- Leader Form ---
export type LeaderFormState = {
  showModal: boolean;
  name: string;
  phone: string;
};

export const emptyLeaderForm: LeaderFormState = {
  showModal: false,
  name: "",
  phone: "",
};

type LeaderFormAction =
  | { type: "SET"; field: keyof LeaderFormState; value: any }
  | { type: "OPEN" }
  | { type: "CLOSE" };

function leaderFormReducer(state: LeaderFormState, action: LeaderFormAction): LeaderFormState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "OPEN":
      return { ...state, showModal: true };
    case "CLOSE":
      return emptyLeaderForm;
  }
}

function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function defaultDateForMonth(ym: string): string {
  const now = new Date();
  const nowYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (ym === nowYM) return toLocalDateKey(now);
  return ym + "-01";
}

// --- Biji Relai Form ---
export type BijiRelaiFormState = {
  showModal: boolean;
  month: string;
  date: string;
  tons: string;
  saving: boolean;
  savedId: string | null;
};

export const emptyBijiRelaiForm: BijiRelaiFormState = {
  showModal: false,
  month: nowYM,
  date: toLocalDateKey(new Date()),
  tons: "",
  saving: false,
  savedId: null,
};

type BijiRelaiFormAction =
  | { type: "SET"; field: keyof BijiRelaiFormState; value: any }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "SAVED" }
  | { type: "NEW_ENTRY" }
  | { type: "PREV_MONTH" }
  | { type: "NEXT_MONTH" };

function bijiRelaiFormReducer(state: BijiRelaiFormState, action: BijiRelaiFormAction): BijiRelaiFormState {
  switch (action.type) {
    case "SET":
      return { ...state, [action.field]: action.value };
    case "OPEN":
      return { ...state, showModal: true, month: nowYM, date: toLocalDateKey(new Date()), tons: "", savedId: null };
    case "CLOSE":
      return { ...state, showModal: false };
    case "SAVED":
      return { ...state, saving: false, savedId: "saved", date: defaultDateForMonth(state.month), tons: "" };
    case "NEW_ENTRY":
      return { ...state, savedId: null, date: defaultDateForMonth(state.month), tons: "" };
    case "PREV_MONTH":
      return { ...state, month: shiftMonth(state.month, -1), date: defaultDateForMonth(shiftMonth(state.month, -1)) };
    case "NEXT_MONTH":
      return { ...state, month: shiftMonth(state.month, 1), date: defaultDateForMonth(shiftMonth(state.month, 1)) };
  }
}

// --- Custom hook to initialize all reducers ---
export function useTeamPageReducers() {
  const [entryForm, entryFormDispatch] = useReducer(entryFormReducer, emptyEntryForm);
  const [filters, filterDispatch] = useReducer(filterReducer, emptyFilter);
  const [detailEdit, detailDispatch] = useReducer(detailEditReducer, emptyDetailEdit);
  const [detailView, detailViewDispatch] = useReducer(detailViewReducer, emptyDetailViewState);
  const [leaderForm, leaderFormDispatch] = useReducer(leaderFormReducer, emptyLeaderForm);
  const [bijiRelaiForm, bijiRelaiFormDispatch] = useReducer(bijiRelaiFormReducer, emptyBijiRelaiForm);

  return {
    entryForm,
    entryFormDispatch,
    filters,
    filterDispatch,
    detailEdit,
    detailDispatch,
    detailView,
    detailViewDispatch,
    leaderForm,
    leaderFormDispatch,
    bijiRelaiForm,
    bijiRelaiFormDispatch,
  };
}
