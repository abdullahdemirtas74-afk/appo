export function MiniMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const delta = 0.03;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <div className="overflow-hidden rounded-3xl border border-line">
      <iframe title={label ?? "Carte"} src={src} className="h-56 w-full border-0" />
      {label ? (
        <div className="bg-white px-4 py-2 text-sm text-muted">{label}</div>
      ) : null}
    </div>
  );
}
