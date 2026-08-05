import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon, Clock01Icon, UserGroupIcon, UserMultipleIcon } from "@hugeicons/core-free-icons";
import { Button, MetricCard, SmallLink } from "../components/ui/Ui";
import { Screen } from "../types";
import { api, getOrgSlug, API_BASE } from "../utils/api";

export function DashboardPage({ onNavigate }: {onNavigate: (screen: Screen) => void;}) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const loadStats = async (selectedDays: number = days) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/admin/dashboard?days=${selectedDays}`);
      setStats(data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || "Erreur de connexion au serveur";
      setError(`Impossible de charger les statistiques: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(days);
  }, [days]);

  const [showQr, setShowQr] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const orgSlug = getOrgSlug();
  const checkinUrl = `${window.location.origin}/?screen=checkin&slug=${orgSlug}`;
  
  const generateQrCode = async () => {
    setQrLoading(true);
    try {
      const token = localStorage.getItem("filz_token");
      const response = await fetch(`${API_BASE}/admin/qr-code?url=${encodeURIComponent(checkinUrl)}`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur génération QR');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setQrDataUrl(url);
    } catch (err) {
      console.error('Erreur génération QR:', err);
      // Fallback to external API if backend fails
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkinUrl)}`);
    } finally {
      setQrLoading(false);
    }
  };
  
  useEffect(() => {
    if (showQr && !qrDataUrl) {
      generateQrCode();
    }
  }, [showQr]);

  const totalEntries = stats?.total_entries ?? 0;
  const servedCount = stats?.served_entries ?? 0;
  const absentCount = stats?.absent_entries ?? 0;
  const avgWait = stats?.average_wait_minutes ?? 0;
  
  // Calculate absence rate safely
  const absenceRate = totalEntries > 0 ? ((absentCount / totalEntries) * 100).toFixed(1) + "%" : "0%";

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <select 
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-[#e5e5df] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c45b1a]"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
          </select>
          <Button onClick={() => loadStats(days)} variant="secondary">Rafraîchir</Button>
          <Button onClick={() => setShowQr(true)} variant="secondary">Code QR</Button>
        </div>
        <Button onClick={() => onNavigate("checkin")}>Check-in</Button>
      </div>
      
      {showQr && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/30 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.13em] text-[#c45b1a]">QR public</p>
                <h2 className="mt-2 text-xl font-bold">Code QR Général</h2>
              </div>
              <button onClick={() => setShowQr(false)} className="focus-ring text-sm font-bold text-[#667085]">Fermer</button>
            </div>
            
            <div className="mx-auto mt-6 flex justify-center bg-white p-3 border border-[#e5e5df] rounded-xl">
              {qrLoading ? (
                <div className="w-64 h-64 flex items-center justify-center text-sm text-[#667085]">
                  Génération du QR...
                </div>
              ) : (
                <img src={qrDataUrl || ''} alt="Code QR Général" className="w-64 h-64" />
              )}
            </div>
            
            <p className="mt-5 text-center text-xs leading-5 text-[#667085]">
              Imprimez et affichez ce code QR général à l'entrée. Les clients le scannent et pourront choisir eux-mêmes le service qu'ils désirent.
            </p>
            <a href={qrDataUrl || ''} download={`General-QR-${orgSlug}.png`} target="_blank" rel="noopener noreferrer">
              <Button className="mt-5 w-full" disabled={qrLoading}>Télécharger le QR</Button>
            </a>
          </div>
        </div>
      )}

      
      {error && <div className="p-4 mb-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}

      {loading ? (
        <p className="text-center text-sm py-10">Chargement des données du tableau de bord...</p>
      ) : (
        <>
          <section aria-label="Indicateurs clés" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Inscriptions" value={String(totalEntries)} helper="Inscriptions totales reçues" tone="orange" icon={<HugeiconsIcon icon={UserGroupIcon} size={19} />} />
            <MetricCard label="Attente moyenne" value={`${avgWait} min`} helper="Temps moyen d'attente estimé" tone="blue" icon={<HugeiconsIcon icon={Clock01Icon} size={19} />} />
            <MetricCard label="Servis (7j)" value={String(servedCount)} helper="Visiteurs traités avec succès" tone="green" icon={<HugeiconsIcon icon={UserMultipleIcon} size={19} />} />
            <MetricCard label="Taux d’absences" value={absenceRate} helper="Clients marqués absents" tone="charcoal" icon={<HugeiconsIcon icon={ArrowUpRight01Icon} size={19} />} />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.42fr_.78fr]">
            <article className="rounded-2xl border border-[#e6e6e0] bg-[#173f3a] p-5 text-white sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-[#eab17f]">Point d’attention</p>
              <h2 className="mt-4 text-xl font-bold leading-7 tracking-[-.04em]">Le dashboard est connecté à votre base de données.</h2>
              <p className="mt-3 text-sm leading-6 text-[#cae0db]">
                Les chiffres ci-dessus reflètent les passages réels en file d'attente. Vos équipes peuvent gérer les clients depuis la console staff.
              </p>
              <Button onClick={() => onNavigate("staff")} variant="secondary" className="mt-6 !border-white/25 !bg-white/10 !text-white hover:!bg-white/20">
                Ouvrir la console staff
              </Button>
            </article>

            <article className="rounded-2xl border border-[#e6e6e0] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">Services actifs</h2>
                <button onClick={() => onNavigate("services")}><SmallLink>Gérer</SmallLink></button>
              </div>
              <div className="mt-4 space-y-2">
                {stats?.by_service?.map((service: any) => (
                  <div key={service.service_id} className="flex items-center justify-between rounded-xl px-2 py-3 bg-[#fafaf8]">
                    <div>
                      <p className="text-sm font-semibold">{service.service_name}</p>
                      <p className="mt-1 text-xs text-[#788292]">{service.total_entries} visites au total</p>
                    </div>
                  </div>
                ))}
                {(!stats?.by_service || stats.by_service.length === 0) && (
                  <p className="text-xs text-[#8e96a3] text-center py-4">Aucune donnée par service.</p>
                )}
              </div>
            </article>
          </section>
        </>
      )}
    </>
  );
}