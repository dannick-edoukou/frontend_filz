import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Building02Icon, CheckmarkCircle02Icon, LockPasswordIcon, Mail01Icon, Ticket01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { LoadingButton } from "../components/ui/LoadingSpinner";
import { api } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import filzIcon from "../assets/filz_icon.png";

const schema = z.object({ company: z.string().min(2, "Indiquez le nom de votre entreprise."), name: z.string().min(2, "Indiquez votre nom."), email: z.string().email("Indiquez une adresse e-mail valide."), password: z.string().min(8, "Utilisez au moins 8 caractères."), terms: z.boolean().refine(val => val === true, { message: "Vous devez accepter les conditions." }) });
type SignupData = z.infer<typeof schema>;

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

function planFeatures(plan: PublicPlan): string[] {
  return [
    plan.max_branches <= 1 ? "1 établissement" : `${plan.max_branches} établissements`,
    `${plan.max_staff_users} membres d'équipe`,
    `${plan.max_queue_entries_per_month.toLocaleString("fr-FR")} entrées / mois`,
  ];
}

export function SignupPage({ onComplete, onLogin, onHome }: {onComplete: () => void;onLogin: () => void;onHome?: () => void;}) {
  const [submitted, setSubmitted] = useState(false);
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>();
  const { showSuccess, showError } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = (await api.get("/public/plans")) as PublicPlan[];
        const signupPlans = (res ?? []).filter(p => p.allow_self_signup);
        if (!cancelled) {
          setPlans(signupPlans);
          setSelectedPlan(prev => prev ?? signupPlans.sort((a, b) => a.price_monthly - b.price_monthly)[0]?.id);
        }
      } catch {
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (submitted) return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white p-8 text-center shadow-ticket"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} /></span><h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">Inscription reçue</h1><p className="mt-3 text-sm leading-6 text-ink-soft">Merci pour votre inscription ! Votre demande est en attente d'approbation de notre équipe. Vous recevrez une confirmation par email dès que votre espace sera activé (généralement sous 24h).</p><Button onClick={onComplete} className="mt-7 w-full" icon={<HugeiconsIcon icon={ArrowRight01Icon} size={18} />}>Vérifier votre email</Button></section></main>;

  return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
    <div className="relative bg-pine-950 px-7 pb-10 pt-8 text-center">
      {onHome && (
        <button type="button" onClick={onHome} className="focus-ring absolute left-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-pine-100/70 hover:bg-white/10 hover:text-white">← Accueil</button>
      )}
      <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white">Créer votre espace</h1>
      <p className="mt-1.5 text-sm text-pine-100/70">Gérez vos files d'attente par QR code.</p>
    </div>
    <div className="relative">
      <div className="border-t-2 border-dashed border-line" />
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Inscription</span>
      <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
      <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
    </div>
    <form onSubmit={handleSubmit(async (data) => {
      try {
        const params = new URLSearchParams(window.location.search);
        const referralCode = params.get("ref") || localStorage.getItem("filz_ref_code") || undefined;
        await api.post("/auth/register", { ...data, referral_code: referralCode, plan_id: selectedPlan || undefined });
        localStorage.removeItem("filz_ref_code");
        localStorage.setItem("filz_pending_email", data.email);
        showSuccess("Compte créé avec succès", "Vérifiez votre e-mail pour continuer");
        setSubmitted(true);
      } catch (err: any) {
        showError(getErrorMessage(err, { action: "création de compte" }));
      }
    })} className="grid gap-4 px-7 pb-7 pt-7 sm:grid-cols-2">
      <SignupField label="Entreprise" error={errors.company?.message} icon={Building02Icon}><input {...register("company")} placeholder="Ex. Centre Serein" className="input !pl-11" /></SignupField>
      <SignupField label="Votre nom" error={errors.name?.message} icon={UserIcon}><input {...register("name")} placeholder="Ex. Aminata Koné" className="input !pl-11" /></SignupField>
      <div className="sm:col-span-2"><SignupField label="E-mail professionnel" error={errors.email?.message} icon={Mail01Icon}><input {...register("email")} type="email" placeholder="vous@entreprise.ci" className="input !pl-11" /></SignupField></div>
      <div className="sm:col-span-2"><SignupField label="Mot de passe" error={errors.password?.message} icon={LockPasswordIcon}><input {...register("password")} type="password" placeholder="8 caractères minimum" className="input !pl-11" /></SignupField></div>
      <div className="sm:col-span-2">
        <span className="block text-sm font-semibold text-ink">Choisissez votre formule</span>
        {loadingPlans ? (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {[0, 1].map(i => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-line bg-sand" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <p className="mt-2 rounded-2xl border border-line bg-sand px-4 py-3 text-xs leading-5 text-ink-soft">Aucune formule en ligne pour l'instant. La formule standard vous sera attribuée à l'activation.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {plans.map(plan => {
              const selected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  aria-pressed={selected}
                  className={`focus-ring relative flex flex-col rounded-2xl border p-4 text-left transition-colors ${
                    selected ? "border-gold-400 bg-gold-100/60 ring-2 ring-gold-400/40" : "border-line bg-white hover:border-pine-300"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-semibold tracking-tight text-ink">{plan.name}</span>
                    <span className="font-mono text-sm font-semibold tracking-tight text-ink">{fmtPrice(plan.price_monthly)}</span>
                  </span>
                  <span className="mt-2.5 space-y-1 text-[11px] leading-5 text-ink-soft">
                    {planFeatures(plan).map(f => <span key={f} className="flex items-start gap-1.5"><HugeiconsIcon icon={Ticket01Icon} size={13} className="mt-0.5 shrink-0 text-gold-600" />{f}</span>)}
                  </span>
                  <span className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-gold-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gold-700">
                    <span className={`h-3 w-3 rounded-full border-2 ${selected ? "border-gold-500 bg-gold-500" : "border-ink-faint bg-white"}`} />
                    {selected ? "Formule sélectionnée" : "Sélectionner cette formule"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <label className="sm:col-span-2 flex items-start gap-3 text-xs leading-5 text-ink-soft"><input {...register("terms")} type="checkbox" className="mt-0.5 accent-gold-500" />J'accepte les conditions d'utilisation et la politique de confidentialité.</label>
      {errors.terms && <p className="sm:col-span-2 -mt-2 text-xs font-medium text-clay-600">{errors.terms.message}</p>}
      <LoadingButton type="submit" isLoading={isSubmitting} loadingText="Création…" className="sm:col-span-2 mt-1 w-full bg-pine-900 text-white hover:bg-pine-700 shadow-primary" icon={!isSubmitting && <HugeiconsIcon icon={ArrowRight01Icon} size={17} />}>Créer mon espace</LoadingButton>
    </form>
    <div className="border-t border-line px-7 py-5 text-center">
      <p className="text-xs leading-5 text-ink-soft">Vous avez déjà un compte ? <button type="button" onClick={onLogin} className="focus-ring rounded font-bold text-gold-700">Se connecter</button></p>
    </div>
  </section></main>;
}
function SignupField({ label, error, icon, children }: {label: string;error?: string;icon: typeof UserIcon;children: React.ReactNode;}) {return <label className="block text-sm font-semibold text-ink"><span>{label}</span><div className="relative mt-2"><HugeiconsIcon className="pointer-events-none absolute left-3 top-3 text-ink-faint" icon={icon} size={18} />{children}</div>{error && <span className="mt-1.5 block text-xs font-medium text-clay-600">{error}</span>}</label>;}
