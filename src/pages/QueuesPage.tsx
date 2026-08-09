import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { BranchServiceSelector } from "../components/ui/BranchServiceSelector";
import { api, getUserRole } from "../utils/api";
import type { Screen } from "../types";

interface QueueEntry {
  id: string;
  ticket_number: number;
  customer_name: string;
  customer_phone?: string;
  created_at: string;
  status: string;
  is_priority: boolean;
  form_data?: Record<string, string>;
  service_name?: string;
}

export function QueuesPage({ onOpenTicket, onNavigate }: {onOpenTicket: (id: string) => void; onNavigate?: (screen: Screen) => void;}) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userRole = getUserRole();

  // Load queue entries when service or branch changes
  const fetchQueue = () => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const endpoint = selectedServiceId
      ? `/staff/queue?service_category_id=${selectedServiceId}`
      : `/staff/queue?branch_id=${selectedBranchId}`;

    api.get(endpoint)
      .then((data) => {
        setEntries(data);
        setError(null);
      })
      .catch(() => setError("Erreur de chargement de la file."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueue();
  }, [selectedServiceId, selectedBranchId]);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  const filtered = entries.filter((entry) => 
    `${entry.customer_name} ${entry.ticket_number}`.toLowerCase().includes(query.toLowerCase())
  );

  const renderFormData = (formData: any) => {
    if (!formData) return null;
    let dataObj = formData;
    if (typeof formData === "string") {
      try {
        dataObj = JSON.parse(formData);
      } catch (e) {
        return null;
      }
    }
    if (typeof dataObj !== "object" || dataObj === null) return null;
    const entries = Object.entries(dataObj);
    if (entries.length === 0) return null;

    return (
      <>
        <span className="text-line">|</span>
        <div className="flex flex-wrap gap-1">
          {entries.map(([key, val]) => (
            <span key={key} className="rounded border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] font-medium text-ink-soft">
              <strong className="capitalize text-ink">{key.replace(/_/g, " ")}:</strong> {String(val)}
            </span>
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      <BranchServiceSelector
        selectedBranchId={selectedBranchId}
        selectedServiceId={selectedServiceId}
        onBranchChange={setSelectedBranchId}
        onServiceChange={setSelectedServiceId}
        allowAllServices={true}
        className="mb-6"
      />

      {/* Helpful UX when no branch/service selected */}
      {(!selectedBranchId && !selectedServiceId) && (
        <div className="mb-4 rounded-xl border border-gold-300/60 bg-gold-100 p-4 text-sm font-semibold text-gold-700">Sélectionnez une agence ou un service pour afficher la file d'attente.</div>
      )}


      <PageHeader 
        eyebrow="Opérations" 
        title="Files d’attente" 
        description="Suivez les visiteurs de tous vos services en temps réel." 
        action={(userRole === "admin" || userRole === "company_admin") && onNavigate && (
          <Button 
            onClick={() => onNavigate("staff")} 
            variant="secondary" 
            icon={<HugeiconsIcon icon={UserGroupIcon} size={18} />}
          >
            Mode staff
          </Button>
        )}
      />

      {error && <div className="mb-4 rounded-xl border border-clay-300/60 bg-clay-100 p-4 text-xs font-semibold text-clay-700">{error}</div>}

      <section className="rounded-2xl border border-line bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-2 overflow-x-auto">
            <button className="rounded-lg bg-pine-900 px-3 py-2 font-mono text-xs font-semibold text-white">Toutes <span className="ml-1 opacity-70">{filtered.length}</span></button>
          </div>
          <label className="relative block">
            <HugeiconsIcon icon={Search01Icon} size={17} className="absolute left-3 top-2.5 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un ticket" className="focus-ring h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-xs placeholder:text-ink-faint sm:w-52" />
          </label>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-ink-soft">Chargement de la file...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">Aucun visiteur dans cette file d'attente.</p>
        ) : (
          <div className="overflow-x-auto app-scrollbar">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-paper">
                <tr className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-4 py-3">Visiteur</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Arrivée</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-t border-line text-sm">
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-ink">N°{entry.ticket_number}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-ink">{entry.customer_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
                        <span>{entry.customer_phone || "Pas de téléphone"}</span>
                        {renderFormData(entry.form_data)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-ink-soft">
                      {entry.service_name || "Service"}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-ink-soft">{formatDate(entry.created_at)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge state={entry.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => onOpenTicket(entry.id)} className="focus-ring rounded-lg px-3 py-1.5 text-xs font-bold text-gold-700 hover:bg-gold-100">Détails</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
