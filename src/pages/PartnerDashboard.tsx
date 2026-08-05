import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Building02Icon,
  ChartLineIcon,
  BubbleChatIcon,
  CheckmarkCircle02Icon,
  HandshakeIcon,
  Link02Icon,
  Logout01Icon,
  Money01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import filzIcon from "../assets/filz_icon.png";
import { api, setPartnerToken, setPartnerRefreshToken, setPartnerInfo, getPartnerInfo } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import { Page, Pagination } from "../components/ui/Pagination";

type PartnerStats = {
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  pending_earned: number;
  referral_url: string | null;
};

type PartnerProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending" | "active" | "suspended";
  referral_code: string | null;
  payout_method: string | null;
  channel: string | null;
  created_at: string;
  approved_at: string | null;
  unread_count: number;
};

type MeResponse = { partner: PartnerProfile; stats: PartnerStats };

type Referral = {
  id: string;
  organization_name: string;
  organization_slug: string;
  plan_id: string | null;
  plan_name: string | null;
  plan_price: number | null;
  commission_started_at: string | null;
  commission_until: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
};

type Plan = {
  id: string;
  name: string;
  price_monthly: number;
  allow_self_signup: boolean;
  max_branches: number;
  max_staff_users: number;
  max_queue_entries_per_month: number;
};

type ReferralForm = {
  company: string;
  business_type: string;
  address: string;
  city: string;
  contact_email: string;
  contact_phone: string;
  deposit_phone: string;
  plan_id: string;
  admin_full_name: string;
};

const BUSINESS_OPTIONS: { value: string; label: string }[] = [
  { value: "clinic", label: "Clinique" },
  { value: "hospital", label: "Hôpital" },
  { value: "restaurant", label: "Restaurant" },
  { value: "maquis", label: "Maquis" },
  { value: "salon", label: "Salon" },
  { value: "public_service", label: "Service public / privé" },
  { value: "generic", label: "Autre" },
];

const EMPTY_REFERRAL: ReferralForm = {
  company: "",
  business_type: "generic",
  address: "",
  city: "",
  contact_email: "",
  contact_phone: "",
  deposit_phone: "",
  plan_id: "",
  admin_full_name: "",
};

type Commission = {
  id: string;
  organization_name: string;
  period_start: string;
  period_end: string;
  amount: number;
  status: "earned" | "paid" | "voided";
  paid_at: string | null;
};

type Payout = {
  id: string;
  partner_id: string;
  period_label: string;
  total_amount: number;
  status: "pending" | "paid";
  method: string | null;
  paid_at: string | null;
};

const PAYOUT_METHODS = [
  { value: "Mobile Money (Orange, MTN, Moov)", label: "Mobile Money" },
  { value: "Virement bancaire", label: "Virement bancaire" },
  { value: "Wave / autres transferts", label: "Wave / autres transferts" },
];

type ChatMessage = {
  id: string;
  sender: "partner" | "superadmin";
  body: string;
  created_at: string;
  read_at: string | null;
};

type ChatResponse = { messages: ChatMessage[]; unread_count: number };

function fmtFCFA(amount: number): string {
  return `${Math.round(amount).toLocaleString("fr-FR")} FCFA`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  } catch {
    return "—";
  }
}

function Badge({ tone, children }: { tone: "green" | "gold" | "sand" | "clay"; children: React.ReactNode }) {
  const tones = {
    green: "bg-pine-100 text-pine-800",
    gold: "bg-gold-100 text-gold-700",
    sand: "bg-sand text-ink-soft",
    clay: "bg-clay-100 text-clay-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function StatCard({ icon, label, value, helper, tone }: { icon: React.ReactNode; label: string; value: string; helper: string; tone: "gold" | "green" | "blue" | "charcoal" }) {
  const tones = { gold: "bg-gold-100 text-gold-700", green: "bg-pine-100 text-pine-800", blue: "bg-pine-100 text-pine-800", charcoal: "bg-sand text-ink-soft" };
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-5 font-mono text-[26px] font-semibold tracking-[-0.04em] text-ink">{value}</p>
      <p className="mt-2 text-xs text-ink-faint">{helper}</p>
    </article>
  );
}

export function PartnerDashboard({ onLogout, onHome }: { onLogout: () => void; onHome: () => void }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [refMeta, setRefMeta] = useState<{ total: number; page: number; pages: number }>({ total: 0, page: 1, pages: 0 });
  const [commMeta, setCommMeta] = useState<{ total: number; page: number; pages: number }>({ total: 0, page: 1, pages: 0 });
  const [payMeta, setPayMeta] = useState<{ total: number; page: number; pages: number }>({ total: 0, page: 1, pages: 0 });
  const [pageSize, setPageSize] = useState(20);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [referral, setReferral] = useState<ReferralForm>(EMPTY_REFERRAL);
  const [referring, setReferring] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showSuccess, showError } = useToast();
  const cachedInfo = getPartnerInfo();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [meRes, refsRes, commsRes, paysRes, plansRes] = await Promise.all([
          api.get("/partners/me"),
          api.get(`/partners/referrals?page=1&page_size=${pageSize}`),
          api.get(`/partners/commissions?page=1&page_size=${pageSize}`),
          api.get(`/partners/payouts?page=1&page_size=${pageSize}`),
          api.get("/public/plans"),
        ]);
        setMe(meRes as MeResponse);
        const refsPage = refsRes as Page<Referral>;
        const commsPage = commsRes as Page<Commission>;
        const paysPage = paysRes as Page<Payout>;
        setReferrals(refsPage?.items ?? []);
        setRefMeta({ total: refsPage?.total ?? 0, page: refsPage?.page ?? 1, pages: refsPage?.pages ?? 0 });
        setCommissions(commsPage?.items ?? []);
        setCommMeta({ total: commsPage?.total ?? 0, page: commsPage?.page ?? 1, pages: commsPage?.pages ?? 0 });
        setPayouts(paysPage?.items ?? []);
        setPayMeta({ total: paysPage?.total ?? 0, page: paysPage?.page ?? 1, pages: paysPage?.pages ?? 0 });
        setPlans((plansRes as Plan[]) ?? []);
        const profile = (meRes as MeResponse).partner;
        setPayoutMethod(profile.payout_method ?? "");
        setPhone(profile.phone ?? "");
        setUnreadCount(profile.unread_count ?? 0);
      } catch (err: any) {
        setError(err?.message || "Impossible de charger votre espace partenaire.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadReferralPage = async (page: number, size: number) => {
    const res = (await api.get(`/partners/referrals?page=${page}&page_size=${size}`)) as Page<Referral>;
    setReferrals(res?.items ?? []);
    setRefMeta({ total: res?.total ?? 0, page: res?.page ?? 1, pages: res?.pages ?? 0 });
  };

  const loadCommissionPage = async (page: number, size: number) => {
    const res = (await api.get(`/partners/commissions?page=${page}&page_size=${size}`)) as Page<Commission>;
    setCommissions(res?.items ?? []);
    setCommMeta({ total: res?.total ?? 0, page: res?.page ?? 1, pages: res?.pages ?? 0 });
  };

  const loadPayoutPage = async (page: number, size: number) => {
    const res = (await api.get(`/partners/payouts?page=${page}&page_size=${size}`)) as Page<Payout>;
    setPayouts(res?.items ?? []);
    setPayMeta({ total: res?.total ?? 0, page: res?.page ?? 1, pages: res?.pages ?? 0 });
  };

  useEffect(() => {
    if (!chatOpen) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = (await api.get("/partners/messages")) as ChatResponse;
        if (!cancelled) {
          setMessages(res.messages ?? []);
          setUnreadCount(res.unread_count ?? 0);
        }
      } catch {
        /* silencieux : le polling réessaiera */
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chatOpen]);

  const copy = async (text: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showError("Impossible de copier dans le presse-papiers.");
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await api.patch("/partners/me", {
        phone: phone.trim() || null,
        payout_method: payoutMethod.trim() || null,
      });
      setMe((prev) => (prev ? { ...prev, partner: { ...prev.partner, phone: updated?.phone ?? null, payout_method: updated?.payout_method ?? null } } : prev));
      setPartnerInfo({ ...(cachedInfo ?? {}), phone: updated?.phone ?? null });
      showSuccess("Réglages enregistrés", "Votre méthode de versement a été mise à jour.");
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "enregistrement des réglages" }));
    } finally {
      setSavingSettings(false);
    }
  };

  const logout = () => {
    setPartnerToken(null);
    setPartnerRefreshToken(null);
    setPartnerInfo(null);
    onLogout();
  };

  const submitReferral = async () => {
    if (!referral.company.trim() || !referral.contact_email.trim() || !referral.admin_full_name.trim() || !referral.plan_id) {
      showError("Formulaire incomplet", "Renseignez au moins l'entreprise, la formule, le contact et le nom de l'administrateur.");
      return;
    }
    setReferring(true);
    try {
      await api.post("/partners/referrals", {
        company: referral.company.trim(),
        business_type: referral.business_type,
        address: referral.address.trim() || null,
        city: referral.city.trim() || null,
        contact_email: referral.contact_email.trim(),
        contact_phone: referral.contact_phone.trim() || null,
        deposit_phone: referral.deposit_phone.trim() || null,
        plan_id: referral.plan_id,
        admin_full_name: referral.admin_full_name.trim(),
      });
      setReferral(EMPTY_REFERRAL);
      showSuccess("Entreprise pré-enregistrée", "L'administrateur reçoit une invitation pour créer son mot de passe.");
      await loadReferralPage(1, pageSize);
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "pré-enregistrement de l'entreprise" }));
    } finally {
      setReferring(false);
    }
  };

  const sendChatMessage = async () => {
    const body = chatDraft.trim();
    if (!body) return;
    setSendingMessage(true);
    try {
      await api.post("/partners/messages", { body });
      setChatDraft("");
      const res = (await api.get("/partners/messages")) as ChatResponse;
      setMessages(res.messages ?? []);
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "envoi du message" }));
    } finally {
      setSendingMessage(false);
    }
  };

  const stats = me?.stats ?? null;
  const partner = me?.partner ?? null;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-pine-950 text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={onHome} className="focus-ring flex items-center gap-2.5 rounded-xl">
            <img src={filzIcon} alt="Filz" className="h-8 w-8 rounded-lg" />
            <span className="hidden font-display text-base font-semibold tracking-tight sm:block">Espace partenaire</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen((v) => !v)}
              className="focus-ring relative inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-pine-100/80 transition-colors hover:bg-white/10 hover:text-paper"
            >
              <HugeiconsIcon icon={BubbleChatIcon} size={15} />
              Chat superadmin
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-pine-950">
                  {unreadCount}
                </span>
              )}
            </button>
            <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gold-300 sm:flex">
              <HugeiconsIcon icon={HandshakeIcon} size={14} />
              {partner?.full_name || (cachedInfo?.full_name as string) || "Partenaire"}
            </span>
            <button onClick={logout} className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-pine-100/80 transition-colors hover:bg-white/10 hover:text-paper">
              <HugeiconsIcon icon={Logout01Icon} size={15} />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-clay-200 bg-clay-100 px-5 py-4 text-sm font-medium text-clay-700">{error}</div>
        )}

        {loading ? (
          <p className="text-center text-sm py-16 text-ink-soft">Chargement de votre espace…</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Mon espace</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bonjour {partner?.full_name?.split(" ")[0] || "cher partenaire"} 👋</h1>
              <p className="text-sm leading-6 text-ink-soft">Partagez votre lien et suivez vos gains de 30 % sur 5 mois, en temps réel.</p>
            </div>

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard icon={<HugeiconsIcon icon={UserGroupIcon} size={19} />} label="Références totales" value={String(stats?.total_referrals ?? 0)} helper="Entreprises rattachées à votre lien" tone="gold" />
              <StatCard icon={<HugeiconsIcon icon={Building02Icon} size={19} />} label="Références actives" value={String(stats?.active_referrals ?? 0)} helper="Dans leur fenêtre de 5 mois" tone="green" />
              <StatCard icon={<HugeiconsIcon icon={ChartLineIcon} size={19} />} label="Gains en attente" value={fmtFCFA(stats?.pending_earned ?? 0)} helper="Commissions acquises, non versées" tone="charcoal" />
              <StatCard icon={<HugeiconsIcon icon={Money01Icon} size={19} />} label="Gains totaux" value={fmtFCFA(stats?.total_earned ?? 0)} helper="Depuis le début du programme" tone="blue" />
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line bg-pine-950 p-5 sm:p-6">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-gold-300">
                  <HugeiconsIcon icon={Link02Icon} size={15} />
                  Mon lien de parrainage
                </p>
                <p className="mt-2 text-sm leading-6 text-pine-100/80">
                  Chaque entreprise qui s’inscrit via ce lien est automatiquement rattachée à vous.
                </p>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
                <div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <code className="rounded-xl bg-sand px-3 py-2.5 font-mono text-xs text-ink sm:text-sm">
                      {stats?.referral_url || "—"}
                    </code>
                    <button
                      onClick={() => stats?.referral_url && copy(stats.referral_url, "link")}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-pine-900 px-4 py-2.5 text-xs font-bold text-paper hover:bg-pine-950"
                    >
                      {copied === "link" ? <><HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> Copié !</> : "Copier le lien"}
                    </button>
                  </div>
                  {partner?.referral_code && (
                    <p className="mt-3 text-xs text-ink-soft">
                      Code de parrainage :{" "}
                      <button
                        onClick={() => copy(partner.referral_code ?? "", "code")}
                        className="focus-ring rounded font-mono font-bold text-gold-700 underline-offset-2 hover:underline"
                      >
                        {partner.referral_code}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line bg-pine-950 p-5 sm:p-6">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-gold-300">
                  <HugeiconsIcon icon={Building02Icon} size={15} />
                  Référer une entreprise
                </p>
                <p className="mt-2 text-sm leading-6 text-pine-100/80">
                  Pré-enregistrez une entreprise directement : l'administrateur reçoit une invitation pour créer son mot de passe, puis notre équipe active son compte après confirmation du paiement.
                </p>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block text-sm font-semibold text-ink">
                  Nom de l'entreprise *
                  <input value={referral.company} onChange={(e) => setReferral({ ...referral, company: e.target.value })} placeholder="Ex. Clinique Espérance" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Type d'activité
                  <select value={referral.business_type} onChange={(e) => setReferral({ ...referral, business_type: e.target.value })} className="input mt-2">
                    {BUSINESS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Ville
                  <input value={referral.city} onChange={(e) => setReferral({ ...referral, city: e.target.value })} placeholder="Ex. Abidjan" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Adresse
                  <input value={referral.address} onChange={(e) => setReferral({ ...referral, address: e.target.value })} placeholder="Ex. Cocody, Riviera 3" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  E-mail du contact *
                  <input type="email" value={referral.contact_email} onChange={(e) => setReferral({ ...referral, contact_email: e.target.value })} placeholder="contact@entreprise.com" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Téléphone du contact
                  <input type="tel" value={referral.contact_phone} onChange={(e) => setReferral({ ...referral, contact_phone: e.target.value })} placeholder="Ex. 07 00 00 00 00" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Numéro de dépôt (paiement)
                  <input type="tel" value={referral.deposit_phone} onChange={(e) => setReferral({ ...referral, deposit_phone: e.target.value })} placeholder="Ex. 05 00 00 00 00" className="input mt-2" />
                  <span className="mt-1 block text-xs font-normal text-ink-faint">Numéro Mobile Money utilisé pour le dépôt / paiement de l'abonnement.</span>
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Administrateur à inviter *
                  <input value={referral.admin_full_name} onChange={(e) => setReferral({ ...referral, admin_full_name: e.target.value })} placeholder="Nom complet de l'administrateur" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Formule choisie *
                  <select value={referral.plan_id} onChange={(e) => setReferral({ ...referral, plan_id: e.target.value })} className="input mt-2">
                    <option value="">Choisir une formule…</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} · {fmtFCFA(p.price_monthly)}/mois</option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <button onClick={submitReferral} disabled={referring} className="focus-ring inline-flex touch-target items-center gap-2 rounded-xl bg-pine-900 px-5 py-2.5 text-sm font-bold text-paper shadow-[0_8px_18px_rgba(18,51,45,0.20)] hover:bg-pine-950 disabled:cursor-not-allowed disabled:opacity-60">
                    {referring ? "Enregistrement…" : "Enregistrer l'entreprise"}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line p-5 sm:p-6">
                <h2 className="font-bold">Entreprises parrainées</h2>
                <p className="mt-1 text-xs text-ink-soft">Les entreprises inscrites via votre lien et leur fenêtre de commission.</p>
              </div>
              {referrals.length === 0 ? (
                <p className="p-8 text-center text-sm text-ink-faint">Aucune entreprise parrainée pour le moment. Partagez votre lien !</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead className="bg-paper">
                      <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-faint">
                        <th className="px-6 py-3">Entreprise</th>
                        <th className="px-3 py-3">Formule choisie</th>
                        <th className="px-3 py-3">Statut</th>
                        <th className="px-3 py-3">Fenêtre de commission</th>
                        <th className="px-6 py-3">Rattachée le</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((ref) => (
                        <tr key={ref.id} className="border-t border-line text-sm">
                          <td className="px-6 py-4 font-bold">{ref.organization_name}</td>
                          <td className="px-3 py-4">
                            {ref.plan_name ? (
                              <Badge tone="gold">
                                {ref.plan_name} · {fmtFCFA(ref.plan_price ?? 0)}
                              </Badge>
                            ) : (
                              <Badge tone="sand">Formule à déterminer</Badge>
                            )}
                          </td>
                          <td className="px-3 py-4">
                            {!ref.is_approved ? (
                              <Badge tone="clay">En attente d'approbation</Badge>
                            ) : ref.is_active ? (
                              <Badge tone="green">Active</Badge>
                            ) : (
                              <Badge tone="sand">Terminée</Badge>
                            )}
                          </td>
                          <td className="px-3 py-4 text-xs text-ink-soft">
                            {ref.commission_started_at ? `${fmtDate(ref.commission_started_at)} → ${fmtDate(ref.commission_until)}` : "Démarre au 1er paiement"}
                          </td>
                          <td className="px-6 py-4 text-xs text-ink-soft">{fmtDate(ref.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {refMeta.total > 0 && (
                <Pagination
                  page={refMeta.page}
                  pages={refMeta.pages}
                  total={refMeta.total}
                  pageSize={pageSize}
                  onPageChange={(p) => loadReferralPage(p, pageSize)}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    loadReferralPage(1, s);
                  }}
                />
              )}
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="border-b border-line p-5">
                  <h2 className="font-bold">Commissions</h2>
                  <p className="mt-1 text-xs text-ink-soft">30 % du montant mensuel de chaque entreprise parrainée.</p>
                </div>
                {commissions.length === 0 ? (
                  <p className="p-8 text-center text-sm text-ink-faint">Aucune commission pour le moment.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                      <thead className="bg-paper">
                        <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-faint">
                          <th className="px-5 py-3">Période</th>
                          <th className="px-3 py-3">Entreprise</th>
                          <th className="px-3 py-3">Montant</th>
                          <th className="px-5 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((c) => (
                          <tr key={c.id} className="border-t border-line text-sm">
                            <td className="px-5 py-4 text-xs text-ink-soft">{fmtDate(c.period_start)} → {fmtDate(c.period_end)}</td>
                            <td className="px-3 py-4 font-semibold">{c.organization_name}</td>
                            <td className="px-3 py-4 font-mono font-semibold text-pine-950">{fmtFCFA(c.amount)}</td>
                            <td className="px-5 py-4">
                              {c.status === "earned" ? <Badge tone="gold">Acquise</Badge> : c.status === "paid" ? <Badge tone="green">Versée</Badge> : <Badge tone="clay">Annulée</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {commMeta.total > 0 && (
                  <Pagination
                    page={commMeta.page}
                    pages={commMeta.pages}
                    total={commMeta.total}
                    pageSize={pageSize}
                    onPageChange={(p) => loadCommissionPage(p, pageSize)}
                    onPageSizeChange={(s) => loadCommissionPage(1, s)}
                  />
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-line bg-white">
                <div className="border-b border-line p-5">
                  <h2 className="font-bold">Versements</h2>
                  <p className="mt-1 text-xs text-ink-soft">Historique des commissions versées par la plateforme.</p>
                </div>
                {payouts.length === 0 ? (
                  <p className="p-8 text-center text-sm text-ink-faint">Aucun versement pour le moment.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left">
                      <thead className="bg-paper">
                        <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-faint">
                          <th className="px-5 py-3">Période</th>
                          <th className="px-3 py-3">Montant</th>
                          <th className="px-3 py-3">Méthode</th>
                          <th className="px-5 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map((p) => (
                          <tr key={p.id} className="border-t border-line text-sm">
                            <td className="px-5 py-4 text-xs text-ink-soft">{p.period_label}</td>
                            <td className="px-3 py-4 font-mono font-semibold text-pine-950">{fmtFCFA(p.total_amount)}</td>
                            <td className="px-3 py-4 text-xs text-ink-soft">{p.method || "—"}</td>
                            <td className="px-5 py-4">
                              {p.status === "paid" ? <Badge tone="green">Payé</Badge> : <Badge tone="gold">En préparation</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {payMeta.total > 0 && (
                  <Pagination
                    page={payMeta.page}
                    pages={payMeta.pages}
                    total={payMeta.total}
                    pageSize={pageSize}
                    onPageChange={(p) => loadPayoutPage(p, pageSize)}
                    onPageSizeChange={(s) => loadPayoutPage(1, s)}
                  />
                )}
              </section>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line p-5 sm:p-6">
                <h2 className="flex items-center gap-2 font-bold">
                  <HugeiconsIcon icon={Wallet01Icon} size={18} className="text-gold-600" />
                  Réglages de versement
                </h2>
                <p className="mt-1 text-xs text-ink-soft">Indiquez comment vous souhaitez recevoir vos commissions.</p>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="block text-sm font-semibold text-ink">
                  Téléphone / WhatsApp
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex. 07 00 00 00 00" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Méthode de versement
                  <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="input mt-2">
                    <option value="">Choisir une méthode…</option>
                    {PAYOUT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <button onClick={saveSettings} disabled={savingSettings} className="focus-ring inline-flex touch-target items-center gap-2 rounded-xl bg-pine-900 px-5 py-2.5 text-sm font-bold text-paper shadow-[0_8px_18px_rgba(18,51,45,0.20)] hover:bg-pine-950 disabled:cursor-not-allowed disabled:opacity-60">
                    {savingSettings ? "Enregistrement…" : "Enregistrer mes réglages"}
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </button>
                </div>
              </div>
            </section>

            <footer className="mt-10 border-t border-line pt-6">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-xs text-ink-faint">© 2026 Filz · Programme partenaire — 30 % pendant 5 mois.</p>
                <button onClick={onHome} className="focus-ring rounded-xl text-xs font-semibold text-gold-700 underline-offset-2 hover:underline">
                  Retour au site Filz
                </button>
              </div>
            </footer>
          </>
        )}
      </main>

      {chatOpen && (
        <aside className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-line bg-paper shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-line bg-pine-950 p-5">
            <div>
              <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-gold-300">
                <HugeiconsIcon icon={BubbleChatIcon} size={15} />
                Chat avec le superadmin
              </h2>
              <p className="mt-2 text-sm leading-6 text-pine-100/80">
                Échangez directement avec l'équipe Filz : activation, paiement, commissions.
              </p>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              aria-label="Fermer le chat"
              className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-xl text-pine-100/80 transition-colors hover:bg-white/10 hover:text-paper"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <p className="m-auto text-center text-sm text-ink-faint">Aucun message. Écrivez à l'équipe Filz pour démarrer la discussion.</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "partner" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-card ${
                      m.sender === "partner"
                        ? "rounded-br-sm bg-pine-900 text-paper"
                        : "rounded-bl-sm border border-line bg-white text-ink"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-1 text-[10px] font-medium ${m.sender === "partner" ? "text-pine-200/70" : "text-ink-faint"}`}>
                      {m.sender === "partner" ? "Vous" : "Superadmin Filz"} · {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-line p-4">
            <textarea
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              rows={2}
              placeholder="Écrivez votre message…"
              className="input flex-1 resize-none"
            />
            <button onClick={sendChatMessage} disabled={sendingMessage || !chatDraft.trim()} className="focus-ring inline-flex touch-target items-center gap-2 rounded-xl bg-pine-900 px-4 py-2.5 text-sm font-bold text-paper hover:bg-pine-950 disabled:cursor-not-allowed disabled:opacity-60">
              {sendingMessage ? "Envoi…" : "Envoyer"}
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
