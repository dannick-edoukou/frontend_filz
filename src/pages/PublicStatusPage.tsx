import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Clock01Icon, QrCodeIcon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api, getOrgSlug } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import filzIcon from "../assets/filz_icon.png";

export function PublicStatusPage({ onBack }: {onBack: () => void;}) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  const playClientNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playTone(523.25, now, 0.4);      // Do5
      playTone(659.25, now + 0.15, 0.5); // Mi5
      
      if ("vibrate" in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      console.log("Échec audio/vibration :", err);
    }
  };

  useEffect(() => {
    if (status?.status) {
      if (prevStatus && prevStatus !== status.status) {
        if (["preparing", "called", "serving"].includes(status.status)) {
          playClientNotificationSound();
        }
      }
      setPrevStatus(status.status);
    }
  }, [status?.status]);

  const entryCode = localStorage.getItem("filz_ticket_code");
  const orgSlug = getOrgSlug();
  const customerName = localStorage.getItem("filz_ticket_customer") || "Client";

  const fetchStatus = async () => {
    if (!entryCode || !orgSlug) {
      if (!entryCode) showError("Ticket introuvable", "Aucun ticket actif trouvé.");
      if (!orgSlug) showError("Établissement introuvable", "Aucun établissement identifié.");
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/public/${orgSlug}/queue-status/${entryCode}`);
      setStatus(res);
    } catch (err: any) {
      // Handle ticket expiration (410 Gone)
      if (err.response?.status === 410) {
        showError("Ticket expiré", "Ce ticket a expiré après 30 minutes. Veuillez contacter l'accueil.");
        localStorage.removeItem("filz_ticket_code");
        localStorage.removeItem("filz_ticket_number");
        localStorage.removeItem("filz_ticket_customer");
        setStatus(null);
      } else {
        showError(getErrorMessage(err, { resource: "statut du ticket" }));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Setup polling as a backup
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [entryCode, orgSlug]);

  useEffect(() => {
    if (!status?.queue_id) return;

    // Connect WebSocket for instant updates
    const wsUrl = api.getWsUrl(status.queue_id);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "update") {
          fetchStatus();
        }
      } catch (e) {
        // Quietly fail or fetch anyway
        fetchStatus();
      }
    };

    ws.onerror = () => {
      console.warn("WebSocket error, falling back to REST polling.");
    };

    return () => {
      ws.close();
    };
  }, [status?.queue_id]);

  if (!orgSlug) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper">
        <div className="px-4 text-center">
          <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
          <p className="mt-4 text-sm font-semibold text-clay-500">Erreur : aucun établissement identifié.</p>
          <p className="mt-2 text-xs text-ink-soft">Veuillez scanner un QR code valide à l'accueil.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <main className="grid min-h-screen place-items-center bg-paper"><p className="animate-pulse text-sm font-semibold text-ink-soft">Chargement de votre ticket...</p></main>;
  }

  if (!status) {
    return (
      <main className="min-h-screen bg-paper px-4 py-10">
        <div className="mx-auto max-w-[480px] text-center">
          <div className="mb-6 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-clay-100">
              <HugeiconsIcon icon={AlertCircleIcon} size={32} className="text-clay-500" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-clay-700">Ticket expiré</h1>
          <p className="mt-3 text-sm text-ink-soft">Ce ticket a expiré après 30 minutes. Veuillez contacter l'accueil pour un nouveau ticket.</p>
          <Button className="mt-6 w-full" onClick={onBack}>Retour à l'accueil</Button>
        </div>
      </main>
    );
  }

  const isPreparing = status.status === "preparing";
  const isCalled = status.status === "called";
  const isServing = status.status === "serving";
  const isWaiting = status.status === "waiting";
  const isAbsent = status.status === "absent";
  const isServed = status.status === "served";
  const isCancelled = status.status === "cancelled";
  const canCancel = isWaiting || isPreparing || isCalled;

  const chip = isCalled ? "bg-gold-100 text-gold-700 animate-pulse" :
    isPreparing ? "bg-pine-100 text-pine-800 animate-pulse" :
    isServing ? "bg-pine-100 text-pine-800" :
    isServed ? "bg-pine-100 text-pine-800" :
    isCancelled ? "bg-sand text-ink-soft" :
    isAbsent ? "bg-clay-100 text-clay-700" :
    "bg-pine-100 text-pine-800";

  const chipText = isCalled ? "C'est votre tour !" :
    isPreparing ? "En cours de préparation" :
    isServing ? "En cours de traitement" :
    isServed ? "Service terminé" :
    isCancelled ? "Annulé" :
    isAbsent ? "Marqué absent" :
    "Dans la file";

  const cancelTicket = async () => {
    if (!entryCode) return;
    try {
      const res = await api.post(`/public/${orgSlug}/queue-status/${entryCode}/cancel`);
      setStatus(res);
      showSuccess("Place annulée", "Vous avez quitté la file d’attente.");
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "annulation du ticket" }));
    }
  };

  return <main className="min-h-screen bg-paper px-4 py-5 sm:py-10"><div className="mx-auto max-w-[480px]"><header className="flex items-center justify-between"><button onClick={onBack} className="focus-ring flex items-center gap-2 rounded-xl text-left"><img src={filzIcon} alt="Filz" className="h-9 w-9 rounded-xl" /></button>
    <span className={`rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${chip}`}>{chipText}</span>
  </header><section className="mt-8 overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
    <div className="p-6 text-center sm:p-8">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900"><HugeiconsIcon icon={QrCodeIcon} size={26} /></span>
      <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-ink-faint">Ticket numéro</p>
      <h1 className="mt-1 font-display text-6xl font-semibold leading-none tracking-tight text-ink">{status.ticket_number}</h1>
      <p className="mt-4 text-sm text-ink-soft">Bonjour {customerName}, {
        isCalled ? "Présentez-vous au guichet immédiatement." :
        isPreparing ? "votre demande vient d'etre pris en charge par un agent." :
        isServing ? "Vous êtes actuellement en train d'être servi." :
        isServed ? "Merci de votre visite !" :
        isCancelled ? "Votre place dans la file a été annulée." :
        isAbsent ? "Vous n'avez pas répondu à l'appel. Veuillez vous adresser au personnel." :
        "vous êtes bien enregistré dans la file d'attente."
      }</p>

      <div className="relative mt-6">
        <div className="border-t-2 border-dashed border-line" />
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Filz · ticket</span>
      </div>

      {(isWaiting || isPreparing) && (
        <div className="mt-6 grid grid-cols-2 divide-x divide-line border-y border-line">
          <div className="py-4">
            <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-ink">{String(status.people_ahead).padStart(2, '0')}</p>
            <p className="mt-1 text-[11px] text-ink-faint">personnes devant vous</p>
          </div>
          <div className="py-4">
            <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-ink">{status.estimated_wait_minutes}<span className="text-xl"> min</span></p>
            <p className="mt-1 text-[11px] text-ink-faint">temps estimé</p>
          </div>
        </div>
      )}
    </div>

    <div className="px-6 pb-6 sm:px-8 sm:pb-8">
      {isPreparing && (
        <div className="mb-4 rounded-2xl border-2 border-pine-200 bg-pine-50 p-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} size={24} className="animate-spin text-gold-600" />
            <p className="font-display text-lg font-semibold text-pine-900">Préparation en cours</p>
          </div>
          <p className="text-sm font-semibold text-pine-800">Un agent prépare votre accueil. Veuillez rester attentif.</p>
        </div>
      )}

      {isCalled && (
        <div className="mb-4 overflow-hidden rounded-2xl border-2 border-gold-300 bg-gold-100 p-6 text-center">
          <p className="font-display text-xl font-semibold text-gold-700">C'est votre tour !</p>
          <p className="mt-1 text-sm font-semibold text-gold-700">Présentez-vous immédiatement à l'accueil</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-2 w-2 animate-bounce rounded-full bg-gold-500" style={{ animationDelay: '0s' }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-gold-500" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-gold-500" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

      {(isWaiting || isPreparing) && (
        <div className="mt-5 flex items-center justify-center gap-2.5 rounded-full border border-line bg-white px-4 py-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-pine-500" />
          </span>
          <p className="text-xs font-medium text-ink-soft">Suivi en temps réel — gardez cette page ouverte</p>
        </div>
      )}
      <Button variant="secondary" className="mt-5 w-full" onClick={onBack}>Retour à l'accueil</Button>
      {canCancel && (
        <Button variant="danger" className="mt-3 w-full" onClick={cancelTicket}>Quitter la file</Button>
      )}
    </div>
  </section><p className="mt-5 text-center text-xs text-ink-faint">Besoin d'aide sur place ? Adressez-vous à l'accueil.</p></div></main>;
}
