import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Cancel01Icon,
  Download01Icon,
  SparklesIcon,
  UserGroupIcon,
  UserMultipleIcon,
  QrCodeIcon,
  Activity03Icon,
} from "@hugeicons/core-free-icons";
import { Button, MetricCard, SmallLink } from "../components/ui/Ui";
import { Screen } from "../types";
import { api, getOrgSlug } from "../utils/api";

type OverviewData = {
  total_entries: number;
  served_entries: number;
  absent_entries: number;
  average_wait_minutes: number;
  average_service_minutes: number;
  by_service: { service_id: string; service_name: string; total_entries: number }[];
};

type AnalyticsData = {
  days: number[];
  labels: string[];
  total_entries: number;
  served_entries: number;
  absent_entries: number;
  average_wait_minutes: number;
  average_service_minutes: number;
  peak_hour: number | null;
  service_rate: number;
  by_service_perf: {
    service_id: string;
    service_name: string;
    total_entries: number;
    served_entries: number;
    performance_pct: number;
  }[];
};

const PERIOD_OPTIONS: { label: string; days: number }[] = [
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
  { label: "Trimestre", days: 90 },
];

const SERVICE_COLORS = ["bg-gold-500", "bg-pine-600", "bg-clay-500", "bg-gold-700", "bg-pine-800"];

function shortDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."][d.getDay()];
}

function formatFRDate(d: Date): string {
  return `${d.getDate()} ${
    ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][d.getMonth()]
  }`;
}

export function OverviewPage({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [periodIdx, setPeriodIdx] = useState<number>(0);
  const days = PERIOD_OPTIONS[periodIdx].days;

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState({ branches: 0, services: 0, forms: 0, staff: 0 });

  const [showQr, setShowQr] = useState(false);
  const orgSlug = getOrgSlug();
  const checkinUrl = useMemo(
    () => `${window.location.origin}/?screen=checkin&slug=${orgSlug}`,
    [orgSlug],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get("/auth/me").catch(() => null),
      api.get(`/admin/dashboard?days=${days}`),
      api.get(`/admin/analytics/detailed?days=${days}`),
    ])
      .then(([me, overviewData, analyticsData]) => {
        if (cancelled) return;
        void me;
        setOverview(overviewData as OverviewData);
        setAnalytics(analyticsData as AnalyticsData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "Impossible de charger le tableau de bord.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  useEffect(() => {
    let cancelled = false;
    async function loadSetup() {
      try {
        const [branches, forms, users] = await Promise.all([
          api.get("/organization/branches"),
          api.get("/admin/form-templates"),
          api.get("/organization/users?page_size=100"),
        ]);
        const serviceLists = await Promise.all(
          (branches || []).map((branch: { id: string }) =>
            api.get(`/admin/branches/${branch.id}/services`).catch(() => []),
          ),
        );
        if (cancelled) return;
        setSetup({
          branches: branches?.length || 0,
          services: serviceLists.flat().length,
          forms: forms?.length || 0,
          staff: ((users as any)?.items || []).filter((user: { role: string }) => user.role === "staff").length,
        });
      } catch {
        if (!cancelled) setSetup({ branches: 0, services: 0, forms: 0, staff: 0 });
      }
    }
    loadSetup();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalEntries = overview?.total_entries ?? analytics?.total_entries ?? 0;
  const servedEntries = overview?.served_entries ?? analytics?.served_entries ?? 0;
  const absentEntries = overview?.absent_entries ?? analytics?.absent_entries ?? 0;
  const avgWait = analytics?.average_wait_minutes ?? overview?.average_wait_minutes ?? 0;
  const avgService = analytics?.average_service_minutes ?? 0;
  const serviceRate = analytics?.service_rate ?? (totalEntries ? (servedEntries / totalEntries) * 100 : 0);
  const absenceRate = totalEntries > 0 ? ((absentEntries / totalEntries) * 100) : 0;
  const peakHour = analytics?.peak_hour;

  const chartData = analytics?.days ?? Array(days).fill(0);
  const maxChart = Math.max(1, ...chartData);
  const chartBars = chartData.map((v) => Math.round((v / maxChart) * 100));
  const chartPoints = chartBars
    .map((pct, i) => {
      const x = chartBars.length === 1 ? 50 : (i / (chartBars.length - 1)) * 100;
      return `${x},${100 - pct}`;
    })
    .join(" ");

  const labels = analytics?.labels ?? [];
  const xLabels = labels.length
    ? labels.map((l) => shortDayLabel(l))
    : Array.from({ length: days }, () => "—");

  const byService = analytics?.by_service_perf ?? [];
  const byServiceOverview = overview?.by_service ?? [];
  const setupItems = [
    { label: "Créer un établissement", done: setup.branches > 0, screen: "establishments" as Screen },
    { label: "Créer au moins un service", done: setup.services > 0, screen: "services" as Screen },
    { label: "Préparer un formulaire", done: setup.forms > 0, screen: "forms" as Screen },
    { label: "Inviter le staff", done: setup.staff > 0, screen: "team" as Screen },
    { label: "Imprimer un QR code", done: setup.services > 0, screen: "services" as Screen },
  ];
  const completedSetup = setupItems.filter((item) => item.done).length;

  const totalEntriesSevices = byServiceOverview.reduce(
    (acc, s) => acc + (s.total_entries ?? 0),
    0,
  );
  const bestService = [...byService].sort(
    (a, b) => b.performance_pct - a.performance_pct,
  )[0];
  const worstService = [...byService].sort(
    (a, b) => a.performance_pct - b.performance_pct,
  )[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[#e5e5df] bg-white p-1">
            {PERIOD_OPTIONS.map((opt, idx) => (
              <button
                key={opt.label}
                onClick={() => setPeriodIdx(idx)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  idx === periodIdx
                    ? "bg-pine-900 text-paper shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Button
            onClick={() => setShowQr(true)}
            variant="secondary"
          >
            <HugeiconsIcon icon={QrCodeIcon} size={16} />
            Code QR public
          </Button>
        </div>
        <Button
          onClick={() => onNavigate("staff")}
          variant="secondary"
        >
          Console staff
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-gold-300/60 bg-gold-100 p-3 text-xs font-bold text-gold-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700">Mise en route</p>
            <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink">Votre espace est prêt à {Math.round((completedSetup / setupItems.length) * 100)}%</h2>
            <p className="mt-1 text-sm leading-6 text-ink-soft">Terminez ces actions pour recevoir vos premiers visiteurs sans friction.</p>
          </div>
          <div className="h-2 w-full rounded-full bg-sand sm:w-48">
            <span className="block h-2 rounded-full bg-gold-500" style={{ width: `${(completedSetup / setupItems.length) * 100}%` }} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {setupItems.map((item) => (
            <button key={item.label} onClick={() => onNavigate(item.screen)} className="focus-ring rounded-xl border border-line bg-paper p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-100/50">
              <span className={`grid h-8 w-8 place-items-center rounded-xl ${item.done ? "bg-pine-100 text-pine-800" : "bg-gold-100 text-gold-700"}`}>
                <HugeiconsIcon icon={item.done ? CheckmarkCircle02Icon : Clock01Icon} size={17} />
              </span>
              <p className="mt-3 text-sm font-bold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-ink-faint">{item.done ? "Terminé" : "À faire"}</p>
            </button>
          ))}
        </div>
      </section>

      {/* METRICS CARDS */}
      <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visiteurs servis"
          value={loading ? "…" : servedEntries.toLocaleString("fr-FR")}
          helper={`Total entrées · ${totalEntries.toLocaleString("fr-FR")}`}
          tone="green"
          icon={<HugeiconsIcon icon={UserMultipleIcon} size={19} />}
        />
        <MetricCard
          label="Attente moyenne"
          value={loading ? "…" : `${Math.round(avgWait)} min`}
          helper={`Durée service · ${Math.round(avgService)} min`}
          tone="blue"
          icon={<HugeiconsIcon icon={Clock01Icon} size={19} />}
        />
        <MetricCard
          label="Performance service"
          value={loading ? "…" : `${Math.round(serviceRate)}%`}
          helper={peakHour ? `Heure de pointe : ${String(peakHour).padStart(2, "0")}h` : "Objectif · ≥ 92%"}
          tone="orange"
          icon={<HugeiconsIcon icon={ArrowUpRight01Icon} size={19} />}
        />
        <MetricCard
          label="Absences"
          value={loading ? "…" : `${absenceRate.toFixed(1)}%`}
          helper={`${absentEntries} visiteur(s) absent(s)`}
          tone="charcoal"
          icon={<HugeiconsIcon icon={Activity03Icon} size={19} />}
        />
      </section>

      {/* CHART + PERFORMANCE */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
        {/* CHART */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Évolution quotidienne</h2>
              <p className="mt-1 text-xs text-ink-faint">
                {loading
                  ? "Chargement des données…"
                  : `${servedEntries} visiteur(s) servi(s) · ${PERIOD_OPTIONS[periodIdx].label.toLowerCase()}`}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-paper px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-soft">
              <HugeiconsIcon icon={Calendar03Icon} size={14} />
              {formatFRDate(new Date(Date.now() - (days - 1) * 86400000))}{" "}
              <span className="text-ink-faint">→</span>{" "}
              {formatFRDate(new Date())}
            </div>
          </div>

          <div className="mt-7 h-64">
            {error && !loading ? (
              <div className="grid h-full place-items-center text-xs text-[#b94d10]">
                Données indisponibles pour le moment.
              </div>
            ) : loading ? (
              <div className="grid h-full place-items-center">
                <div className="space-y-3 w-full max-w-sm">
                  <SkeletonLine className="h-3 w-2/3" />
                  <SkeletonLine className="h-10 w-full" />
                  <SkeletonLine className="h-3 w-5/6" />
                </div>
              </div>
            ) : (
              <div className="relative h-full">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1B463E" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#1B463E" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#E2DCCC" strokeWidth="0.5" strokeDasharray="2 3" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#E2DCCC" strokeWidth="0.5" strokeDasharray="2 3" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#E2DCCC" strokeWidth="0.5" strokeDasharray="2 3" />
                  <polygon fill="url(#areaGrad)" points={`0,100 ${chartPoints} 100,100`} />
                  <polyline
                    fill="none"
                    points={chartPoints}
                    stroke="#1B463E"
                    strokeWidth="2.4"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="absolute inset-x-0 -bottom-1 flex justify-between font-mono text-[10px] font-medium text-ink-faint">
                  {xLabels.map((lbl, i) => {
                    const nb = xLabels.length;
                    const showEvery = Math.max(1, Math.ceil(nb / 8));
                    if (i % showEvery !== 0 && i !== nb - 1) return <span key={i} />;
                    return (
                      <span key={i} className="px-1">
                        {lbl}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* PERF PAR SERVICE */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Performance par service</h2>
              <p className="mt-1 text-xs text-ink-faint">Taux de visiteurs servis vs. créés</p>
            </div>
            <button onClick={() => onNavigate("services")}>
              <SmallLink>Gérer</SmallLink>
            </button>
          </div>

          <div className="mt-5 space-y-5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <SkeletonLine className="h-3 w-1/3" />
                    <SkeletonLine className="h-3 w-12" />
                  </div>
                  <SkeletonLine className="h-2 w-full" />
                </div>
              ))
            ) : byService.length === 0 ? (
              <div className="rounded-xl bg-paper p-4 text-center text-xs text-ink-faint">
                Aucune donnée sur la période.
                <div className="mt-3">
                  <Button onClick={() => onNavigate("services")} size="sm" variant="secondary">
                    Créer un service
                  </Button>
                </div>
              </div>
            ) : (
              byService.map((item, i) => {
                const totalOverview =
                  byServiceOverview.find((s) => s.service_id === item.service_id)?.total_entries ??
                  item.total_entries;
                return (
                  <div key={item.service_id}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-ink">{item.service_name}</span>
                      <span className="font-mono text-[11px] font-semibold text-ink-faint">
                        {item.served_entries} / {totalOverview || item.total_entries} ·{" "}
                        <span className="text-pine-800">{item.performance_pct}%</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand">
                      <span
                        className={`block h-full rounded-full ${SERVICE_COLORS[i % SERVICE_COLORS.length]}`}
                        style={{ width: `${Math.min(100, item.performance_pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <InsightBadge
              title="Service le plus performant"
              value={bestService ? bestService.service_name : "—"}
              sub={bestService ? `${bestService.performance_pct}% servis` : "Données insuffisantes"}
              tone="green"
            />
            <InsightBadge
              title="Suivi prioritaire"
              value={
                worstService && worstService.performance_pct < 85
                  ? worstService.service_name
                  : "RAS"
              }
              sub={
                worstService && worstService.performance_pct < 85
                  ? `${worstService.performance_pct}% servis`
                  : "Tous les services ≥ 85%"
              }
              tone={worstService && worstService.performance_pct < 85 ? "orange" : "green"}
            />
          </div>
        </article>
      </section>

      {/* VOLUME PAR SERVICE + POINTS D'ATTENTION */}
      <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        {/* BY SERVICE VOLUMES */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Volume par service</h2>
              <p className="mt-1 text-xs text-ink-faint">
                {totalEntriesSevices > 0
                  ? `${totalEntriesSevices} entrées réparties sur ${byServiceOverview.length} service(s)`
                  : "Distribution des passages"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-paper px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-soft">
              <HugeiconsIcon icon={UserGroupIcon} size={14} />
              {PERIOD_OPTIONS[periodIdx].label}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-paper px-3 py-3">
                  <div className="flex justify-between">
                    <SkeletonLine className="h-3 w-1/3" />
                    <SkeletonLine className="h-3 w-16" />
                  </div>
                  <SkeletonLine className="mt-2 h-2 w-full" />
                </div>
              ))
            ) : byServiceOverview.length === 0 ? (
              <div className="rounded-xl bg-paper p-5 text-center text-xs text-ink-faint">
                Aucun service enregistré. Créez-en un pour démarrer la file d’attente.
                <div className="mt-3">
                  <Button onClick={() => onNavigate("services")} size="sm">
                    Créer un service
                  </Button>
                </div>
              </div>
            ) : (
              byServiceOverview.map((s, i) => {
                const pct =
                  totalEntriesSevices > 0 ? (s.total_entries / totalEntriesSevices) * 100 : 0;
                return (
                  <div
                    key={s.service_id}
                    className="rounded-xl bg-paper px-4 py-3.5 transition-colors hover:bg-gold-100/60"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-ink">{s.service_name}</span>
                      <span className="font-mono text-xs font-semibold text-ink-soft">
                        {s.total_entries.toLocaleString("fr-FR")} visite(s) · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white">
                      <span
                        className={`block h-full rounded-full ${SERVICE_COLORS[i % SERVICE_COLORS.length]}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        {/* CALL TO ACTION BLOCK */}
        <article className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gold-100" />
          <div className="relative grid gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700">
                <HugeiconsIcon icon={SparklesIcon} size={20} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold tracking-tight text-ink">Recommandations</h2>
                <p className="mt-1 text-xs text-ink-faint">
                  Basé sur les données des {PERIOD_OPTIONS[periodIdx].label.toLowerCase()}.
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm">
              <RecoItem
                icon={<HugeiconsIcon icon={UserGroupIcon} size={16} />}
                title={
                  absentEntries > 0
                    ? `Réduire les absences (${absentEntries})`
                    : "Aucune absence sur la période 🎉"
                }
                sub={
                  absentEntries > 0
                    ? "Activez les rappels 5min avant passage (navigateur + SMS)."
                    : "Bonne tenue des files — continuez ainsi."
                }
                tone={absentEntries > 0 ? "orange" : "green"}
                action={
                  absentEntries > 0
                    ? { label: "Configurer", onClick: () => onNavigate("notifications") }
                    : undefined
                }
              />
              <RecoItem
                icon={<HugeiconsIcon icon={Clock01Icon} size={16} />}
                title={
                  avgWait > 20
                    ? `Réduire l’attente moyenne (${Math.round(avgWait)} min)`
                    : `Attente sous contrôle (${Math.round(avgWait)} min)`
                }
                sub={
                  avgWait > 20
                    ? "Ajoutez un guichet sur les services en pic ou ouvrez un second horaire."
                    : "L’expérience visiteur est conforme aux standards Fila."
                }
                tone={avgWait > 20 ? "orange" : "green"}
                action={
                  avgWait > 20
                    ? { label: "Voir files", onClick: () => onNavigate("queues") }
                    : undefined
                }
              />
              <RecoItem
                icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />}
                title={
                  serviceRate < 90
                    ? `Amener le service à ${Math.max(90, Math.round(serviceRate) + 5)}%`
                    : "Taux de service conforme ✅"
                }
                sub={
                  serviceRate < 90
                    ? "Détectez les absents plus vite et libérez des tickets dans le flux."
                    : "Vos équipes honorent la majeure partie des rendez-vous."
                }
                tone={serviceRate < 90 ? "orange" : "green"}
              />
            </ul>

            <div className="mt-3 flex flex-wrap gap-3">
              <Button onClick={() => onNavigate("analytics")} variant="secondary" size="sm" className="hidden">
                Historique avancé
              </Button>
              <Button onClick={() => onNavigate("checkin")} size="sm">
                Simuler une arrivée visiteur
              </Button>
            </div>
          </div>
        </article>
      </section>

      {/* QR MODAL */}
      {showQr && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-pine-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-ticket">
            <div className="flex items-start justify-between border-b border-line p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.13em] text-gold-700">
                  QR public
                </p>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">Code QR général</h2>
              </div>
              <button
                onClick={() => setShowQr(false)}
                className="focus-ring grid h-8 w-8 place-items-center rounded-xl bg-paper text-sm font-bold text-ink-soft hover:bg-sand"
                aria-label="Fermer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="p-5">
              <div className="mx-auto flex w-[260px] items-center justify-center rounded-2xl border border-line bg-white p-3">
                <QRCode value={checkinUrl} size={240} fgColor="#12332D" />
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-ink-soft">
                Imprimez et affichez ce code à l’entrée. Les visiteurs scannent, choisissent leur service et suivent leur position en temps réel.
              </p>

              <div className="mt-4 grid gap-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                    checkinUrl,
                  )}`}
                  download={`QR-General-${orgSlug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Button className="w-full">
                    <HugeiconsIcon icon={Download01Icon} size={16} />
                    Télécharger le QR
                  </Button>
                </a>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    void navigator.clipboard?.writeText(checkinUrl);
                  }}
                >
                  Copier le lien public
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InsightBadge({
  title,
  value,
  sub,
  tone,
}: {
  title: string;
  value: string;
  sub: string;
  tone: "green" | "orange" | "blue" | "charcoal";
}) {
  const toneMap: Record<string, string> = {
    green: "border-pine-200 bg-pine-50 text-pine-900",
    orange: "border-gold-300 bg-gold-100 text-gold-700",
    blue: "border-pine-200 bg-pine-50 text-pine-900",
    charcoal: "border-line bg-sand text-ink-soft",
  };
  return (
    <div className={`rounded-2xl border p-3.5 ${toneMap[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-[.14em] opacity-80">{title}</p>
      <p className="mt-1.5 text-base font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-[11px] opacity-85">{sub}</p>
    </div>
  );
}

function RecoItem({
  icon,
  title,
  sub,
  tone,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: "green" | "orange";
  action?: { label: string; onClick: () => void };
}) {
  const toneMap: Record<string, string> = {
    green: "bg-pine-100 text-pine-800",
    orange: "bg-gold-100 text-gold-700",
  };
  return (
    <li className="flex gap-3 rounded-2xl bg-paper p-3.5">
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${toneMap[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-ink-soft">{sub}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="focus-ring mt-1.5 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-gold-700 hover:bg-gold-100"
          >
            {action.label}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
          </button>
        )}
      </div>
    </li>
  );
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`block rounded-full bg-gradient-to-r from-sand via-paper to-sand ${className}`} />;
}
