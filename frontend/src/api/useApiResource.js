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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
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
}