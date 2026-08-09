import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Message02Icon, SentIcon, UserAdd01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { Page } from "../components/ui/Pagination";
import { api } from "../utils/api";
import filzIcon from "../assets/filz_icon.png";

type TicketMessage = {
  role: "customer" | "superadmin" | "company" | "support";
  author: string;
  content: string;
  at: string | null;
};

type AdminTicket = {
  id: string;
  organization_id: string | null;
  organization_name: string | null;
  created_by_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  superadmin_reply: string | null;
  assigned_to: string | null;
  created_at: string | null;
  replies: TicketMessage[];
};

function formatTicketId(raw: string): string {
  if (raw.startsWith("SUP-")) return raw;
  const short = raw.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `SUP-${short}`;
}

function formatTime(at: string | null | undefined): string {
  if (!at) return "À l'instant";
  try {
    const d = new Date(at);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    if (sameDay) return `Aujourd'hui, ${hh}:${mm}`;
    if (isYesterday) return `Hier, ${hh}:${mm}`;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${hh}:${mm}`;
  } catch {
    return "À l'instant";
  }
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    technical_support: "Support technique",
    customization: "Personnalisation",
    bug: "Bug",
    billing: "Facturation",
    partnership: "Partenariat",
  };
  return map[cat] || cat || "Divers";
}

function ticketOwner(t: AdminTicket): string {
  if (t.organization_name) return t.organization_name;
  if (t.contact_name) return t.contact_name;
  if (t.contact_email) return t.contact_email;
  return "Entreprise";
}

function priorityLabel(prio?: string): string {
  const map: Record<string, string> = {
    low: "Faible",
    medium: "Normal",
    high: "Élevé",
    urgent: "Urgent",
  };
  return map[prio || ""] || "Normal";
}

function priorityColor(prio?: string): string {
  const map: Record<string, string> = {
    low: "bg-sand text-ink-faint",
    medium: "bg-pine-50 text-pine-700",
    high: "bg-pine-50 text-pine-600",
    urgent: "bg-clay-100 text-clay-500",
  };
  return map[prio || ""] || "bg-pine-50 text-pine-700";
}

function normalizeStatus(s: string): "open" | "in_progress" | "resolved" {
  if (s === "resolved" || s === "closed") return "resolved";
  if (s === "in_progress") return "in_progress";
  return "open";
}

export function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [admins] = useState([
    { id: "1", name: "Admin Principal", online: true },
    { id: "2", name: "Support Team", online: true },
    { id: "3", name: "Tech Lead", online: false },
  ]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get("/superadmin/support-tickets?page_size=100")
      .then((res) => {
        if (cancelled) return;
        const page = res as Page<AdminTicket>;
        const list: AdminTicket[] = page.items ?? [];
        setTickets(list);
        if (!selectedId && list.length > 0) setSelectedId(list[0].id);
      })
      .catch((err) => {
        if (cancelled) setError(err.message || "Erreur lors du chargement des tickets.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0],
    [tickets, selectedId]
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "all" || normalizeStatus(ticket.status) === statusFilter;
      const matchesSearch = searchQuery === "" || 
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.organization_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.contact_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.contact_email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatTicketId(ticket.id).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [tickets, statusFilter, searchQuery]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !message.trim() || sending) return;
    setSending(true);
    try {
      const updated = await api.post(`/superadmin/support-tickets/${selected.id}/reply`, {
        reply: message.trim(),
        status: "in_progress",
      });
      const replyMsg: TicketMessage = {
        role: "support",
        author: "Plateforme",
        content: message.trim(),
        at: new Date().toISOString(),
      };
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, status: "in_progress" as const, replies: [...t.replies, replyMsg] }
            : t
        )
      );
      setMessage("");
      void updated;
    } catch (err: any) {
      setError(err?.message || "Impossible d'envoyer la réponse.");
    } finally {
      setSending(false);
    }
  }

  async function resolve() {
    if (!selected) return;
    setSending(true);
    try {
      const updated = await api.post(`/superadmin/support-tickets/${selected.id}/reply`, {
        reply: selected.superadmin_reply || "Ticket marqué comme résolu.",
        status: "resolved",
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === selected.id ? { ...t, status: "resolved" as const } : t))
      );
      void updated;
    } catch (err: any) {
      setError(err?.message || "Impossible de résoudre le ticket.");
    } finally {
      setSending(false);
    }
  }

  function assignTo(_adminId: string, adminName: string) {
    if (!selected) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selected.id ? { ...t, assigned_to: adminName, status: "in_progress" as const } : t
      )
    );
    setShowAssignDropdown(false);
  }

  return <>
    <div className="mb-6">
      <img src={filzIcon} alt="Filz" className="h-10 w-10" />
    </div>
    <PageHeader
      title="Centre de support"
      description="Centralisez les demandes entreprises, attribuez-les et assurez un suivi jusqu'à résolution."
      action={<Button icon={<HugeiconsIcon icon={Message02Icon} size={18} />}>Nouveau ticket</Button>}
    />
    {error && (
      <div className="mb-4 rounded-xl border border-pine-200 bg-pine-50 p-3 text-xs font-bold text-pine-700">{error}</div>
    )}
    <div className="grid min-h-[570px] gap-5 xl:grid-cols-[300px_minmax(0,1fr)_245px]">
      <aside className="rounded-2xl border border-line bg-white p-3">
        <div className="flex items-center justify-between px-2 py-2">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink-faint">Demandes ouvertes</p>
          <span className="rounded-md bg-pine-50 px-1.5 py-0.5 text-[10px] font-bold text-pine-700">
            {loading ? "…" : filteredTickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length}
          </span>
        </div>
        
        {/* Search Input */}
        <div className="mt-3 px-2">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="input !pl-9 !py-2 text-xs"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="mt-3 flex gap-2 px-2 overflow-x-auto pb-2">
          {[
            { value: "all", label: "Tous" },
            { value: "open", label: "Ouverts" },
            { value: "in_progress", label: "En cours" },
            { value: "resolved", label: "Résolus" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value as any)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${
                statusFilter === filter.value
                  ? "bg-pine-500 text-white"
                  : "bg-sand text-ink-soft hover:bg-sand"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-4 text-xs text-ink-faint">Chargement des tickets…</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-4 text-xs text-ink-faint">Aucun ticket trouvé.</div>
        ) : (
          filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedId(ticket.id)}
              className={`focus-ring mt-1 w-full rounded-xl p-3 text-left ${selected?.id === ticket.id ? "bg-pine-50" : "hover:bg-sand"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-ink-soft">{formatTicketId(ticket.id)}</p>
                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${priorityColor(ticket.priority)}`}>
                    {priorityLabel(ticket.priority)}
                  </span>
                </div>
                <StatusBadge state={normalizeStatus(ticket.status)} />
              </div>
              <p className="mt-2 text-sm font-bold text-ink">{ticket.subject}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {ticketOwner(ticket)} · {categoryLabel(ticket.category)}
              </p>
            </button>
          ))
        )}
      </aside>
      <section className="flex min-h-[520px] flex-col rounded-2xl border border-line bg-white">
        {selected ? (
          <>
            <div className="flex items-start justify-between border-b border-line p-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{selected.subject}</h2>
                  <StatusBadge state={normalizeStatus(selected.status)} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">
                  {formatTicketId(selected.id)} · {ticketOwner(selected)}
                  {selected.contact_email && !selected.organization_name ? ` · ${selected.contact_email}` : ""}
                  {" · "}{categoryLabel(selected.category)}
                </p>
              </div>
              <Button
                onClick={resolve}
                disabled={selected.status === "resolved" || sending}
                variant="secondary"
                icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={17} />}
              >
                Résoudre
              </Button>
            </div>
            <div className="flex-1 space-y-5 p-5 sm:p-6 overflow-y-auto">
              {selected.replies?.length ? (
                selected.replies.map((item, index) => {
                  const isSupport = item.role === "superadmin" || item.role === "support";
                  return (
                    <article
                      key={`${item.at}-${index}-${item.content.slice(0, 10)}`}
                      className={`max-w-[78%] ${isSupport ? "ml-auto" : ""}`}
                    >
                      <p className="mb-1.5 text-[11px] font-bold text-ink-faint">
                        {item.author || (isSupport ? "Plateforme" : "Client")} · {formatTime(item.at ?? selected.created_at)}
                      </p>
                      <div className={`rounded-2xl p-4 text-sm leading-6 ${isSupport ? "rounded-tr-sm bg-pine-50 text-pine-800" : "rounded-tl-sm bg-sand text-ink-soft"}`}>
                        {item.content}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-ink-faint">Aucun message dans cet échange.</p>
              )}
            </div>
            <form onSubmit={send} className="flex gap-3 border-t border-line p-4">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Répondre à l'entreprise…"
                className="input flex-1"
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!message.trim() || sending}
                className="w-11 !px-0"
                aria-label="Envoyer la réponse"
              >
                <HugeiconsIcon icon={SentIcon} size={19} />
              </Button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-6 text-sm text-ink-faint">
            {loading ? "Chargement des tickets…" : "Sélectionnez un ticket à droite."}
          </div>
        )}
      </section>
      <aside className="rounded-2xl border border-line bg-white p-5">
        <p className="text-[10px] font-bold uppercase tracking-[.13em] text-ink-faint">Traitement</p>
        {selected ? (
          <div className="mt-5 space-y-5">
            <div className="relative">
              <p className="text-xs font-semibold text-ink-faint">Attribué à</p>
              <div className="mt-1">
                <button
                  onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                  className="focus-ring flex w-full items-center justify-between rounded-xl border border-line bg-sand px-3 py-2 text-left text-sm font-bold hover:border-pine-500/40"
                >
                  <span>{selected.assigned_to || "Non attribué"}</span>
                  <HugeiconsIcon icon={UserAdd01Icon} size={16} className="text-ink-faint" />
                </button>
                {showAssignDropdown && (
                  <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-xl border border-line bg-white p-2 shadow-lg">
                    {admins.map((admin) => (
                      <button
                        key={admin.id}
                        onClick={() => assignTo(admin.id, admin.name)}
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-sand"
                      >
                        <span className={`h-2 w-2 rounded-full ${admin.online ? "bg-teal-500" : "bg-clay-500"}`} />
                        {admin.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="border-t border-line pt-4">
              <p className="text-xs font-semibold text-ink-faint">Objectif de réponse</p>
              <p className="mt-1 text-sm font-bold">Aujourd'hui, 15:00</p>
            </div>
            <div className="border-t border-line pt-4">
              <p className="text-xs font-semibold text-ink-faint">Entreprise</p>
              <p className="mt-1 text-sm font-bold">{selected.organization_name || "—"}</p>
              <button className="focus-ring mt-2 rounded-md text-xs font-bold text-pine-500">
                Ouvrir sa fiche
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 text-xs text-ink-faint">Chargement…</div>
        )}
      </aside>
    </div>
  </>;
}
