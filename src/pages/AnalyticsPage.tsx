import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Calendar03Icon, Clock01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { MetricCard, PageHeader } from "../components/ui/Ui";
import { api } from "../utils/api";

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
  by_service_perf: { service_id: string; service_name: string; total_entries: number; served_entries: number; performance_pct: number }[];
};

const PERIOD_DAYS: Record<string, number> = {
  "7 derniers jours": 7,
  "30 derniers jours": 30,
  "Ce trimestre": 90,
};

function shortDayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."][d.getDay()];
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<string>("7 derniers jours");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const days = PERIOD_DAYS[period] ?? 7;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get(`/admin/analytics/detailed?days=${days}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Erreur lors du chargement des statistiques.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period, days]);

  const chartData: number[] = data?.days ?? [0, 0, 0, 0, 0, 0, 0];
  const maxChart = Math.max(1, ...chartData);
  const points = chartData
    .map((value, index) => `${index === 0 ? 0 : (index / Math.max(1, chartData.length - 1)) * 100},${100 - (value / maxChart) * 100}`)
    .join(" ");

  const serviceColors = ["bg-[#e87325]", "bg-[#4f8bb7]", "bg-[#3e8b60]", "bg-[#7a5ad6]", "bg-[#c24545]"];
  const byService = data?.by_service_perf ?? [];

  return <>
    <PageHeader
      eyebrow="Performance"
      title="Statistiques"
      description="Comprenez les volumes, les temps d’attente et la disponibilité de vos équipes."
      action={<select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="focus-ring h-10 rounded-xl border border-[#deded8] bg-white px-3 text-sm font-semibold"
      >
        <option>7 derniers jours</option>
        <option>30 derniers jours</option>
        <option>Ce trimestre</option>
      </select>}
    />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Visiteurs servis"
        value={loading ? "…" : String(data?.served_entries ?? 0)}
        helper={loading ? "Chargement…" : `Total entrées : ${data?.total_entries ?? 0}`}
        tone="green"
        icon={<HugeiconsIcon icon={UserMultipleIcon} size={19} />}
      />
      <MetricCard
        label="Attente moyenne"
        value={loading ? "…" : `${data?.average_wait_minutes ?? 0} min`}
        helper={loading ? "Chargement…" : `Service moyen : ${data?.average_service_minutes ?? 0} min`}
        tone="blue"
        icon={<HugeiconsIcon icon={Clock01Icon} size={19} />}
      />
      <MetricCard
        label="Taux de service"
        value={loading ? "…" : `${data?.service_rate ?? 0}%`}
        helper={data?.peak_hour ? `Heure de pointe : ${String(data.peak_hour).padStart(2, "0")}h` : "Objectif : 92%"}
        tone="orange"
        icon={<HugeiconsIcon icon={ArrowUpRight01Icon} size={19} />}
      />
      <MetricCard
        label="Jours couverts"
        value={loading ? "…" : String(days).padStart(2, "0")}
        helper={period}
        tone="charcoal"
        icon={<HugeiconsIcon icon={Calendar03Icon} size={19} />}
      />
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <article className="rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
        <div>
          <h2 className="font-bold">Visiteurs servis</h2>
          <p className="mt-1 text-xs text-[#788292]">Évolution quotidienne · {period.toLowerCase()}</p>
        </div>
        <div className="mt-7 h-56">
          {error ? (
            <p className="text-xs text-[#b94d10]">{error}</p>
          ) : loading ? (
            <div className="grid h-full place-items-center text-xs text-[#788292]">Chargement des statistiques…</div>
          ) : (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <line x1="0" y1="25" x2="100" y2="25" stroke="#ecece7" strokeWidth=".5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#ecece7" strokeWidth=".5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#ecece7" strokeWidth=".5" />
              <polyline fill="none" points={points} stroke="#e87325" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-medium text-[#8e96a3]">
          {(data?.labels ?? []).length > 0
            ? data!.labels.map((d, i) => {
                const step = Math.ceil(data!.labels.length / 7);
                if (i % step !== 0 && i !== data!.labels.length - 1) return <span key={d} />;
                return <span key={d}>{shortDayLabel(d)}</span>;
              })
            : ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."].map((d) => <span key={d}>{d}</span>)}
        </div>
      </article>
      <article className="rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
        <h2 className="font-bold">Performance par service</h2>
        <div className="mt-5 space-y-5">
          {loading ? (
            <p className="text-xs text-[#788292]">Chargement…</p>
          ) : byService.length === 0 ? (
            <p className="text-xs text-[#788292]">Aucune donnée disponible sur la période.</p>
          ) : (
            byService.map((item, i) => (
              <div key={item.service_id}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{item.service_name}</span>
                  <span className="text-[#788292]">{item.performance_pct}% servis</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#efefea]">
                  <span className={`block h-full rounded-full ${serviceColors[i % serviceColors.length]}`} style={{ width: `${Math.min(100, item.performance_pct)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
        <p className="mt-8 border-t border-[#efefea] pt-4 text-xs leading-5 text-[#788292]">
          {data
            ? data.absent_entries > 0
              ? `${data.absent_entries} visiteur(s) absent(s) sur la période — pensez à relancer les notifications.`
              : "Aucun absent sur la période. Bonne tenue de file !"
            : "La performance est calculée à partir des tickets servis vs. créés."}
        </p>
      </article>
    </section>
  </>;
}