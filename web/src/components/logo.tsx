import Link from "next/link";

export function Logo({
  size = "md",
  light = false,
}: {
  size?: "sm" | "md" | "lg";
  light?: boolean;
}) {
  const box = size === "lg" ? "h-12 w-12 text-xl" : size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10";
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <Link href="/" className="inline-flex items-center gap-2">
      <span
        className={`${box} grid place-items-center rounded-2xl bg-appo font-black text-white shadow-[0_8px_20px_rgba(255,77,28,0.35)]`}
      >
        O
      </span>
      <span className={`${text} font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        AppO
      </span>
    </Link>
  );
}
