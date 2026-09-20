<<<<<<< HEAD
import { useCallback, useEffect, useState } from 'react';

export function useApiResource(loader, dependencies = []) {
=======
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export function useApiResource(
  loader,
  dependencies = []
) {
>>>>>>> origin/main
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

<<<<<<< HEAD
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
=======
  const initialRequestStarted = useRef(false);
  const mountedRef = useRef(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loader();

      if (mountedRef.current) {
        setData(result);
      }

      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }

      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
>>>>>>> origin/main
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
<<<<<<< HEAD
    reload();
  }, [reload]);

  return { data, loading, error, reload };
=======
    mountedRef.current = true;

    if (!initialRequestStarted.current) {
      initialRequestStarted.current = true;

      reload().catch(() => {
        // Error is already stored in hook state.
      });
    }

    return () => {
      mountedRef.current = false;
    };
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
>>>>>>> origin/main
}