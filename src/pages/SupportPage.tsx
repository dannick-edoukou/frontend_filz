import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message02Icon, SentIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { Page } from "../components/ui/Pagination";
import { api } from "../utils/api";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
  superadmin_reply?: string;
}

export function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  void error;
  
  // New ticket modal state
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical_support");
  const [message, setMessage] = useState("");

  const fetchTickets = async () => {
    try {
      const data = await api.get("/admin/support-tickets?page_size=100") as Page<Ticket>;
      const items = data.items ?? [];
      setTickets(items);
      if (items.length > 0 && !activeTicketId) {
        setActiveTicketId(items[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Erreur de chargement des tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;
    try {
      const newTicket = await api.post("/admin/support-tickets", {
        subject,
        category,
        message
      });
      setSubject("");
      setMessage("");
      setIsCreating(false);
      fetchTickets();
      setActiveTicketId(newTicket.id);
    } catch (err: any) {
      alert("Erreur lors de la création du ticket: " + err.message);
    }
  };

  const activeTicket = tickets.find((t) => t.id === activeTicketId);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Support Fila"
        title="Besoin d’un coup de main ?"
        description="Échangez directement avec l’équipe Fila pour une question, un incident ou une personnalisation."
        action={
          <Button onClick={() => setIsCreating(true)} icon={<HugeiconsIcon icon={Message02Icon} size={18} />}>
            Nouveau ticket
          </Button>
        }
      />

      {isCreating ? (
        <section className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-[#e5e5df]">
          <h2 className="text-lg font-bold mb-4">Créer une demande d'assistance</h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <label className="block text-sm font-semibold text-[#394150]">
              Sujet
              <input required type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex: Problème d'impression QR code" className="input mt-2" />
            </label>
            <label className="block text-sm font-semibold text-[#394150]">
              Catégorie
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input bg-white mt-2">
                <option value="technical_support">Support technique</option>
                <option value="customization">Personnalisation</option>
                <option value="bug">Bug</option>
                <option value="billing">Facturation</option>
                <option value="partnership">Partenariat</option>
              </select>
            </label>
            <label className="block text-sm font-semibold text-[#394150]">
              Description de votre problème
              <textarea required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Expliquez en détail..." className="input min-h-[120px] py-2 mt-2" />
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>Annuler</Button>
              <Button type="submit">Envoyer</Button>
            </div>
          </form>
        </section>
      ) : loading ? (
        <p className="text-center text-sm py-10">Chargement des conversations...</p>
      ) : tickets.length === 0 ? (
        <p className="text-center text-sm py-10 bg-white border border-[#e5e5df] rounded-2xl">Vous n'avez aucun ticket de support en cours.</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[315px_1fr]">
          <aside className="rounded-2xl border border-[#e5e5df] bg-white p-3">
            <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#929aa7]">Vos demandes</p>
            {tickets.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTicketId(item.id)}
                className={`focus-ring mt-1 w-full rounded-xl p-3 text-left ${item.id === activeTicketId ? "bg-[#fff1e5]" : "hover:bg-[#f7f7f5]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#4d5768]">Réf: {item.id.slice(0, 8)}</p>
                  <StatusBadge state={item.status} />
                </div>
                <p className="mt-2 text-sm font-bold text-[#253144] truncate">{item.subject}</p>
                <p className="mt-2 text-xs text-[#788292]">{formatDate(item.updated_at)}</p>
              </button>
            ))}
          </aside>

          {activeTicket && (
            <section className="flex min-h-[490px] flex-col rounded-2xl border border-[#e5e5df] bg-white">
              <div className="flex items-start justify-between border-b border-[#ecece7] p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold">{activeTicket.subject}</h2>
                    <StatusBadge state={activeTicket.status} />
                  </div>
                  <p className="mt-1 text-xs text-[#7b8493]">Réf: {activeTicket.id} · Catégorie: {activeTicket.category}</p>
                </div>
              </div>

              <div className="flex-1 space-y-5 p-5 sm:p-6 overflow-y-auto">
                {/* Initial company ticket message */}
                <article className="max-w-[78%] ml-auto">
                  <p className="mb-1.5 text-[11px] font-bold text-[#788292]">Vous · {formatDate(activeTicket.created_at)}</p>
                  <div className="rounded-2xl p-4 text-sm leading-6 rounded-tr-sm bg-[#fff1e5] text-[#593418]">
                    {activeTicket.message}
                  </div>
                </article>

                {/* Reply if superadmin replied */}
                {activeTicket.superadmin_reply && (
                  <article className="max-w-[78%]">
                    <p className="mb-1.5 text-[11px] font-bold text-[#788292]">Support Fila · {formatDate(activeTicket.updated_at)}</p>
                    <div className="rounded-2xl p-4 text-sm leading-6 rounded-tl-sm bg-[#f3f4f2] text-[#4d5768]">
                      {activeTicket.superadmin_reply}
                    </div>
                  </article>
                )}
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="flex gap-3 border-t border-[#ecece7] p-4 bg-[#fafaf8] rounded-b-2xl">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled
                  placeholder="Les réponses se font au niveau de la création d'un nouveau ticket..."
                  className="focus-ring h-11 flex-1 rounded-xl border border-[#deded8] px-3 text-sm bg-white cursor-not-allowed"
                />
                <Button type="button" disabled className="w-11 !px-0">
                  <HugeiconsIcon icon={SentIcon} size={19} />
                </Button>
              </form>
            </section>
          )}
        </div>
      )}
    </>
  );
}