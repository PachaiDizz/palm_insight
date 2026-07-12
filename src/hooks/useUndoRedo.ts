"use client";
import { useCallback, useRef, useState } from "react";

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseUndoRedoOptions {
  limit?: number;
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T), options?: { addToHistory?: boolean }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  historyLength: number;
}

export function useUndoRedo<T>(
  initialState: T,
  options: UseUndoRedoOptions = {}
): UseUndoRedoReturn<T> {
  const { limit = 50 } = options;
  const [state, setInternalState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const setState = useCallback(
    (newState: T | ((prev: T) => T), opts?: { addToHistory?: boolean }) => {
      const { addToHistory = true } = opts ?? {};
      setInternalState((prev) => {
        const resolvedPrev = prev.present;
        const nextPresent =
          typeof newState === "function"
            ? (newState as (prev: T) => T)(resolvedPrev)
            : newState;

        if (!addToHistory) {
          return { ...prev, present: nextPresent };
        }

        const newPast = [...prev.past, resolvedPrev];
        if (newPast.length > limit) newPast.shift();

        return {
          past: newPast,
          present: nextPresent,
          future: [],
        };
      });
    },
    [limit]
  );

  const undo = useCallback(() => {
    setInternalState((prev) => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const previous = newPast.pop()!;
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setInternalState((prev) => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const next = newFuture.shift()!;
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setInternalState((prev) => ({
      past: [],
      present: prev.present,
      future: [],
    }));
  }, []);

  return {
    state: state.present,
    setState,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    clearHistory,
    historyLength: state.past.length,
  };
}
