import { useEffect, useState } from "react";

const getViewBox = (lat, lon) => {
  const offset = 0.05; // 🔥 smaller = stricter city restriction
  return `${lon - offset},${lat - offset},${lon + offset},${lat + offset}`;
};

const useAutoComplete = (query, delay = 500, lat, lon) => {
  const [result, setResult] = useState([]);
  const [Loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setResult([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const viewbox =
          lat && lon ? `&viewbox=${getViewBox(lat, lon)}&bounded=1` : "";

        const url = `https://us1.locationiq.com/v1/autocomplete?key=${
          import.meta.env.VITE_LOCATIONIQ_API_KEY
        }&q=${encodeURIComponent(query)}
        &countrycodes=in
        &format=json
        ${viewbox}`;

        const res = await fetch(url, { signal });

        if (!res.ok) throw new Error("API Error");

        const data = await res.json();

        setResult(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, delay, lat, lon]);

  return { result, setResult, Loading, error };
};

export default useAutoComplete;