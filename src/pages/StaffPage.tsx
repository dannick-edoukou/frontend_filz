import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, CheckmarkCircle02Icon, PauseCircleIcon, Search01Icon, UserRemove02Icon, VolumeHighIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { BranchServiceSelector } from "../components/ui/BranchServiceSelector";
import { api, getAuthToken } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";

interface ServiceCategory {
  id: string;
  name: string;
  average_service_minutes: number;
}

interface QueueEntry {
  id: string;
  queue_id: string;
  ticket_number: number;
  entry_code: string;
  status: "waiting" | "called" | "serving" | "absent" | "completed";
  is_priority: boolean;
  customer_name: string;
  customer_phone?: string;
  created_at: string;
}

export function StaffPage() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [query, setQuery] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  void loading;
  const { showSuccess, showError } = useToast();

  // Fetch branches on mount
  useEffect(() => {
    let cancelled = false;
    api.get("/organization/branches")
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setSelectedBranchId(data[0].id);
        }
      })
      .catch((err) => showError(getErrorMessage(err, { resource: "agences" })));
    return () => { cancelled = true; };
  }, []);

  // Fetch services when branch changes
  useEffect(() => {
    if (!selectedBranchId) return;
    api.get(`/admin/branches/${selectedBranchId}/services`)
      .then((data) => {
        setServices(data);
        if (data && data.length > 0) {
          setSelectedServiceId(data[0].id);
        } else {
          setSelectedServiceId("");
          setEntries([]);
        }
      })
      .catch((err) => showError(getErrorMessage(err, { resource: "services" })));
  }, [selectedBranchId]);

  // Fetch queue entries when service changes
  const fetchQueue = async () => {
    if (!selectedServiceId) return;
    try {
      const data = await api.get(`/staff/queue?service_category_id=${selectedServiceId}`);
      setEntries(data);
    } catch (err: any) {
      showError(getErrorMessage(err, { resource: "file d'attente" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchQueue();
  }, [selectedServiceId]);

  // Listen to WebSockets for live updates
  useEffect(() => {
    if (!entries || entries.length === 0) return;
    const queueId = entries[0].queue_id;
    const wsUrl = api.getWsUrl(queueId, { token: getAuthToken() ?? "" });
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "update") {
          fetchQueue();
        }
      } catch (e) {
        fetchQueue();
      }
    };

    return () => ws.close();
  }, [selectedServiceId, entries?.[0]?.queue_id]);

  // Audio notification
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.log('Audio play failed:', err);
    }
  };

  // Actions
  const handleCall = async (entryId: string) => {
    try {
      await api.post(`/staff/queue/${entryId}/call`);
      showSuccess("Appel effectué", "Le visiteur a été notifié");
      playNotificationSound();
      fetchQueue();
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "appel du visiteur" }));
    }
  };

  const handleRecall = async (entryId: string) => {
    try {
      await api.post(`/staff/queue/${entryId}/recall`);
      showSuccess("Rappel effectué", "Le visiteur a été notifié");
      playNotificationSound();
      fetchQueue();
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "rappel du visiteur" }));
    }
  };

  const handleServe = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (entry?.status === "called") {
        await api.post(`/staff/queue/${entryId}/serving`);
      }
      await api.post(`/staff/queue/${entryId}/serve`);
      showSuccess("Service terminé", "Le ticket a été marqué comme terminé");
      fetchQueue();
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "validation du service" }));
    }
  };

  const handleAbsent = async (entryId: string) => {
    try {
      await api.post(`/staff/queue/${entryId}/absent`);
      showSuccess("Absent marqué", "Le visiteur a été marqué absent");
      fetchQueue();
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "marquage absent" }));
    }
  };

  const handlePauseToggle = async () => {
    if (!entries || entries.length === 0) return;
    const queueId = entries[0].queue_id;
    try {
      if (isPaused) {
        await api.post(`/staff/queue/${queueId}/resume`);
        setIsPaused(false);
        showSuccess("Service repris", "La file est de nouveau active");
      } else {
        await api.post(`/staff/queue/${queueId}/pause`);
        setIsPaused(true);
        showSuccess("Service en pause", "La file est temporairement suspendue");
      }
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "modification de l'état du service" }));
    }
  };

  const currentServing = entries.find(e => e.status === "called" || e.status === "serving");
  const waiting = entries
    .filter(e => e.status === "waiting")
    .filter(e => `${e.customer_name || ""} ${e.customer_phone || ""} ${e.ticket_number}`.toLowerCase().includes(query.toLowerCase()));
  const calledCount = entries.filter(e => e.status === "called" || e.status === "serving").length;

  const handleCallNext = () => {
    if (waiting[0]) {
      handleCall(waiting[0].id);
    }
  };

  return (
    <>
      <BranchServiceSelector
        selectedBranchId={selectedBranchId}
        selectedServiceId={selectedServiceId}
        onBranchChange={setSelectedBranchId}
        onServiceChange={setSelectedServiceId}
        allowAllServices={false}
        className="mb-6"
      />

      {/* UX hint when branch or service isn't selected yet */}
      {(!selectedBranchId || !selectedServiceId) && (
        <div className="mb-4 rounded-xl border border-pine-200 bg-pine-100 p-3 text-sm font-semibold text-pine-800">Aucune agence ou service sélectionné — la file apparaîtra ici une fois sélectionnée.</div>
      )}

      <div className="mb-5 flex justify-end">
        <label className="relative">
          <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-3 top-2.5 text-ink-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, téléphone, ticket" className="focus-ring h-9 rounded-lg border border-line bg-white pl-8 pr-3 text-xs placeholder:text-ink-faint" />
        </label>
      </div>

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">En attente</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] text-ink">{waiting.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Au guichet</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] text-ink">{calledCount}</p>
        </div>
        <div className="rounded-2xl border border-gold-300 bg-gold-100 p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-700">Action principale</p>
          <Button onClick={handleCallNext} disabled={isPaused || waiting.length === 0} className="mt-3 w-full" icon={<HugeiconsIcon icon={Call02Icon} size={18} />}>
            Appeler suivant
          </Button>
        </div>
      </section>

      <PageHeader
        eyebrow="Console en direct"
        title={`Accueil · ${services.find(s => s.id === selectedServiceId)?.name || "Sélectionner un service"}`}
        description={isPaused ? "Le service est temporairement en pause. Les visiteurs sont informés." : "Les actions réalisées ici sont visibles immédiatement par les visiteurs."}
        action={
          <Button onClick={handlePauseToggle} variant={isPaused ? "primary" : "secondary"} icon={<HugeiconsIcon icon={PauseCircleIcon} size={18} />}>
            {isPaused ? "Reprendre le service" : "Mettre en pause"}
          </Button>
        }
      />


      <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        {/* Left panel: Active serving ticket */}
        <article className="flex min-h-[300px] flex-col justify-between rounded-2xl bg-pine-950 p-6 text-paper sm:p-8">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">Au guichet maintenant</p>
            {currentServing ? (
              <div className="mt-7">
                <p className="font-display text-5xl font-semibold tracking-tight">N°{currentServing.ticket_number}</p>
                <h2 className="mt-3 text-xl font-bold">{currentServing.customer_name}</h2>
                <p className="mt-1 text-sm text-pine-100/70">{currentServing.customer_phone || "Pas de téléphone renseigné"}</p>
              </div>
            ) : (
              <div className="mt-7 text-sm text-pine-100/70">
                Aucun ticket n'est en cours d'appel pour le moment.
              </div>
            )}
          </div>

          {currentServing && (
            <div className="mt-8">
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => handleRecall(currentServing.id)} variant="secondary" className="!border-white/25 !bg-white/10 !text-paper hover:!bg-white/20" icon={<HugeiconsIcon icon={Call02Icon} size={18} />}>
                  Rappeler
                </Button>
                <Button onClick={() => handleServe(currentServing.id)} className="!bg-gold-500 !text-pine-950 hover:!bg-gold-400" icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />}>
                  Terminer
                </Button>
              </div>
              <p className="mt-5 flex items-center gap-2 text-xs text-pine-100/70"><HugeiconsIcon icon={VolumeHighIcon} size={15} />L’annonce sonore est active</p>
            </div>
          )}
        </article>

        {/* Right panel: Next in queue list */}
        <article className="rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">Prochain visiteur</p>
              {waiting.length > 0 ? (
                <>
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">Ticket n°{waiting[0].ticket_number} · {waiting[0].customer_name}</h2>
                  <p className="mt-2 text-sm text-ink-soft">En attente</p>
                </>
              ) : (
                <h2 className="mt-2 font-display text-lg font-semibold tracking-tight text-ink-faint">File vide</h2>
              )}
            </div>
            <StatusBadge state={waiting.length > 0 ? "waiting" : "completed"} />
          </div>

          {waiting.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => handleCall(waiting[0].id)} icon={<HugeiconsIcon icon={Call02Icon} size={18} />}>
                Appeler maintenant
              </Button>
              <Button onClick={() => handleAbsent(waiting[0].id)} variant="secondary" icon={<HugeiconsIcon icon={UserRemove02Icon} size={18} />}>
                Marquer absent
              </Button>
            </div>
          )}

          <div className="mt-7 border-t border-line pt-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Ensuite dans la file</p>
            <div className="mt-3 space-y-2">
              {waiting.slice(1).map((entry, index) => (
                <div key={entry.id} className="flex items-center gap-3 rounded-xl bg-paper p-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white font-mono text-xs font-semibold text-ink-soft">
                    {index + 2}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">{entry.customer_name}</p>
                    <p className="text-xs text-ink-faint">Ticket n°{entry.ticket_number} · {entry.customer_phone || "Pas de téléphone"}</p>
                  </div>
                </div>
              ))}
              {waiting.length <= 1 && (
                <p className="py-4 text-center text-xs text-ink-faint">Aucun autre ticket en attente.</p>
              )}
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
