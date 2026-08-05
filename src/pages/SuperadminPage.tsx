import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, Clock01Icon, HandshakeIcon, HeadphonesIcon, Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, MetricCard, PageHeader, StatusBadge } from "../components/ui/Ui";
import { Modal } from "../components/ui/Modal";
import { Page, Pagination } from "../components/ui/Pagination";
import { api } from "../utils/api";
import { useToast } from "../components/ui/Toast";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  contact_email: string | null;
  contact_phone: string | null;
  deposit_phone: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string | null;
  referred_by: {
    partner_id: string;
    partner_name: string;
    referral_code: string;
    commission_started_at: string | null;
    commission_until: string | null;
  } | null;
  subscription: {
    status: "trialing" | "active" | "past_due" | "expired" | "cancelled";
    plan_id: string;
    current_period_end: string | null;
    queue_entries_this_period: number;
    plan: {
      id: string;
      name: string;
      max_queue_entries_per_month: number;
    } | null;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  trial_days: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
}

interface Partner {
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
  total_referrals: number;
  total_earned: number;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  sender: "partner" | "superadmin";
  body: string;
  created_at: string;
  read_at: string | null;
}

export function SuperadminPage({ onNavigate }: {onNavigate: (screen: "admin-support" | "admin-plans") => void;}) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tenantDetails, setTenantDetails] = useState<any>(null);
  const [chatPartner, setChatPartner] = useState<Partner | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  const [pageSize, setPageSize] = useState(20);
  const [tenantMeta, setTenantMeta] = useState({ total: 0, page: 1, pages: 0 });
  const [partnerMeta, setPartnerMeta] = useState({ total: 0, page: 1, pages: 0 });
  const [activeCount, setActiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [partnerActiveCount, setPartnerActiveCount] = useState(0);
  const [partnerPendingCount, setPartnerPendingCount] = useState(0);
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  const loadTenants = async (page: number, q?: string, size?: number) => {
    const params = new URLSearchParams({ page: String(page), page_size: String(size ?? pageSize) });
    if (q && q.trim()) params.set("q", q.trim());
    const res = await api.get(`/superadmin/tenants?${params.toString()}`) as Page<Tenant> & { active_count?: number; pending_count?: number };
    setTenants(res.items ?? []);
    setTenantMeta({ total: res.total ?? 0, page: res.page ?? 1, pages: res.pages ?? 0 });
    setActiveCount(res.active_count ?? 0);
    setPendingCount(res.pending_count ?? 0);
  };

  const loadPartners = async (page: number, size?: number) => {
    const res = await api.get(`/superadmin/partners?page=${page}&page_size=${size ?? pageSize}`) as Page<Partner> & { active_count?: number; pending_count?: number };
    setPartners(res.items ?? []);
    setPartnerMeta({ total: res.total ?? 0, page: res.page ?? 1, pages: res.pages ?? 0 });
    setPartnerActiveCount(res.active_count ?? 0);
    setPartnerPendingCount(res.pending_count ?? 0);
  };

  const loadTickets = async (page: number) => {
    const res = await api.get(`/superadmin/support-tickets?page=${page}&page_size=100`) as Page<SupportTicket> & { open_count?: number };
    setTickets(res.items ?? []);
    setOpenTicketsCount(res.open_count ?? 0);
  };

  useEffect(() => {
    Promise.all([
      loadTenants(1, query),
      api.get("/superadmin/plans"),
      loadTickets(1),
      loadPartners(1)
    ])
      .then(([, plansData]) => {
        setPlans(plansData);
        setError(null);
      })
      .catch(() => {
        setError("Erreur de connexion avec les API d'administration.");
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadTenants(1, query), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress");

  // Format date helper
  const refreshTenants = async () => {
    await loadTenants(tenantMeta.page, query);
  };

  const refreshPartners = async () => {
    await loadPartners(partnerMeta.page);
  };

  const updatePartnerStatus = async (partnerId: string, status: "active" | "suspended") => {
    try {
      await api.patch(`/superadmin/partners/${partnerId}`, { status });
      await refreshPartners();
      showSuccess(
        status === "active" ? "Partenaire activé" : "Partenaire suspendu",
        status === "active" ? "Code de parrainage généré et envoyé par e-mail." : "Le partenaire ne peut plus se connecter."
      );
    } catch (err: any) {
      showError(err?.message || "Impossible de mettre à jour le partenaire.");
    }
  };

  const launchPayout = async (partnerId: string) => {
    try {
      const period = new Date().toISOString().slice(0, 7);
      const payout = await api.post(`/superadmin/partners/${partnerId}/payouts?period=${period}`);
      showSuccess(
        "Versement créé",
        `Commission d’un montant de ${Number(payout?.total_amount ?? 0).toLocaleString("fr-FR")} FCFA pour ${period}. N’oubliez pas de le confirmer après paiement.`
      );
      await refreshPartners();
    } catch (err: any) {
      showError(err?.message || "Aucune commission en attente de versement pour ce partenaire.");
    }
  };

  const updateTenant = async (tenantId: string, data: Partial<Tenant>) => {
    await api.patch(`/superadmin/tenants/${tenantId}`, data);
    await refreshTenants();
  };

  const updateSubscription = async (tenant: Tenant, status: string, planId?: string, trialDays?: number) => {
    const selectedPlanId = planId || tenant.subscription?.plan_id || plans[0]?.id;
    if (!selectedPlanId) return;
    const params = new URLSearchParams({
      plan_id: selectedPlanId,
      status_value: status,
    });
    if (trialDays !== undefined) params.set("trial_days", String(trialDays));
    await api.patch(`/superadmin/tenants/${tenant.id}/subscription?${params.toString()}`);
    await refreshTenants();
  };

  const resetQuota = async (tenantId: string) => {
    await api.post(`/superadmin/tenants/${tenantId}/subscription/reset-quota`);
    await refreshTenants();
  };

  const openTenantDetails = async (tenantId: string) => {
    const details = await api.get(`/superadmin/tenants/${tenantId}/details`);
    setTenantDetails(details);
  };

  const openPartnerChat = async (partner: Partner) => {
    setChatPartner(partner);
    setChatMessages([]);
    setChatDraft("");
    try {
      const res = await api.get(`/superadmin/partners/${partner.id}/messages`);
      setChatMessages(res?.messages ?? []);
    } catch (err: any) {
      showError(err?.message || "Impossible de charger la discussion.");
    }
  };

  const sendChatMessage = async () => {
    const body = chatDraft.trim();
    if (!body || !chatPartner) return;
    setSendingMessage(true);
    try {
      await api.post(`/superadmin/partners/${chatPartner.id}/messages`, { body });
      setChatDraft("");
      const res = await api.get(`/superadmin/partners/${chatPartner.id}/messages`);
      setChatMessages(res?.messages ?? []);
    } catch (err: any) {
      showError(err?.message || "Impossible d'envoyer le message.");
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!chatPartner) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.get(`/superadmin/partners/${chatPartner.id}/messages`);
        if (!cancelled) setChatMessages(res?.messages ?? []);
      } catch {
        /* polling silencieux */
      }
    };
    const interval = setInterval(poll, 8000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chatPartner]);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short"
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration Fila"
        title="Vue plateforme"
        description="Surveillez les entreprises clientes, l’activité de la plateforme et les demandes nécessitant votre attention."
      />

      {error && <div className="p-4 mb-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}

      {loading ? (
        <p className="text-center text-sm py-10">Chargement des données de la plateforme...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Entreprises actives" value={String(activeCount)} helper="Total des tenants actifs" tone="orange" icon={<HugeiconsIcon icon={Building02Icon} size={19} />} />
            <MetricCard label="Total Inscriptions" value={String(tenantMeta.total)} helper="Inscriptions sur la plateforme" tone="green" icon={<HugeiconsIcon icon={UserGroupIcon} size={19} />} />
            <MetricCard label="En attente approbation" value={String(pendingCount)} helper="Nécessitant une approbation" tone="charcoal" icon={<HugeiconsIcon icon={HeadphonesIcon} size={19} />} />
            <MetricCard label="Demandes ouvertes" value={String(openTicketsCount)} helper="Tickets nécessitant une réponse" tone="blue" icon={<HugeiconsIcon icon={Clock01Icon} size={19} />} />
            <MetricCard label="Partenaires actifs" value={String(partnerActiveCount)} helper={`${partnerPendingCount} candidature(s) en attente`} tone="green" icon={<HugeiconsIcon icon={HandshakeIcon} size={19} />} />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.42fr_.58fr]">
            <article className="overflow-hidden rounded-2xl border border-[#e5e5df] bg-white">
              <div className="flex flex-col gap-3 border-b border-[#ecece7] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">Entreprises (Tenants)</h2>
                  <p className="mt-1 text-xs text-[#788292]">Gérez le statut et l’accès de chaque entreprise.</p>
                </div>
                <label className="relative">
                  <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-2.5 text-[#8a93a1]" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher" className="focus-ring h-9 rounded-lg border border-[#deded8] pl-8 pr-3 text-xs" />
                </label>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="bg-[#fafaf8]">
                    <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-[#929aa7]">
                      <th className="px-5 py-3">Entreprise</th>
                      <th className="px-3 py-3">Partenaire</th>
                      <th className="px-3 py-3">Statut</th>
                      <th className="px-3 py-3">Abonnement</th>
                      <th className="px-3 py-3">Quota</th>
                      <th className="px-3 py-3">Échéance</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="border-t border-[#f0f0eb] text-sm">
                        <td className="px-5 py-4">
                          <p className="font-bold">{tenant.name}</p>
                          <p className="mt-1 text-xs text-[#788292]">
                            {tenant.business_type}
                            {tenant.city ? ` · ${tenant.city}` : ""}
                            {tenant.contact_email ? ` · ${tenant.contact_email}` : ""}
                          </p>
                          {tenant.deposit_phone && (
                            <p className="mt-1 text-[11px] font-semibold text-[#b94d10]">Dépôt : {tenant.deposit_phone}</p>
                          )}
                        </td>
                        <td className="px-3 py-4 text-xs text-[#596477]">
                          {tenant.referred_by ? (
                            <span>
                              <p className="font-bold text-[#b94d10]">{tenant.referred_by.partner_name}</p>
                              <p className="mt-0.5 text-[11px] text-[#788292]">via {tenant.referred_by.referral_code}</p>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge state={tenant.is_active ? "active" : "pending"} />
                        </td>
                        <td className="px-3 py-4">
                          <div className="space-y-2">
                            <StatusBadge state={tenant.subscription?.status || "inactive"} />
                            <select
                              value={tenant.subscription?.plan_id || ""}
                              onChange={(e) => updateSubscription(tenant, tenant.subscription?.status || "trialing", e.target.value)}
                              className="focus-ring h-8 w-full rounded-lg border border-[#deded8] bg-white px-2 text-xs"
                            >
                              {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-xs text-[#596477]">
                          {tenant.subscription
                            ? `${tenant.subscription.queue_entries_this_period.toLocaleString("fr-FR")} / ${tenant.subscription.plan?.max_queue_entries_per_month?.toLocaleString("fr-FR") || "—"}`
                            : "—"}
                        </td>
                        <td className="px-3 py-4 text-xs text-[#788292]">{formatDate(tenant.subscription?.current_period_end || null)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            {!tenant.is_active ? (
                              <Button size="sm" variant="primary" onClick={() => updateTenant(tenant.id, { is_active: true })}>
                                📋 Approuver
                              </Button>
                            ) : (
                              <Button size="sm" variant="secondary" onClick={() => updateTenant(tenant.id, { is_active: false })}>
                                Suspendre
                              </Button>
                            )}
                            <Button size="sm" variant="secondary" onClick={() => updateSubscription(tenant, "active")}>
                              Actif
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => updateSubscription(tenant, "expired")}>
                              Expirer
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => resetQuota(tenant.id)}>
                              Reset quota
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openTenantDetails(tenant.id)}>
                              Détails
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-sm text-[#8e96a3]">Aucun tenant trouvé.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {tenantMeta.total > 0 && (
                <Pagination
                  page={tenantMeta.page}
                  pages={tenantMeta.pages}
                  total={tenantMeta.total}
                  pageSize={pageSize}
                  onPageChange={(p) => loadTenants(p, query)}
                  onPageSizeChange={(s) => { setPageSize(s); loadTenants(1, query, s); }}
                />
              )}
            </article>

            <aside className="rounded-2xl border border-[#e5e5df] bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929aa7]">Derniers tickets ouverts</p>
              <div className="mt-4 space-y-3">
                {openTickets.slice(0, 3).map(ticket => (
                  <div key={ticket.id} className="rounded-xl border border-[#ecece7] p-3">
                    <p className="text-sm font-bold truncate">{ticket.subject}</p>
                    <p className="mt-1 text-xs leading-5 text-[#788292]">Catégorie: {ticket.category} · Reçu le {formatDate(ticket.created_at)}</p>
                  </div>
                ))}
                {openTickets.length === 0 && (
                  <p className="text-xs text-[#8e96a3] text-center py-4">Aucune demande en attente.</p>
                )}
              </div>
              <button onClick={() => onNavigate("admin-support")} className="focus-ring mt-5 w-full rounded-xl bg-[#f7f7f5] py-2.5 text-sm font-bold text-[#b94d10]">
                Ouvrir le centre de support
              </button>
            </aside>
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#e5e5df] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#ecece7] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">Partenaires (affiliés)</h2>
                <p className="mt-1 text-xs text-[#788292]">Validez les candidatures, activez les liens de parrainage et lancez les versements de commissions.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-[#fafaf8]">
                  <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-[#929aa7]">
                    <th className="px-5 py-3">Partenaire</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-3 py-3">Code de parrainage</th>
                    <th className="px-3 py-3">Références</th>
                    <th className="px-3 py-3">Gains totaux</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-t border-[#f0f0eb] text-sm">
                      <td className="px-5 py-4">
                        <p className="font-bold">{partner.full_name}</p>
                        <p className="mt-1 text-xs text-[#788292]">{partner.email}{partner.channel ? ` · ${partner.channel}` : ""}</p>
                      </td>
                      <td className="px-3 py-4">
                        <StatusBadge state={partner.status} />
                      </td>
                      <td className="px-3 py-4">
                        {partner.referral_code ? (
                          <code className="rounded-lg bg-[#f7f7f5] px-2 py-1 font-mono text-xs font-bold text-pine-900">{partner.referral_code}</code>
                        ) : (
                          <span className="text-xs text-[#8e96a3]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-[#596477]">{partner.total_referrals}</td>
                      <td className="px-3 py-4 font-mono font-semibold text-pine-950">{partner.total_earned.toLocaleString("fr-FR")} FCFA</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {partner.status === "pending" ? (
                            <Button size="sm" variant="primary" onClick={() => updatePartnerStatus(partner.id, "active")}>
                              Approuver
                            </Button>
                          ) : partner.status === "active" ? (
                            <Button size="sm" variant="secondary" onClick={() => updatePartnerStatus(partner.id, "suspended")}>
                              Suspendre
                            </Button>
                          ) : (
                            <Button size="sm" variant="secondary" onClick={() => updatePartnerStatus(partner.id, "active")}>
                              Réactiver
                            </Button>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => launchPayout(partner.id)} disabled={partner.total_earned <= 0}>
                            Versement
                          </Button>
                          <span className="relative inline-flex">
                            <Button size="sm" variant="secondary" onClick={() => openPartnerChat(partner)}>
                              Chat
                            </Button>
                            {(partner.unread_count ?? 0) > 0 && (
                              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#d9481c] px-1 text-[10px] font-bold text-white">
                                {partner.unread_count}
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {partners.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-sm text-[#8e96a3]">Aucune candidature partenaire pour le moment.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {partnerMeta.total > 0 && (
              <Pagination
                page={partnerMeta.page}
                pages={partnerMeta.pages}
                total={partnerMeta.total}
                pageSize={pageSize}
                onPageChange={(p) => loadPartners(p)}
                onPageSizeChange={(s) => { setPageSize(s); loadPartners(1, s); }}
              />
            )}
          </section>

          {tenantDetails && (
            <section className="mt-5 rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.13em] text-[#c45b1a]">Détail tenant</p>
                  <h2 className="mt-2 text-xl font-bold">{tenantDetails.organization.name}</h2>
                  <p className="mt-1 text-xs text-[#788292]">{tenantDetails.organization.slug} · {tenantDetails.organization.business_type}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setTenantDetails(null)}>Fermer</Button>
              </div>
              <div className="mt-4 grid gap-3 text-xs text-[#596477] sm:grid-cols-2">
                {tenantDetails.organization.contact_email && <p><span className="font-bold text-[#929aa7]">Contact :</span> {tenantDetails.organization.contact_email}</p>}
                {tenantDetails.organization.contact_phone && <p><span className="font-bold text-[#929aa7]">Téléphone :</span> {tenantDetails.organization.contact_phone}</p>}
                {tenantDetails.organization.deposit_phone && <p><span className="font-bold text-[#929aa7]">Numéro de dépôt :</span> {tenantDetails.organization.deposit_phone}</p>}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-5">
                {[
                  ["Agences", tenantDetails.counts.branches],
                  ["Services", tenantDetails.counts.services],
                  ["Utilisateurs", tenantDetails.counts.users],
                  ["Staff", tenantDetails.counts.staff],
                  ["Tickets support", tenantDetails.counts.support_tickets],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#fafaf8] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#929aa7]">{label}</p>
                    <p className="mt-2 text-2xl font-extrabold">{value}</p>
                  </div>
                ))}
              </div>
              {tenantDetails.subscription && (
                <div className="mt-4 rounded-xl border border-[#efefea] p-4 text-sm">
                  <p className="font-bold">Abonnement : {tenantDetails.subscription.plan_name || "—"}</p>
                  <p className="mt-1 text-xs text-[#788292]">
                    Statut {tenantDetails.subscription.status} · quota {tenantDetails.subscription.queue_entries_this_period} / {tenantDetails.subscription.max_queue_entries_per_month || "—"} · échéance {formatDate(tenantDetails.subscription.current_period_end)}
                  </p>
                </div>
              )}
              <div className="mt-5">
                <h3 className="text-sm font-bold">Activité récente</h3>
                <div className="mt-3 divide-y divide-[#efefea] rounded-xl border border-[#efefea]">
                  {tenantDetails.activity_logs.length === 0 ? (
                    <p className="p-4 text-xs text-[#788292]">Aucune activité récente.</p>
                  ) : tenantDetails.activity_logs.map((log: any) => (
                    <div key={log.id} className="p-3">
                      <p className="text-sm font-bold">{log.action}</p>
                      <p className="mt-1 text-xs text-[#788292]">{log.entity_type} · {formatDate(log.created_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
          <Modal isOpen={!!chatPartner} onClose={() => setChatPartner(null)} title={`Chat · ${chatPartner?.full_name || ""}`}>
            <div className="flex max-h-96 min-h-64 flex-col gap-3 overflow-y-auto rounded-xl bg-[#fafaf8] p-4">
              {chatMessages.length === 0 ? (
                <p className="m-auto text-center text-sm text-[#8e96a3]">Aucun message. Répondez au partenaire pour démarrer la discussion.</p>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "superadmin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                      m.sender === "superadmin"
                        ? "rounded-br-sm bg-pine-900 text-paper"
                        : "rounded-bl-sm border border-[#e5e5df] bg-white text-[#172033]"
                    }`}>
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className={`mt-1 text-[10px] font-medium ${m.sender === "superadmin" ? "text-pine-200/70" : "text-[#929aa7]"}`}>
                        {m.sender === "superadmin" ? "Vous" : chatPartner?.full_name || "Partenaire"} ·{" "}
                        {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex items-center gap-3">
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
                placeholder="Répondre au partenaire…"
                className="focus-ring flex-1 resize-none rounded-xl border border-[#deded8] px-4 py-2.5 text-sm"
              />
              <Button size="sm" variant="primary" onClick={sendChatMessage} disabled={sendingMessage || !chatDraft.trim()}>
                {sendingMessage ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </Modal>
        </>
      )}
    </>
  );
}
