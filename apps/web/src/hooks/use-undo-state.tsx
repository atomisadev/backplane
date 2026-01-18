import { useState, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useUndoState<T>(key: string, initialValue: T) {
  const [state, _setState] = useLocalStorage<T>(key, initialValue);

  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      _setState((currentState) => {
        const valueToStore =
          newState instanceof Function ? newState(currentState) : newState;

        if (valueToStore === currentState) return currentState;

        setPast((prev) => [...prev, currentState]);
        setFuture([]);

        return valueToStore;
      });
    },
    [_setState],
  );

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const newPast = [...prevPast];
      const previousState = newPast.pop();

      _setState((currentState) => {
        setFuture((prevFuture) => [currentState, ...prevFuture]);
        return previousState as T;
      });

      return newPast;
    });
  }, [_setState]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const newFuture = [...prevFuture];
      const nextState = newFuture.shift();

      _setState((currentState) => {
        setPast((prevPast) => [...prevPast, currentState]);
        return nextState as T;
      });

      return newFuture;
    });
  }, [_setState]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
  };
}
