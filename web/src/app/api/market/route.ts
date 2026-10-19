import { NextResponse } from "next/server";
import { listMarketPresets, marketPublicSnapshot } from "@/lib/market";

export async function GET() {
  return NextResponse.json({
    market: marketPublicSnapshot(),
    presets: listMarketPresets(),
    configure: {
      env: "APPO_MARKET",
      values: ["fr-haute-savoie", "fr", "ch", "intl", "world"],
      optional: [
        "APPO_CURRENCY",
        "APPO_DEFAULT_LOCALE",
        "APPO_COUNTRY",
        "APPO_MAX_SERVICE_KM",
        "APPO_GEO_BIAS_LAT",
        "APPO_GEO_BIAS_LNG",
        "APPO_REGION_LABEL",
        "NEXT_PUBLIC_APPO_MARKET",
      ],
    },
  });
}
