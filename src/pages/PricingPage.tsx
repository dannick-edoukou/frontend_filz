import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  HandshakeIcon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import filzIcon from "../assets/filz_icon.png";
import { api } from "../utils/api";

type PublicPlan = {
  id: string;
  name: string;
  price_monthly: number;
  trial_days: number;
  allow_self_signup: boolean;
  max_branches: number;
  max_staff_users: number;
  max_queue_entries_per_month: number;
};

function fmtPrice(price: number): string {
  if (price <= 0) return "Gratuit";
  return `${Math.round(price).toLocaleString("fr-FR")} FCFA`;
}

function buildFeatures(plan: PublicPlan): string[] {
  return [
    plan.max_branches <= 1 ? "1 établissement inclus" : `Jusqu’à ${plan.max_branches} établissements`,
    `${plan.max_staff_users} membre${plan.max_staff_users > 1 ? "s" : ""} de l’équipe`,
    `${plan.max_queue_entries_per_month.toLocaleString("fr-FR")} entrées / mois autorisées`,
    "Files et formulaires illimités",
    "Tableaux de bord et historique",
    plan.price_monthly <= 0 ? "Support inclus" : "Support prioritaire WhatsApp & e-mail",
  ];
}

export function PricingPage({
  onSignup,
  onLogin,
  onHome,
  onPartner,
}: { onSignup: () => void; onLogin: () => void; onHome: () => void; onPartner: () => void }) {
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/public/plans");
        if (!cancelled) setPlans((res as PublicPlan[]) ?? []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Impossible de charger les tarifs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredId = plans.length > 1
    ? [...plans].sort((a, b) => b.price_monthly - a.price_monthly)[0].id
    : null;

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={onHome} className="focus-ring flex items-center gap-2.5 rounded-xl">
            <img src={filzIcon} alt="Filz" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight text-pine-950">Filz</span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex">
            <button onClick={onHome} className="focus-ring text-sm font-semibold text-ink-soft transition-colors hover:text-pine-950">La solution</button>
            <button onClick={() => document.getElementById("tarifs")?.scrollIntoView({ behavior: "smooth" })} className="focus-ring text-sm font-semibold text-pine-950">Tarifs</button>
            <button onClick={onPartner} className="focus-ring text-sm font-semibold text-ink-soft transition-colors hover:text-pine-950">Devenir partenaire</button>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="focus-ring hidden rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-sand sm:block">Se connecter</button>
            <button
              onClick={onSignup}
              className="focus-ring inline-flex touch-target items-center gap-2 rounded-xl bg-pine-900 px-4 text-sm font-semibold text-paper shadow-[0_8px_18px_rgba(18,51,45,0.20)] hover:bg-pine-950"
            >
              Créer un compte
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
        </div>
      </header>

      <section id="tarifs" className="relative overflow-hidden bg-pine-950 text-paper">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-pine-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
            <HugeiconsIcon icon={CreditCardIcon} size={14} />
            Tarifs
          </p>
          <h1 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Des tarifs simples, adaptés à votre file.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-pine-100/80">
            Choisissez une formule et passez à l'échelle quand vous le souhaitez.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        {loading && (
          <p className="text-center text-sm text-ink-soft">Chargement des tarifs…</p>
        )}
        {!loading && error && (
          <p className="mx-auto max-w-md rounded-2xl border border-clay-200 bg-clay-100 px-5 py-4 text-center text-sm font-medium text-clay-700">{error}</p>
        )}
        {!loading && !error && plans.length === 0 && (
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-gold-700">
              <HugeiconsIcon icon={Ticket01Icon} size={22} />
            </span>
            <p className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">Aucune formule publiée pour le moment</p>
            <p className="mt-3 text-sm leading-6 text-ink-soft">Nos équipes finalisent les offres. Revenez très bientôt !</p>
          </div>
        )}
        {!loading && !error && plans.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const featured = plan.id === featuredId;
                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden rounded-[28px] border bg-white shadow-ticket ${
                      featured ? "border-gold-300 ring-2 ring-gold-400/40" : "border-line"
                    }`}
                  >
                    {featured && (
                      <span className="absolute right-4 top-4 rounded-full bg-gold-500 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-950">Recommandé</span>
                    )}
                    <div className="p-7 pb-0">
                      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{plan.name}</h2>
                      <p className="mt-4 flex items-baseline gap-1.5">
                        <span className="font-mono text-4xl font-semibold tracking-[-0.04em] text-pine-950">{fmtPrice(plan.price_monthly)}</span>
                        <span className="text-sm text-ink-faint">/ mois</span>
                      </p>
                    </div>
                    <ul className="mt-6 space-y-3 px-7 text-sm leading-6 text-ink-soft">
                      {buildFeatures(plan).map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-0.5 shrink-0 text-gold-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto p-7">
                      <button
                        onClick={onSignup}
                        className={`focus-ring inline-flex touch-target w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-[0_8px_18px_rgba(18,51,45,0.20)] ${
                          featured ? "bg-gold-500 text-pine-950 hover:bg-gold-400" : "bg-pine-900 text-paper hover:bg-pine-950"
                        }`}
                      >
                        Commencer
                        <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mx-auto mt-8 max-w-lg text-center text-[11px] leading-5 text-ink-faint">
              Tarifs gérés par la plateforme et mis à jour en temps réel. Sans engagement de durée : résiliable à tout moment
              par l'équipe Filz.
            </p>
          </>
        )}
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Pour les prescripteurs</p>
            <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Recommandez Filz et touchez 30 % pendant 5 mois
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-ink-soft">
              Chaque entreprise qui s'abonne via votre lien vous rapporte 30 % de son abonnement, chaque mois, pendant
              5 mois. Sans plafond, sans frais.
            </p>
          </div>
          <button
            onClick={onPartner}
            className="focus-ring inline-flex touch-target items-center justify-center gap-2 rounded-xl border border-gold-300 bg-gold-100 px-6 py-3 text-sm font-bold text-gold-700 transition-colors hover:bg-gold-200"
          >
            <HugeiconsIcon icon={HandshakeIcon} size={18} />
            Devenir partenaire
          </button>
        </div>
      </section>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:text-left">
          <button onClick={onHome} className="focus-ring flex items-center gap-2.5 rounded-xl">
            <img src={filzIcon} alt="Filz" className="h-7 w-7 rounded-lg" />
            <span className="font-display text-base font-semibold tracking-tight text-pine-950">Filz</span>
          </button>
          <nav className="flex items-center gap-6 text-sm font-semibold text-ink-soft">
            <button onClick={onHome} className="focus-ring hover:text-pine-950">Accueil</button>
            <button onClick={onPartner} className="focus-ring hover:text-pine-950">Programme partenaire</button>
            <button onClick={onSignup} className="focus-ring hover:text-pine-950">Créer un compte</button>
          </nav>
          <p className="text-xs text-ink-faint">© 2026 Filz · Gestion de file d’attente</p>
        </div>
      </footer>
    </main>
  );
}
