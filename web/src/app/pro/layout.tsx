"use client";

import { useRouter } from "next/navigation";
import { Guard } from "@/components/guard";
import { ProNav } from "@/components/nav";
import { Button } from "@/components/ui";
import { api, usePoll } from "@/lib/hooks";
import { money } from "@/lib/format";

function OfferOverlay() {
  const router = useRouter();
  const { data, reload } = usePoll<any>("/api/pro", 1000);
  const offer = data?.offer ? data.offer : null;
  if (!offer) return null;
  const m = offer;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 text-ink">
        <div className="text-xs font-bold uppercase tracking-wide text-appo">Nouvelle mission</div>
        <div className="mt-1 text-2xl font-black">{m.category?.name ?? "Mission"}</div>
        <div className="text-3xl font-black">{money(m.price)}</div>
        <p className="mt-2">📍 {m.city}</p>
        <p className="text-sm text-muted">{m.description}</p>
        <p className="mt-3 text-sm font-semibold">
          {m.offerExpiresAt ? `${Math.max(0, Math.ceil((new Date(m.offerExpiresAt).getTime() - Date.now()) / 1000))}s` : "En attente"}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            variant="now"
            onClick={async () => {
              await api(`/api/missions/${m.id}`, { action: "accept" });
              reload();
              router.push(`/pro/missions/${m.id}`);
            }}
          >
            Accepter
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await api(`/api/missions/${m.id}`, { action: "pass" });
              reload();
            }}
          >
            Passer
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard role="pro">
      <div className="phone-app relative flex min-h-dvh flex-col">
        <div className="flex-1">{children}</div>
        <ProNav />
        <OfferOverlay />
      </div>
    </Guard>
  );
}
