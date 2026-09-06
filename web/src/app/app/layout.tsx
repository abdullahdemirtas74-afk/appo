import { Guard } from "@/components/guard";
import { ClientNav } from "@/components/nav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Guard role="client">
      <div className="phone-app flex min-h-dvh flex-col">
        <div className="flex-1 pb-2">{children}</div>
        <ClientNav />
      </div>
    </Guard>
  );
}
