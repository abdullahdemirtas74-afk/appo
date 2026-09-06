"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MapPin, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";
import { useMe } from "@/components/guard";
import { usePoll } from "@/lib/hooks";

type Cat = { id: string; name: string; emoji: string };

export default function ClientHome() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data } = usePoll<{ categories: Cat[] }>("/api/categories", 0);
  const addr = me?.addresses?.find((a) => a.isDefault);

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <Logo size="sm" />
        <button className="relative rounded-full border border-line p-2">
          <Bell size={18} />
          {me?.unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-appo" /> : null}
        </button>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm text-muted">
        <MapPin size={16} className="text-appo" />
        {addr ? `${addr.line}, ${addr.city}` : "Rumilly"}
      </div>
      <h1 className="mt-2 text-2xl font-extrabold">Quel service recherchez-vous ?</h1>
      <button
        onClick={() => router.push("/app/recherche")}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-line bg-background px-4 py-3.5 text-left text-muted"
      >
        <Search size={18} />
        Plombier, électricien, ménage…
      </button>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button href="/app/now" variant="now" className="h-24 flex-col">
          <span className="text-lg">AppO Now</span>
          <span className="text-xs font-medium opacity-90">Besoin immédiat</span>
        </Button>
        <Button href="/app/planifier" variant="dark" className="h-24 flex-col">
          <span className="text-lg">Planifier</span>
          <span className="text-xs font-medium opacity-80">Choisir un créneau</span>
        </Button>
      </div>
      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Catégories</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 pb-8">
        {(data?.categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/app/recherche?categoryId=${c.id}`}
            className="rounded-2xl border border-line bg-white p-3 text-center"
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-1 text-[11px] font-semibold leading-tight">{c.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
