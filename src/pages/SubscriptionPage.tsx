import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, CreditCardIcon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader } from "../components/ui/Ui";
import { api } from "../utils/api";

type PlanInfo = {
  id: string;
  name: string;
  price_monthly: number;
  max_branches: number;
  max_staff_users: number;
  max_queue_entries_per_month: number;
  is_active: boolean;
};

type SubscriptionInfo = {
  id: string;
  organization_id: string;
  plan: PlanInfo;
  status: "trialing" | "active" | "past_due" | "expired" | "cancelled";
  queue_entries_this_period: number;
};

type SubscriptionResponse = {
  subscription: SubscriptionInfo | null;
  plan: PlanInfo | null;
  current_period_end: string | null;
};

function formatPrice(price: number): string {
  if (price <= 0) return "Gratuit";
  return `${Math.round(price).toLocaleString("fr-FR")} FCFA`;
}

function statusLabel(status: string | undefined | null): string {
  const map: Record<string, string> = {
    active: "Actif",
    trialing: "Actif",
    past_due: "En retard de paiement",
    expired: "Expiré",
    cancelled: "Résilié",
  };
  return map[status ?? ""] ?? "—";
}

function buildFeatures(plan: PlanInfo | null): string[] {
  if (!plan) {
    return [
      "Données de l’abonnement en cours de chargement…",
    ];
  }
  return [
    plan.max_branches <= 1 ? `1 établissement inclus` : `Jusqu’à ${plan.max_branches} établissements`,
    `${plan.max_staff_users} membre${plan.max_staff_users > 1 ? "s" : ""} de l’équipe`,
    `${plan.max_queue_entries_per_month.toLocaleString("fr-FR")} entrées / mois autorisées`,
    "Files et formulaires illimités",
    "Tableaux de bord et historique",
    plan.price_monthly <= 0 ? "Support inclus" : "Support prioritaire WhatsApp & e-mail",
  ];
}

function formatDateISO(iso: string | null | undefined): string {
  if (!iso) return "Non défini";
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "Non défini";
  }
}

export function SubscriptionPage() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/subscription");
      setData(res as SubscriptionResponse);
    } catch (err: any) {
      setError(err?.message || "Impossible de charger l’abonnement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const plan = data?.plan ?? null;
  const subscription = data?.subscription ?? null;

  async function requestBillingHelp() {
    setActing(true);
    setMessage(null);
    try {
      await api.post("/admin/support-tickets", {
        category: "billing",
        subject: "Demande d’activation ou de modification d’abonnement",
        message: `Bonjour, nous souhaitons une assistance sur notre abonnement actuel (${plan?.name || "aucun plan"}).`,
      });
      setMessage("Demande envoyée au superadmin. Vous serez recontacté pour l’activation ou la modification.");
    } catch (err: any) {
      setMessage("Erreur lors de l’envoi : " + (err.message || "inconnue"));
    } finally {
      setActing(false);
    }
  }

  return <>
    <PageHeader
      eyebrow="Facturation"
      title="Abonnement"
      description="Votre abonnement est géré au niveau de votre organisation, jamais par vos visiteurs."
    />
    {error && (
      <div className="mb-4 rounded-xl border border-pine-200 bg-pine-50 p-3 text-xs font-bold text-pine-700">
        {error}
      </div>
    )}
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line bg-pine-950 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-gold-300">Plan actuel</p>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-3xl font-bold tracking-[-.05em]">
              {loading ? "Chargement…" : plan ? plan.name : "Aucun abonnement"}
            </h2>
            <p className="text-sm text-pine-100">
              <strong className="text-xl text-white">{loading ? "…" : formatPrice(plan?.price_monthly ?? 0)}</strong>
              {" "} / mois
            </p>
          </div>
          <p className="mt-3 text-sm text-pine-100">
            {loading
              ? "Récupération du statut…"
              : subscription
                ? `${statusLabel(subscription.status)}${data?.current_period_end ? ` · Prochaine échéance : ${formatDateISO(data.current_period_end)}` : ""}`
                : plan
                  ? "Souscrivez pour activer le plan."
                  : "Créez ou sélectionnez un plan."}
            {subscription?.queue_entries_this_period != null && (
              <>
                {" · "}
                {subscription.queue_entries_this_period} / {plan?.max_queue_entries_per_month ?? 0} entrées ce mois
              </>
            )}
          </p>
        </div>
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold">
              {message}
            </div>
          )}
          <ul className="space-y-4">
            {buildFeatures(plan).map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-ink-soft">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="text-teal-700" />
                {feature}
              </li>
            ))}
          </ul>
          <Button
            disabled={acting || loading}
            onClick={requestBillingHelp}
            className="mt-7"
          >
            {acting ? "Envoi…" : "Contacter le superadmin"}
          </Button>
        </div>
      </section>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-pine-50 text-pine-600">
              <HugeiconsIcon icon={CreditCardIcon} size={19} />
            </span>
            <div>
              <p className="text-xs text-ink-faint">Moyen de paiement</p>
              <p className="mt-1 text-sm font-bold">
                {loading ? "Chargement…" : plan?.price_monthly === 0 ? "Essai gratuit · Aucun moyen enregistré" : "À configurer (Orange Money, Wave, Carte)"}
              </p>
            </div>
          </div>
          <Button onClick={requestBillingHelp} variant="secondary" className="mt-5 w-full">Demander une activation</Button>
        </section>
        <section className="rounded-2xl border border-pine-200 bg-pine-50 p-5">
          <div className="flex gap-3">
            <HugeiconsIcon icon={InformationCircleIcon} size={19} className="shrink-0 text-pine-700" />
            <div>
              <h3 className="text-sm font-bold text-pine-800">Gestion du renouvellement</h3>
              <p className="mt-2 text-xs leading-5 text-ink-soft">
                En cas d’échec de paiement, vos données restent protégées. Nous vous prévenons avant toute interruption de service.
                {data?.current_period_end && (
                  <> <br />Échéance actuelle : <strong>{formatDateISO(data.current_period_end)}</strong>.</>
                )}
              </p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </>;
}
