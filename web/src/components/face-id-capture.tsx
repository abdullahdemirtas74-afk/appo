"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui";

type Props = {
  mode: "selfie" | "identite";
  onCapture: (file: File) => Promise<void> | void;
  disabled?: boolean;
};

export function FaceIdCapture({ mode, onCapture, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">(
    mode === "selfie" ? "user" : "environment",
  );

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setError("");
      setReady(false);
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError(
          mode === "selfie"
            ? "Autorisez la caméra pour le Face ID"
            : "Autorisez la caméra pour photographier votre pièce d’identité",
        );
      }
    }
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, mode]);

  async function snap() {
    const video = videoRef.current;
    if (!video || !ready) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("CAPTURE_FAILED");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("CAPTURE_FAILED");
      const file = new File(
        [blob],
        mode === "selfie" ? `faceid-${Date.now()}.jpg` : `cni-${Date.now()}.jpg`,
        { type: "image/jpeg" },
      );
      await onCapture(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Capture impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative overflow-hidden rounded-3xl border border-line bg-ink ${
          mode === "selfie" ? "aspect-[3/4]" : "aspect-[4/3]"
        }`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${mode === "selfie" ? "scale-x-[-1]" : ""}`}
        />
        {mode === "selfie" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[70%] w-[62%] rounded-[45%] border-2 border-white/70 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/60" />
        )}
        {!ready && !error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-ink/80 text-sm text-white">
            <Loader2 className="mr-2 animate-spin" size={18} /> Ouverture caméra…
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          disabled={disabled || busy}
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
        >
          <SwitchCamera size={16} className="mr-1 inline" />
          Retourner
        </Button>
        <Button
          type="button"
          variant="now"
          className="flex-[1.4]"
          disabled={disabled || busy || !ready}
          onClick={snap}
        >
          {busy ? (
            <>
              <Loader2 size={16} className="mr-1 inline animate-spin" /> Envoi…
            </>
          ) : (
            <>
              <Camera size={16} className="mr-1 inline" />
              {mode === "selfie" ? "Valider Face ID" : "Photographier la CNI"}
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted">
        {mode === "selfie"
          ? "Cadrez votre visage dans l’ovale, regard neutre, bonne lumière."
          : "Cadrez la carte d’identité entière, texte lisible, sans reflets."}
      </p>
    </div>
  );
}

export function FaceIdDoneBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      <Check size={16} className="shrink-0" />
      {label}
    </div>
  );
}
