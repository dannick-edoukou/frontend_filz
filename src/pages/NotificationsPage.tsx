import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Shield01Icon, SmsCodeIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader } from "../components/ui/Ui";
import { api } from "../utils/api";

type NotifChannels = {
  browser_push: boolean;
  sms: boolean;
  whatsapp: boolean;
};

const STORAGE_KEY = "filz_notif_channels_v1";
const MESSAGE_STORAGE_KEY = "filz_notif_call_template_v1";
const DEFAULT_TEMPLATE = "Bonjour {nom}, votre tour approche pour {service}. Merci de revenir vers l’accueil dans les 5 minutes.";

const DEFAULT_CHANNELS: NotifChannels = {
  browser_push: true,
  sms: false,
  whatsapp: false,
};

function loadChannels(): NotifChannels {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CHANNELS;
    return { ...DEFAULT_CHANNELS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CHANNELS;
  }
}

export function NotificationsPage() {
  const [channels, setChannels] = useState<NotifChannels>(() => loadChannels());
  const [callTemplate, setCallTemplate] = useState<string>(() => localStorage.getItem(MESSAGE_STORAGE_KEY) ?? DEFAULT_TEMPLATE);
  const [saved, setSaved] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get("/auth/me").then((res) => {
      if (!cancelled && res?.organization?.name) setOrgName(res.organization.name);
    }).catch(() => void 0);
    return () => { cancelled = true; };
  }, []);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
    localStorage.setItem(MESSAGE_STORAGE_KEY, callTemplate || DEFAULT_TEMPLATE);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return <>
    <PageHeader
      eyebrow="Communication visiteur"
      title="Notifications"
      description="Définissez les messages et canaux utilisés pour tenir les visiteurs informés."
    />
    <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <section className="rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]">
            <HugeiconsIcon icon={Notification01Icon} size={20} />
          </span>
          <div>
            <h2 className="font-bold">Canaux activés</h2>
            <p className="mt-1 text-xs text-[#788292]">
              Le visiteur choisit et accepte les alertes à l’inscription.
              {orgName && <> Organisateur : <strong className="text-[#253144]">{orgName}</strong>.</>}
            </p>
          </div>
        </div>
        <div className="mt-6 divide-y divide-[#efefea] border-y border-[#efefea]">
          {(
            [
              { key: "browser_push", name: "Notification navigateur", sub: "Rapide, sans coût et adapté au QR web" },
              { key: "sms", name: "SMS", sub: "Pour les visiteurs qui ferment la page (configuration fournisseur à prévoir)" },
              { key: "whatsapp", name: "WhatsApp", sub: "Canal optionnel selon vos règles métier (configuration fournisseur à prévoir)" },
            ] as { key: keyof NotifChannels; name: string; sub: string }[]
          ).map((channel) => (
            <label key={channel.key} className="flex cursor-pointer items-center justify-between gap-4 py-4">
              <div>
                <p className="text-sm font-bold">{channel.name}</p>
                <p className="mt-1 text-xs text-[#788292]">{channel.sub}</p>
              </div>
              <input
                type="checkbox"
                checked={channels[channel.key]}
                onChange={(e) => setChannels((prev) => ({ ...prev, [channel.key]: e.target.checked }))}
                className="h-4 w-4 accent-[#e87325]"
              />
            </label>
          ))}
        </div>
        <Button onClick={save} className="mt-5">
          Enregistrer les canaux
        </Button>
        {saved && (
          <p aria-live="polite" className="mt-3 text-xs font-bold text-[#287044]">
            Préférences enregistrées.
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-[#e5e5df] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5fb] text-[#2871a2]">
            <HugeiconsIcon icon={SmsCodeIcon} size={20} />
          </span>
          <div>
            <h2 className="font-bold">Message d’appel</h2>
            <p className="mt-1 text-xs text-[#788292]">Envoyé quand le passage approche.</p>
          </div>
        </div>
        <label className="mt-6 block text-sm font-semibold">
          Modèle du message
          <textarea
            value={callTemplate}
            onChange={(e) => setCallTemplate(e.target.value)}
            className="focus-ring mt-2 min-h-32 w-full rounded-xl border border-[#deded8] p-3 text-sm leading-6"
          />
        </label>
        <div className="mt-5 rounded-xl bg-[#f7f7f5] p-4">
          <div className="flex gap-2 text-xs font-bold text-[#596477]">
            <HugeiconsIcon icon={Shield01Icon} size={16} />
            Consentement enregistré
          </div>
          <p className="mt-2 text-xs leading-5 text-[#788292]">
            Les notifications sont proposées explicitement au visiteur avant son entrée en file.
          </p>
        </div>
      </section>
    </div>
  </>;
}