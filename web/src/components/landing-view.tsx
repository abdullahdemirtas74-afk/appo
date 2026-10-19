"use client";

import { Logo } from "@/components/logo";
import { SiteLegalFooter } from "@/components/site-legal-links";
import { Button } from "@/components/ui";
import { publicDemoAccounts } from "@/lib/demo";
import { useLocale } from "@/lib/i18n";
import { useMarket } from "@/lib/use-market";
import { ArrowRight, BadgeCheck, Clock, MapPin, Shield } from "lucide-react";

const cats = [
  ["🔧", "Plomberie"],
  ["💡", "Électricité"],
  ["🔑", "Serrurerie"],
  ["🌡️", "Chauffage"],
  ["🎨", "Peinture"],
  ["🌿", "Jardinage"],
];

export function LandingView() {
  const { t, countryCode, autoMode, locale } = useLocale();
  const { market, areaBlurb, international } = useMarket();
  const areaPin = international
    ? market?.regionLabel || areaBlurb
    : market?.cities?.[0]?.name || market?.regionLabel || areaBlurb;
  const demos = publicDemoAccounts();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#0d0f14] text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <Logo light />
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a href="/legal" className="hidden text-sm font-semibold text-white/60 hover:text-white sm:inline">
            {t("legal")}
          </a>
          <Button href="/login" variant="secondary" className="px-3 py-2.5 text-sm sm:px-5 sm:py-3.5 sm:text-[15px]">
            {t("login")}
          </Button>
          <Button
            href="/register"
            variant="now"
            className="hidden px-3 py-2.5 text-sm sm:inline-flex sm:px-5 sm:py-3.5 sm:text-[15px]"
          >
            {t("createAccount")}
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14 lg:grid-cols-2 lg:py-16">
        <div className="min-w-0">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-appo sm:text-sm">
            {t("tagline")}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            {t("heroTitle1")}
            <br />
            <span className="text-appo">{t("heroTitle2")}</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-white/70 sm:mt-6 sm:text-lg">{t("heroBody")}</p>
          {autoMode && countryCode ? (
            <p className="mt-3 text-xs text-white/45">
              {t("detectedCountry")} {countryCode} · {locale.toUpperCase()}
            </p>
          ) : null}
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Button href="/login" variant="now" className="w-full px-7 sm:w-auto">
              {t("needPro")} <ArrowRight size={18} />
            </Button>
            <Button href="/register?role=pro" variant="secondary" className="w-full sm:w-auto">
              {t("iAmPro")}
            </Button>
          </div>
          <div className="mt-8 flex flex-col gap-3 text-sm text-white/60 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-8">
            <span className="flex items-center gap-2">
              <BadgeCheck size={16} className="shrink-0 text-appo" /> {t("verifiedPros")}
            </span>
            <span className="flex items-center gap-2">
              <Shield size={16} className="shrink-0 text-appo" /> {t("securePay")}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={16} className="shrink-0 text-appo" /> {t("appoNow")}
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-[28px] border border-white/10 bg-white p-4 text-ink shadow-2xl sm:rounded-[36px] sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <Logo size="sm" />
              <span className="flex items-center gap-1 text-sm text-muted">
                <MapPin size={14} /> {areaPin}
              </span>
            </div>
            <div className="rounded-2xl bg-background px-4 py-3 text-sm text-muted">
              {t("step1t")}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {cats.map(([e, n]) => (
                <div key={n} className="rounded-2xl bg-background p-3 text-center text-xs font-semibold">
                  <div className="text-xl">{e}</div>
                  {n}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-appo p-4 text-white">
              <div className="text-xs uppercase tracking-wider opacity-80">{t("missions")}</div>
              <div className="mt-1 font-bold">Kevin · 12 min</div>
              <div className="text-sm opacity-90">Plomberie</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white text-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 sm:py-16 lg:grid-cols-4">
          {[
            ["1", t("step1t"), t("step1d")],
            ["2", t("step2t"), t("step2d")],
            ["3", t("step3t"), t("step3d")],
            ["4", t("step4t"), t("step4d")],
          ].map(([n, title, d]) => (
            <div key={n}>
              <div className="text-sm font-bold text-appo">0{n}</div>
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10 sm:px-6 sm:py-12">
        {demos.length > 0 ? (
          <div className="mx-auto max-w-6xl rounded-3xl bg-white/5 p-4 sm:p-6">
            <h2 className="font-bold">Demo</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {demos.map((a) => (
                <div key={a.email} className="rounded-2xl bg-black/30 p-4 text-sm">
                  <div className="text-xs font-bold text-appo">{a.role}</div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="break-all text-white/60">{a.email}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mx-auto mt-8 max-w-6xl space-y-3 pb-8 text-center">
          <a
            href="/legal"
            className="text-sm font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline"
          >
            {t("legal")}
          </a>
          <SiteLegalFooter tone="light" />
        </div>
      </section>
    </div>
  );
}
