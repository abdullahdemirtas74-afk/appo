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
    <div className="px-4 pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8">
      <div className="flex items-center justify-between md:hidden">
        <Logo size="sm" />
        <button className="relative rounded-full border border-line bg-card p-2">
          <Bell size={18} />
          {me?.unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-appo" /> : null}
        </button>
      </div>

      <div className="hidden items-start justify-between md:flex">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-muted">
            <MapPin size={16} className="shrink-0 text-appo" />
            <span className="truncate">{addr ? `${addr.line}, ${addr.city}` : "Rumilly"}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight lg:text-4xl">
            Quel service recherchez-vous ?
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Trouvez un pro vérifié autour de vous — immédiatement ou sur rendez-vous.
          </p>
        </div>
        <button className="relative shrink-0 rounded-full border border-line bg-card p-3">
          <Bell size={18} />
          {me?.unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-appo" /> : null}
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-muted md:hidden">
        <MapPin size={16} className="shrink-0 text-appo" />
        <span className="truncate">{addr ? `${addr.line}, ${addr.city}` : "Rumilly"}</span>
      </div>
      <h1 className="mt-2 text-2xl font-extrabold md:hidden">Quel service recherchez-vous ?</h1>

      <button
        onClick={() => router.push("/app/recherche")}
        className="mt-4 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 text-left text-muted md:mt-6"
      >
        <Search size={18} className="shrink-0" />
        Plombier, électricien, ménage…
      </button>

      <div className="mt-5 grid max-w-2xl grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:mt-6">
        <Button href="/app/now" variant="now" className="h-24 flex-col md:h-28">
          <span className="text-lg">AppO Now</span>
          <span className="text-xs font-medium opacity-90">Besoin immédiat</span>
        </Button>
        <Button href="/app/planifier" variant="dark" className="h-24 flex-col md:h-28">
          <span className="text-lg">Planifier</span>
          <span className="text-xs font-medium opacity-80">Choisir un créneau</span>
        </Button>
      </div>

      <h2 className="mt-8 text-sm font-bold uppercase tracking-wide text-muted">Catégories</h2>
      <div className="mt-3 grid grid-cols-3 gap-2 pb-8 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {(data?.categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/app/recherche?categoryId=${c.id}`}
            className="rounded-2xl border border-line bg-card p-3 text-center transition hover:border-appo/40 hover:shadow-sm"
          >
            <div className="text-2xl">{c.emoji}</div>
            <div className="mt-1 text-[11px] font-semibold leading-tight md:text-xs">{c.name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
