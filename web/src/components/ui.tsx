import { Star } from "lucide-react";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(value) ? "fill-amber-400" : "fill-zinc-200 text-zinc-200"}
        />
      ))}
    </span>
  );
}

export function Avatar({
  initials,
  size = "md",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
}) {
  const s = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12";
  return (
    <div
      className={`${s} grid shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white`}
    >
      {initials}
    </div>
  );
}

export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "now" | "dark";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles: Record<string, string> = {
    primary: "bg-appo text-white hover:bg-appo-dark",
    now: "bg-appo text-white hover:bg-appo-dark shadow-[0_12px_30px_rgba(255,77,28,0.35)]",
    dark: "bg-ink text-white",
    secondary: "bg-white text-ink border border-line hover:bg-background",
    ghost: "bg-transparent text-ink",
    danger: "bg-red-600 text-white",
  };
  const cls = `inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition disabled:opacity-50 ${styles[variant]} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full max-w-full rounded-2xl border border-line bg-white px-4 py-3 text-base outline-none ring-appo/30 placeholder:text-muted focus:ring-2";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "orange" | "red" | "premium";
}) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700",
    green: "bg-emerald-50 text-emerald-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
    premium: "bg-amber-100 text-amber-900",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
