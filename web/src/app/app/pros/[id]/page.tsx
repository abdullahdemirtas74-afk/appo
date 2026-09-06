"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BadgeCheck, Heart } from "lucide-react";
import { Avatar, Badge, Button, Field, Stars, inputClass } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { useMe } from "@/components/guard";
import { DAY_LABELS, km, money, stars } from "@/lib/format";

function ProInner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { data: me } = useMe();
  const { data, reload } = usePoll<{ pro: any }>(id ? `/api/pros/${id}` : null, 0);
  const [mode, setMode] = useState<"now" | "scheduled">(params.get("when") ? "scheduled" : "now");
  const [when, setWhen] = useState(params.get("when") ?? "");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const p = data?.pro;
  const fav = me?.favorites?.some((f) => f.proId === id);

  if (!p) return <div className="p-6 text-muted">Chargement…</div>;
  const addr = me?.addresses?.find((a) => a.isDefault);

  async function book() {
    if (mode === "now" && !p.availableNow) {
      setMode("scheduled");
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ mission: { id: string } }>("/api/missions", {
        type: mode,
        categoryId: p.categoryIds[0],
        description: description || "Réservation depuis le profil",
        photos: [],
        address: addr?.line ?? "Rumilly",
        city: addr?.city ?? "Rumilly",
        lat: addr?.lat ?? p.lat,
        lng: addr?.lng ?? p.lng,
        scheduledAt: mode === "scheduled" && when ? new Date(when).toISOString() : undefined,
        proId: p.id,
      });
      router.push(`/app/missions/${res.mission.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-8">
      <div className="h-36 bg-gradient-to-br from-ink to-zinc-700" />
      <div className="px-5 -mt-10">
        <div className="flex items-end justify-between">
          <Avatar initials={p.user.avatar} size="lg" />
          <button
            className={`rounded-full border p-2 ${fav ? "border-appo text-appo" : "border-line"}`}
            onClick={async () => {
              await api(`/api/pros/${p.id}`, {});
              reload();
            }}
          >
            <Heart size={18} className={fav ? "fill-appo" : ""} />
          </button>
        </div>
        <h1 className="mt-3 text-2xl font-extrabold">
          {p.user.firstName} {p.user.lastName}
        </h1>
        <p className="text-muted">{p.company}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {p.verified ? (
            <Badge tone="green">
              <BadgeCheck size={12} /> Pro vérifié
            </Badge>
          ) : null}
          <Badge>
            ⭐ {stars(p.rating)} · {p.reviewCount} avis
          </Badge>
          <Badge>{p.missionCount} missions</Badge>
          {p.availability ? (
            <Badge tone={p.availableNow ? "green" : "orange"}>{p.availability.label}</Badge>
          ) : null}
        </div>
        <p className="mt-4 text-sm leading-relaxed">{p.description}</p>
        <p className="mt-2 text-sm text-muted">
          {p.experienceYears} ans d’expérience · Zone {p.city} · {p.radiusKm} km
        </p>
        <p className="mt-1 font-bold">À partir de {money(p.startingPrice)}</p>
        {p.distanceKm != null ? <p className="text-sm text-muted">📍 {km(p.distanceKm)}</p> : null}
        <div className="mt-4 flex gap-2">
          {(p.categories ?? []).map((c: { id: string; name: string }) => (
            <Badge key={c.id}>{c.name}</Badge>
          ))}
        </div>
        {p.photos?.length ? (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {p.photos.map((src: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="h-28 w-40 rounded-2xl object-cover" />
            ))}
          </div>
        ) : null}
        {p.certifications?.length ? (
          <p className="mt-3 text-sm">Certifications : {p.certifications.join(", ")}</p>
        ) : null}
        <div className="mt-4 rounded-2xl bg-background p-4 text-sm">
          {p.schedule?.map((s: { day: number; start: string; end: string; available: boolean; breakStart?: string; breakEnd?: string }) => (
            <div key={s.day} className="flex justify-between py-0.5">
              <span>{DAY_LABELS[s.day]}</span>
              <span className="text-muted">
                {s.available
                  ? `${s.start}–${s.end}${s.breakStart && s.breakEnd ? ` (pause ${s.breakStart}–${s.breakEnd})` : ""}`
                  : "indisponible"}
              </span>
            </div>
          ))}
        </div>
        {p.absences?.length ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm">
            <div className="font-semibold">Absences à venir</div>
            {p.absences.slice(0, 3).map((a: { id: string; startAt: string; endAt: string; reason: string }) => (
              <div key={a.id} className="mt-1 text-muted">
                {a.reason} · {new Date(a.startAt).toLocaleDateString("fr-FR")} →{" "}
                {new Date(a.endAt).toLocaleDateString("fr-FR")}
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`rounded-2xl py-3 font-semibold ${mode === "now" ? "bg-appo text-white" : "bg-background"} ${!p.availableNow ? "opacity-40" : ""}`}
              disabled={!p.availableNow}
              onClick={() => setMode("now")}
            >
              Maintenant
            </button>
            <button className={`rounded-2xl py-3 font-semibold ${mode === "scheduled" ? "bg-ink text-white" : "bg-background"}`} onClick={() => setMode("scheduled")}>
              Planifier
            </button>
          </div>
          {!p.availableNow && mode === "now" ? (
            <p className="text-sm text-amber-700">{p.availability?.label || "Indisponible pour AppO Now"} — choisissez Planifier.</p>
          ) : null}
          {mode === "scheduled" ? (
            <Field label="Date / heure">
              <input className={inputClass} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            </Field>
          ) : null}
          <Field label="Description">
            <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Button variant="now" className="w-full" disabled={loading} onClick={book}>
            Réserver
          </Button>
        </div>
        <h2 className="mt-8 font-bold">Avis</h2>
        <div className="mt-3 space-y-3">
          {(p.reviews ?? []).map((r: { id: string; rating: number; comment: string; client: { firstName: string } }) => (
            <div key={r.id} className="rounded-2xl border border-line p-3">
              <div className="flex items-center justify-between">
                <b>{r.client.firstName}</b>
                <Stars value={r.rating} />
              </div>
              <p className="mt-1 text-sm">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProPublicPage() {
  return (
    <Suspense>
      <ProInner />
    </Suspense>
  );
}
