import { useCallback, useEffect, useRef, useState } from "react";

export function useApiResource(loader, dependencies = []) {
  const requestVersion = useRef(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (version === requestVersion.current) setData(result);
    } catch (err) {
      if (version === requestVersion.current) setError(err);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    reload();
    return () => {
      requestVersion.current += 1;
    };
  }, [reload]);

  return { data, loading, error, reload };
}
