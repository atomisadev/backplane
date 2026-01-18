import { useState, useCallback, useEffect } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoState<T>(key: string, initialValue: T) {
  const [history, setHistory] = useState<HistoryState<T>>(() => {
    if (typeof window === "undefined") {
      return { past: [], present: initialValue, future: [] };
    }
    try {
      const item = window.localStorage.getItem(key);
      const present = item ? JSON.parse(item) : initialValue;
      return { past: [], present, future: [] };
    } catch (error) {
      return { past: [], present: initialValue, future: [] };
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(history.present));
    } catch (error) {
      console.error("Failed to save to local storage", error);
    }
  }, [key, history.present]);

  const setState = useCallback((newStateOrUpdater: T | ((prev: T) => T)) => {
    setHistory((curr) => {
      const { present, past } = curr;
      const newState =
        typeof newStateOrUpdater === "function"
          ? (newStateOrUpdater as Function)(present)
          : newStateOrUpdater;

      if (JSON.stringify(newState) === JSON.stringify(present)) {
        return curr;
      }

      return {
        past: [...past, present],
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((curr) => {
      const { past, present, future } = curr;
      if (past.length === 0) return curr;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((curr) => {
      const { past, present, future } = curr;
      if (future.length === 0) return curr;

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory((curr) => ({
      ...curr,
      past: [],
      future: [],
    }));
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clearHistory,
  };
}
