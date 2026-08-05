import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, CheckmarkCircle02Icon, Edit02Icon, InformationCircleIcon, Delete01Icon } from "@hugeicons/core-free-icons";
import { Button, PageHeader } from "../components/ui/Ui";
import { api } from "../utils/api";

type Plan = {
  id: string;
  name: string;
  price_monthly: number;
  trial_days: number;
  allow_self_signup: boolean;
  max_branches: number;
  max_staff_users: number;
  max_queue_entries_per_month: number;
  is_active: boolean;
  tenant_count: number;
};

function formatPriceFCFA(price: number): string {
  if (price <= 0) return "Gratuit";
  const rounded = Math.round(price).toLocaleString("fr-FR");
  return `${rounded} FCFA`;
}

function buildLimits(plan: Plan): string[] {
  const limits = [];
  limits.push(plan.max_branches <= 1 ? `${plan.max_branches} établissement` : `${plan.max_branches} établissements`);
  limits.push(plan.max_staff_users <= 1 ? `${plan.max_staff_users} membre d’équipe` : `${plan.max_staff_users} membres d’équipe`);
  limits.push(`${plan.max_queue_entries_per_month.toLocaleString("fr-FR")} entrées / mois`);
  limits.push(plan.allow_self_signup ? "Inscription publique autorisée" : "Attribution superadmin uniquement");
  return limits;
}

function PlanEditor({
  plan,
  highlighted,
  onSaved,
  onDelete,
}: {
  plan: Plan;
  highlighted: boolean;
  onSaved: (plan: Plan) => void;
  onDelete: (planId: string) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDraft(plan);
  }, [plan]);

  const update = (field: keyof Plan, value: string | number | boolean) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    setNotice("");
    try {
      const payload = {
        name: draft.name,
        price_monthly: Number(draft.price_monthly),
        trial_days: Number(draft.trial_days),
        allow_self_signup: draft.allow_self_signup,
        max_branches: Number(draft.max_branches),
        max_staff_users: Number(draft.max_staff_users),
        max_queue_entries_per_month: Number(draft.max_queue_entries_per_month),
        is_active: draft.is_active,
      };
      const saved = await api.patch(`/superadmin/plans/${plan.id}`, payload);
      onSaved({ ...draft, ...(saved as Plan), tenant_count: plan.tenant_count });
      setNotice("Formule enregistrée.");
    } catch (err: any) {
      setNotice(err.message || "Impossible d’enregistrer la formule.");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async () => {
    if (plan.tenant_count > 0) {
      setNotice("Impossible de supprimer : des entreprises utilisent ce plan.");
      return;
    }
    setDeleting(true);
    setNotice("");
    try {
      await api.delete(`/superadmin/plans/${plan.id}`);
      onDelete(plan.id);
      setNotice("Formule supprimée.");
    } catch (err: any) {
      setNotice(err.message || "Impossible de supprimer la formule.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-white p-5 ${highlighted ? "border-[#e87325] shadow-[0_10px_30px_rgba(232,115,37,.1)]" : "border-[#e5e5df]"}`}
    >
      {highlighted && (
        <span className="absolute right-4 top-4 rounded-full bg-[#fff1e5] px-2.5 py-1 text-[10px] font-bold text-[#b94d10]">
          Plus choisi
        </span>
      )}
      <label className="block text-xs font-bold uppercase tracking-[.13em] text-[#929aa7]">
        Nom
        <input value={draft.name} onChange={(e) => update("name", e.target.value)} className="mt-2 input bg-white text-sm normal-case tracking-normal" />
      </label>
      <p className="mt-4 text-3xl font-bold tracking-[-.055em]">{formatPriceFCFA(Number(draft.price_monthly))}</p>
      <p className="mt-1 text-xs text-[#788292]">par mois, hors taxes</p>
      <p className="mt-5 rounded-xl bg-[#f7f7f5] px-3 py-2 text-xs font-bold text-[#596477]">
        {plan.tenant_count} entreprise{plan.tenant_count > 1 ? "s" : ""} active{plan.tenant_count > 1 ? "s" : ""}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <NumberField label="Prix mensuel" value={draft.price_monthly} onChange={(v) => update("price_monthly", v)} />
        <NumberField label="Établissements" value={draft.max_branches} onChange={(v) => update("max_branches", v)} />
        <NumberField label="Staff" value={draft.max_staff_users} onChange={(v) => update("max_staff_users", v)} />
        <label className="col-span-2 block text-xs font-bold text-[#596477]">
          Entrées / mois
          <input type="number" min={1} value={draft.max_queue_entries_per_month} onChange={(e) => update("max_queue_entries_per_month", Number(e.target.value))} className="mt-1 input bg-white" />
        </label>
      </div>

      <div className="mt-4 space-y-2">
        <Toggle label="Plan actif" checked={draft.is_active} onChange={(value) => update("is_active", value)} />
        <Toggle label="Autoriser l’inscription publique" checked={draft.allow_self_signup} onChange={(value) => update("allow_self_signup", value)} />
      </div>

      <ul className="mt-5 space-y-2">
        {buildLimits(draft).map((limit) => (
          <li key={limit} className="flex items-center gap-2 text-xs text-[#4d5768]">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-[#2b8050]" />
            {limit}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving} variant={highlighted ? "primary" : "secondary"} className="flex-1" icon={<HugeiconsIcon icon={Edit02Icon} size={16} />}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleting || plan.tenant_count > 0}
          variant="ghost"
          className="!px-3 !py-2"
          icon={<HugeiconsIcon icon={Delete01Icon} size={16} />}
          aria-label="Supprimer"
        />
      </div>
      {notice && <p className="mt-3 text-xs font-bold text-[#287044]">{notice}</p>}

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-white/90 backdrop-blur-sm rounded-2xl">
          <div className="w-full max-w-[260px] rounded-xl border border-[#e5e5df] bg-white p-4 shadow-lg">
            <p className="text-sm font-bold">Supprimer ce plan ?</p>
            <p className="mt-2 text-xs text-[#788292]">
              {plan.tenant_count > 0 
                ? "Impossible : des entreprises utilisent ce plan." 
                : "Cette action est irréversible."}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="secondary"
                className="flex-1"
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button
                onClick={deletePlan}
                className="flex-1"
                disabled={deleting || plan.tenant_count > 0}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs font-bold text-[#596477]">
      {label}
      <input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 input bg-white" />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f7f5] px-3 py-2 text-xs font-bold text-[#596477]">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#e87325]" />
    </label>
  );
}

export function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get("/superadmin/plans")
      .then((res) => {
        if (!cancelled) setPlans(res as Plan[]);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Erreur lors du chargement des plans.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const simulatedHighlightIndex = plans.length > 1 ? 1 : 0;

  const createPlan = async () => {
    setNotice("");
    try {
      const next = plans.length + 1;
      const created = await api.post("/superadmin/plans", {
        name: `Nouvelle formule ${next}`,
        price_monthly: 0,
        trial_days: 14,
        allow_self_signup: false,
        max_branches: 1,
        max_staff_users: 3,
        max_queue_entries_per_month: 1000,
        is_active: false,
      });
      setPlans((current) => [...current, { ...(created as Plan), tenant_count: 0 }]);
      setNotice("Nouvelle formule créée. Ajustez ses limites puis activez-la.");
    } catch (err: any) {
      setNotice(err.message || "Impossible de créer la formule.");
    }
  };

  const deletePlan = (planId: string) => {
    setPlans((current) => current.filter((plan) => plan.id !== planId));
  };

  return <>
    <PageHeader
      eyebrow="Administration Fila"
      title="Plans & tarifs"
      description="Configurez les formules proposées aux entreprises et contrôlez leurs limites d’utilisation."
      action={<Button onClick={createPlan} icon={<HugeiconsIcon icon={Add01Icon} size={18} />}>Créer une formule</Button>}
    />
    {error && (
      <div className="mb-4 rounded-xl border border-[#f0d8bd] bg-[#fffbf6] p-3 text-xs font-bold text-[#b94d10]">{error}</div>
    )}
    <section className="grid gap-5 lg:grid-cols-3">
      {loading ? (
        <>
          {[0, 1, 2].map((i) => (
            <article key={i} className="rounded-2xl border border-[#e5e5df] bg-white p-5 text-xs text-[#788292]">
              Chargement des plans…
            </article>
          ))}
        </>
      ) : plans.length === 0 ? (
        <article className="col-span-3 rounded-2xl border border-[#e5e5df] bg-white p-6 text-sm text-[#596477]">
          Aucun plan disponible. Créez une première formule pour démarrer.
        </article>
      ) : (
        plans.map((plan, index) => (
          <PlanEditor
            key={plan.id}
            plan={plan}
            highlighted={index === simulatedHighlightIndex}
            onSaved={(saved) => setPlans((current) => current.map((item) => item.id === saved.id ? saved : item))}
            onDelete={deletePlan}
          />
        ))
      )}
    </section>
    <section className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <article className="rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
        <h2 className="font-bold">Règles de facturation</h2>
        <div className="mt-5 divide-y divide-[#efefea] border-y border-[#efefea]">
          {[
            { title: "Période de grâce", detail: "7 jours après un échec de paiement avant la restriction QR." },
            { title: "Mise à niveau", detail: "Appliquée immédiatement avec facturation au prorata." },
            { title: "Résiliation", detail: "Accès lecture seule pendant 30 jours, données exportables." },
          ].map((rule) => (
            <div key={rule.title} className="py-4">
              <p className="text-sm font-bold">{rule.title}</p>
              <p className="mt-1 text-xs leading-5 text-[#788292]">{rule.detail}</p>
            </div>
          ))}
        </div>
      </article>
      <aside className="rounded-2xl border border-[#f0d8bd] bg-[#fffbf6] p-5">
        <HugeiconsIcon icon={InformationCircleIcon} size={20} className="text-[#c45b1a]" />
        <h2 className="mt-3 text-sm font-bold text-[#70320b]">Impact des changements</h2>
        <p className="mt-2 text-xs leading-5 text-[#86572f]">
          Les limites modifiées sont appliquées lors du prochain cycle, sauf décision manuelle du superadmin.
        </p>
        {notice && (
          <p aria-live="polite" className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#287044]">
            {notice}
          </p>
        )}
      </aside>
    </section>
  </>;
}
