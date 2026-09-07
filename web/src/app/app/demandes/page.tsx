"use client";

import Link from "next/link";
import { Badge, Button } from "@/components/ui";
import { usePoll } from "@/lib/hooks";
import { formatDate } from "@/lib/format";

export default function ClientDemandesList() {
  const { data } = usePoll<{ requests: any[] }>("/api/requests", 4000);
  return (
    <div className="px-4 py-5 sm:px-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Mes demandes</h1>
        <Button href="/app/demandes/nouvelle" variant="now">
          Publier un besoin
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted">Comparez les offres des pros, puis réservez.</p>
      <div className="mt-6 space-y-3">
        {(data?.requests ?? []).length === 0 ? (
          <p className="text-sm text-muted">Aucune demande pour le moment.</p>
        ) : (
          (data?.requests ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/app/demandes/${r.id}`}
              className="block rounded-3xl border border-line bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">{r.category?.name}</div>
                <Badge>{r.status}</Badge>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{r.description}</p>
              <div className="mt-2 text-xs text-muted">
                {formatDate(r.createdAt)} · {r.offerCount ?? 0} offre(s)
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
