"use client";

import Link from "next/link";
import { usePoll } from "@/lib/hooks";

export default function MessagesPage() {
  const { data } = usePoll<{ missions: any[] }>("/api/missions", 4000);
  const withMsg = (data?.missions ?? []).filter((m) => (m.messages ?? []).length);
  return (
    <div className="px-5 py-6">
      <h1 className="text-2xl font-extrabold">Messages</h1>
      <div className="mt-4 space-y-3">
        {withMsg.map((m) => {
          const last = m.messages[m.messages.length - 1];
          return (
            <Link key={m.id} href={`/app/missions/${m.id}#chat`} className="block rounded-3xl border border-line p-4">
              <div className="font-bold">{m.pro?.user?.firstName ?? m.category?.name}</div>
              <p className="truncate text-sm text-muted">{last?.text}</p>
            </Link>
          );
        })}
        {!withMsg.length ? <p className="text-sm text-muted">Aucune conversation. Elles apparaissent dès qu’une mission est acceptée.</p> : null}
      </div>
    </div>
  );
}
