import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Clock01Icon, Note01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { api } from "../utils/api";

interface TicketDetail {
  id: string;
  queue_id: string;
  ticket_number: number;
  entry_code: string;
  status: "waiting" | "preparing" | "called" | "serving" | "served" | "absent" | "cancelled";
  is_priority: boolean;
  customer_name: string;
  customer_phone?: string;
  created_at: string;
  form_data?: Record<string, string>;
  branch_id?: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  branch_id: string;
}

export function TicketDetailPage({ ticketId, onBack }: { ticketId?: string | null; onBack: () => void; }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const data = await api.get(`/staff/queue/${ticketId}`);
      setTicket(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement du ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const addNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;
    setNotes([...notes, note]);
    setNote("");
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Audio play failed:', err);
    }
  };

  const handleAction = async (action: "preparing" | "call" | "recall" | "serving" | "serve" | "absent") => {
    if (!ticketId) return;
    setActionLoading(true);
    try {
      await api.post(`/staff/queue/${ticketId}/${action}`);
      if (action === "call" || action === "recall") {
        playNotificationSound();
      }
      await fetchTicket();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!ticket) return;
    try {
      // Get all branches first, then services for the current branch
      const branches = await api.get("/organization/branches");
      if (branches.length === 0) {
        alert("Aucune agence trouvée");
        return;
      }
      // Use the first branch (or we could determine the correct branch from the ticket)
      const branchId = branches[0].id;
      const data = await api.get(`/admin/branches/${branchId}/services`);
      setServices(data);
      setShowTransferModal(true);
    } catch (err: any) {
      alert("Erreur lors du chargement des services: " + err.message);
    }
  };

  const executeTransfer = async () => {
    if (!ticketId || !selectedServiceId) return;
    setActionLoading(true);
    try {
      await api.post(`/staff/queue/${ticketId}/transfer`, { target_service_id: selectedServiceId });
      setShowTransferModal(false);
      await fetchTicket();
      setShowSuccessModal(true);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || "Erreur lors du transfert";
      alert("Erreur: " + errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (!ticketId) return <div className="p-10 text-center">Aucun ticket sélectionné.</div>;
  if (loading) return <div className="p-10 text-center">Chargement...</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;
  if (!ticket) return null;

  return (
    <>
      <PageHeader 
        eyebrow="File d’attente" 
        title={`Ticket N°${ticket.ticket_number}`} 
        description="Détail du passage et informations collectées à l’entrée." 
        action={<Button onClick={onBack} variant="secondary" icon={<HugeiconsIcon icon={ArrowLeft01Icon} size={17} />}>Retour aux files</Button>} 
      />
      <div className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <section className="rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#c45b1a]">Visiteur</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-.04em]">{ticket.customer_name}</h2>
              <p className="mt-1 text-sm text-[#687385]">{ticket.customer_phone || "Pas de téléphone fourni"}</p>
            </div>
            <StatusBadge state={ticket.status} />
          </div>
          <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-[#efefea] py-5">
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold text-[#788292]"><HugeiconsIcon icon={UserGroupIcon} size={16} />Priorité</dt>
              <dd className="mt-2 text-xl font-bold">{ticket.is_priority ? "Prioritaire" : "Normale"}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold text-[#788292]"><HugeiconsIcon icon={Clock01Icon} size={16} />Arrivée</dt>
              <dd className="mt-2 text-xl font-bold">
                {new Date(ticket.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <h3 className="text-sm font-bold">Informations d’entrée</h3>
            <dl className="mt-3 divide-y divide-[#efefea] text-sm">
              {ticket.form_data && Object.keys(ticket.form_data).length > 0 ? (
                Object.entries(ticket.form_data)
                  .map(([key, value]) => (
                    <Info key={key} label={key} value={String(value)} />
                  ))
              ) : (
                <p className="py-3 text-[#788292]">Aucune information supplémentaire fournie.</p>
              )}
            </dl>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {ticket.status === "waiting" && (
              <>
                <Button disabled={actionLoading} variant="secondary" onClick={() => handleAction("preparing")}>Prendre en charge</Button>
                <Button disabled={actionLoading} onClick={() => handleAction("call")}>Appeler</Button>
              </>
            )}
            {ticket.status === "preparing" && (
              <Button disabled={actionLoading} onClick={() => handleAction("call")}>Appeler au guichet</Button>
            )}
            {ticket.status === "called" && (
              <Button disabled={actionLoading} onClick={() => handleAction("recall")}>Rappeler</Button>
            )}
            {(ticket.status === "called" || ticket.status === "serving") && (
              <Button disabled={actionLoading} variant="secondary" onClick={() => handleAction("serving")}>Servir</Button>
            )}
            {ticket.status === "serving" && (
              <Button disabled={actionLoading} onClick={() => handleAction("serve")}>Terminer</Button>
            )}
            <Button disabled={actionLoading} variant="secondary" onClick={handleTransfer}>Transférer</Button>
            {(ticket.status !== "served" && ticket.status !== "absent") && (
              <Button disabled={actionLoading} variant="danger" onClick={() => handleAction("absent")}>Marquer absent</Button>
            )}
          </div>
        </section>

        <section className="flex min-h-[430px] flex-col rounded-2xl border border-[#e5e5df] bg-white">
          <div className="flex items-center gap-3 border-b border-[#ecece7] p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]">
              <HugeiconsIcon icon={Note01Icon} size={19} />
            </span>
            <div>
              <h2 className="font-bold">Notes internes</h2>
              <p className="text-xs text-[#788292]">Non visibles par le visiteur.</p>
            </div>
          </div>
          <div className="flex-1 space-y-3 p-5">
            {notes.map((item, index) => (
              <article key={`${item}-${index}`} className="rounded-xl bg-[#fafaf8] p-4">
                <p className="text-sm leading-6 text-[#4d5768]">{item}</p>
                <p className="mt-2 text-[11px] font-semibold text-[#929aa7]">Équipe · à l’instant</p>
              </article>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-[#788292] text-center pt-10">Aucune note pour le moment.</p>
            )}
          </div>
          <form onSubmit={addNote} className="border-t border-[#ecece7] p-4">
            <label className="sr-only" htmlFor="ticket-note">Ajouter une note</label>
            <div className="flex gap-3">
              <input id="ticket-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note interne…" className="input flex-1" />
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </section>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-white p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Transférer le ticket</h2>
            <p className="text-sm text-gray-600 mb-4">Sélectionnez le service vers lequel transférer ce ticket:</p>
            <select 
              value={selectedServiceId} 
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            >
              <option value="">-- Sélectionner un service --</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowTransferModal(false)}
                disabled={actionLoading}
              >
                Annuler
              </Button>
              <Button 
                onClick={executeTransfer}
                disabled={actionLoading || !selectedServiceId}
              >
                {actionLoading ? "Transfert en cours..." : "Transférer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-white p-6 w-full max-w-md mx-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Transfert réussi</h2>
            <p className="text-sm text-gray-600 mb-6">Le ticket a été transféré avec succès vers le nouveau service.</p>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: {label: string;value: string;}) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-[#788292] capitalize">{label.replace(/_/g, " ")}</dt>
      <dd className="font-semibold text-right">{value}</dd>
    </div>
  );
}