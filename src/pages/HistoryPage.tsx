import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { Page, Pagination } from "../components/ui/Pagination";
import { API_BASE, api, getAuthToken } from "../utils/api";

interface Branch {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface QueueEntry {
  id: string;
  ticket_number: number;
  entry_code: string;
  customer_name: string;
  customer_phone?: string;
  created_at: string;
  called_at?: string;
  served_at?: string;
  status: string;
  is_priority: boolean;
  actual_wait_seconds?: number;
  actual_service_seconds?: number;
}

export function HistoryPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const [historyMeta, setHistoryMeta] = useState({ total: 0, page: 1, pages: 0 });
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Load branches
  useEffect(() => {
    let cancelled = false;
    api.get("/organization/branches")
      .then((data) => {
        if (cancelled) return;
        setBranches(data);
        if (data && data.length > 0) {
          setSelectedBranchId(data[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Erreur de chargement des agences.");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Load services when branch changes
  useEffect(() => {
    let cancelled = false;
    if (!selectedBranchId) return;
    api.get(`/admin/branches/${selectedBranchId}/services`)
      .then((data) => {
        if (cancelled) return;
        setServices(data);
        if (data && data.length > 0) {
          setSelectedServiceId(data[0].id);
        } else {
          setServices([]);
          setSelectedServiceId("");
          setEntries([]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError("Erreur de chargement des services.");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedBranchId]);

  // Load history entries when service or branch changes
  const fetchHistory = (page = 1, size = pageSize) => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: String(size) });
    if (selectedServiceId) {
      params.set("service_category_id", selectedServiceId);
    } else {
      params.set("branch_id", selectedBranchId);
    }
    if (query.trim()) params.set("q", query.trim());

    api.get(`/admin/history?${params.toString()}`)
      .then((data) => {
        const res = data as Page<QueueEntry>;
        setEntries(res.items ?? []);
        setHistoryMeta({ total: res.total ?? 0, page: res.page ?? 1, pages: res.pages ?? 0 });
        setError(null);
      })
      .catch(() => setError("Erreur de chargement de l'historique."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId, selectedBranchId]);

  useEffect(() => {
    const t = setTimeout(() => fetchHistory(1), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  const exportCsv = async () => {
    setShowExportModal(true);
  };

  const confirmExport = async () => {
    setExporting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE}/admin/history/export.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `history-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => {
        setShowExportModal(false);
        setExportSuccess(false);
      }, 2000);
    } catch (err) {
      alert("Erreur lors de l'export CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-line">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-ink-soft uppercase">Agence</label>
          <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} className="bg-white border border-line px-3 py-1.5 rounded-lg text-xs font-semibold">
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-ink-soft uppercase">Service</label>
          <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="bg-white border border-line px-3 py-1.5 rounded-lg text-xs font-semibold">
            <option value="">Tous les services</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <PageHeader 
        eyebrow="Données" 
        title="Historique" 
        description="Consultez l'historique complet de tous les tickets et exportez les données." 
        action={<Button onClick={exportCsv} variant="secondary" icon={<HugeiconsIcon icon={Download01Icon} size={18} />}>Exporter CSV</Button>} 
      />

      {error && <div className="p-4 mb-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}

      <section className="rounded-2xl border border-line bg-white">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex gap-2 overflow-x-auto">
            <button className="rounded-lg bg-pine-950 px-3 py-2 text-xs font-bold text-white">Total <span className="ml-1 opacity-70">{historyMeta.total}</span></button>
          </div>
          <label className="relative block">
            <HugeiconsIcon icon={Search01Icon} size={17} className="absolute left-3 top-2.5 text-ink-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un ticket" className="focus-ring h-9 w-full rounded-lg border border-line pl-9 pr-3 text-xs sm:w-52" />
          </label>
        </div>

        {loading ? (
          <p className="text-center text-sm py-10">Chargement de l'historique...</p>
        ) : entries.length === 0 ? (
          <p className="text-center text-sm py-10">Aucune donnée historique disponible.</p>
        ) : (
          <div className="overflow-x-auto app-scrollbar">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-sand">
                <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-faint">
                  <th className="px-5 py-3">Ticket</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Visiteur</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Date création</th>
                  <th className="px-4 py-3">Appelé à</th>
                  <th className="px-4 py-3">Servi à</th>
                  <th className="px-4 py-3">Attente (min)</th>
                  <th className="px-4 py-3">Service (min)</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-line text-sm">
                    <td className="px-5 py-4 font-bold">N°{entry.ticket_number}</td>
                    <td className="px-4 py-4 font-mono text-xs">{entry.entry_code}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{entry.customer_name}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">{entry.customer_phone || "Pas de téléphone"}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-ink-soft">
                      {services.find(s => s.id === selectedServiceId)?.name || "Service"}
                    </td>
                    <td className="px-4 py-4 text-xs text-ink-soft">{formatDate(entry.created_at)}</td>
                    <td className="px-4 py-4 text-xs text-ink-soft">{entry.called_at ? formatDate(entry.called_at) : "—"}</td>
                    <td className="px-4 py-4 text-xs text-ink-soft">{entry.served_at ? formatDate(entry.served_at) : "—"}</td>
                    <td className="px-4 py-4 text-xs text-ink-soft">{entry.actual_wait_seconds ? Math.round(entry.actual_wait_seconds / 60) : "—"}</td>
                    <td className="px-4 py-4 text-xs text-ink-soft">{entry.actual_service_seconds ? Math.round(entry.actual_service_seconds / 60) : "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge state={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && historyMeta.total > 0 && (
          <Pagination
            page={historyMeta.page}
            pages={historyMeta.pages}
            total={historyMeta.total}
            pageSize={pageSize}
            onPageChange={(p) => fetchHistory(p)}
            onPageSizeChange={(s) => { setPageSize(s); fetchHistory(1, s); }}
          />
        )}
      </section>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-2xl bg-white p-6 w-full max-w-md mx-4">
            {exportSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Export réussi</h2>
                <p className="text-sm text-gray-600 mb-6">Le fichier CSV a été téléchargé avec succès.</p>
                <Button 
                  onClick={() => setShowExportModal(false)}
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2">Exporter l'historique</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Vous êtes sur le point d'exporter l'historique complet au format CSV.
                  {selectedServiceId && ` Service: ${services.find(s => s.id === selectedServiceId)?.name}`}
                  {historyMeta.total > 0 && ` (${historyMeta.total} entrées)`}
                </p>
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowExportModal(false)}
                    disabled={exporting}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={confirmExport}
                    disabled={exporting}
                  >
                    {exporting ? "Export en cours..." : "Confirmer l'export"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
