"use client";

import { useCallback, useEffect, useState } from "react";

export function usePoll<T>(url: string | null, ms = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    setLoading(true);
    reload();
    if (!url || !ms) return;
    const id = setInterval(reload, ms);
    return () => clearInterval(id);
  }, [reload, url, ms]);

  return { data, error, loading, reload };
}

export async function api<T>(url: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur");
  return json as T;
}

/** Upload file to disk via /api/uploads — returns durable URL (not base64). */
export async function uploadFile(file: File): Promise<{ url: string; name: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload impossible");
  return { url: json.url as string, name: (json.name as string) || file.name };
}

/** @deprecated prefer uploadFile — kept for tiny legacy fallbacks */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
