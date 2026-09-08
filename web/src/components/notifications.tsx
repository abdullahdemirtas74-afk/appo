"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell } from "lucide-react";
import { useMe } from "@/components/guard";
import { api } from "@/lib/hooks";

export function NotificationBell() {
  const { data: me, reload } = useMe();
  const [open, setOpen] = useState(false);
  const notes = me?.notifications ?? [];
  const unread = me?.unread ?? 0;

  async function openPanel() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      await api("/api/me", { action: "markNotificationsRead" });
      await reload();
    }
  }

  return (
    <div className="relative">
      <button type="button" className="relative rounded-full border border-line bg-card p-2 md:p-3" onClick={openPanel}>
        <Bell size={18} />
        {unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-appo" /> : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="font-bold">Notifications</div>
            <button type="button" className="text-xs text-muted" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">Aucune notification</p>
            ) : (
              notes.map((n) => (
                <Link
                  key={n.id}
                  href={n.href || "/app"}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-line px-4 py-3 hover:bg-background ${n.read ? "" : "bg-appo/5"}`}
                >
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="text-xs text-muted">{n.body}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
