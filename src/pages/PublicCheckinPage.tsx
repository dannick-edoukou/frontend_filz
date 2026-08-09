import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Clock01Icon, Location01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { LoadingButton } from "../components/ui/LoadingSpinner";
import { api, getOrgSlug } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import filzIcon from "../assets/filz_icon.png";

interface ServiceCategory {
  id: string;
  name: string;
  average_service_minutes: number;
  form_template_id: string | null;
  is_open_now?: boolean;
  opening_time?: string | null;
  closing_time?: string | null;
}

interface FormField {
  id: string;
  label: string;
  key: string;
  field_type: "text" | "textarea" | "select" | "phone" | "number";
  is_required: boolean;
  options?: string[];
}

interface FormTemplate {
  id: string;
  name: string;
  fields: FormField[];
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PublicCheckinPage({ onComplete, onBack }: {onComplete: () => void;onBack: () => void;}) {
  void onBack;
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<any>(null);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dynamicData, setDynamicData] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

	const orgSlug = getOrgSlug();
	const preferredServiceId = new URLSearchParams(window.location.search).get("service");

  useEffect(() => {
    if (!orgSlug) return;
    setLoading(true);
    api.get(`/public/${orgSlug}/checkin`)
      .then((res) => {
        setOrg(res.organization);
        setServices(res.services);
        setTemplates(res.form_templates);
        if (res.services && res.services.length > 0) {
          const preferred = preferredServiceId && res.services.find((service: ServiceCategory) => service.id === preferredServiceId);
          setSelectedServiceId(preferred ? preferred.id : res.services[0].id);
        }
      })
      .catch((err) => {
        showError(getErrorMessage(err, { resource: "informations de l'établissement" }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orgSlug]);

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

  const activeService = services.find(s => s.id === selectedServiceId);
  const activeTemplate = templates.find(t => t.id === activeService?.form_template_id);
  const serviceClosed = activeService?.is_open_now === false;

  const handleDynamicChange = (key: string, value: string) => {
    setDynamicData(prev => ({ ...prev, [key]: value }));
  };

  const createPushSubscription = async (): Promise<string | null> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return null;
    }
    if (Notification.permission === "denied") {
      return null;
    }

    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    const keyRes = await api.get("/public/push/vapid-public-key");
    if (!keyRes?.vapid_public_key) {
      return null;
    }

    const registration = await navigator.serviceWorker.register("/filz-push-sw.js");
    const readyRegistration = await navigator.serviceWorker.ready;
    const existing = await readyRegistration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyRes.vapid_public_key),
    });

    return JSON.stringify(subscription.toJSON());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Extract name and phone from dynamic data if template has these fields, otherwise use state
    let customerName = name;
    let customerPhone = phone;
    
    if (activeTemplate) {
      const nameField = activeTemplate.fields.find(f => f.key === 'name' || f.key === 'customer_name' || f.key === 'nom');
      const phoneField = activeTemplate.fields.find(f => f.key === 'phone' || f.key === 'customer_phone' || f.key === 'telephone');
      
      // Only use dynamic data if the field exists in the template
      if (nameField && dynamicData[nameField.key]) {
        customerName = dynamicData[nameField.key];
      }
      if (phoneField && dynamicData[phoneField.key]) {
        customerPhone = dynamicData[phoneField.key];
      }
    }
    
    if (!customerName) {
      showError("Nom requis", "Veuillez entrer votre nom complet.");
      return;
    }
    if (!consent) {
      showError("Accord requis", "Votre accord est nécessaire pour rejoindre la file.");
      return;
    }

    setIsSubmitting(true);

    try {
      let pushContactValue: string | null = null;
      if (consent) {
        try {
          pushContactValue = await createPushSubscription();
        } catch {
          pushContactValue = null;
        }
      }

      const payload = {
        service_category_id: selectedServiceId,
        customer_name: customerName,
        customer_phone: customerPhone || null,
        is_priority: false,
        form_data: dynamicData,
        notification_consent: consent && pushContactValue ? {
          channel: "web_push",
          contact_value: pushContactValue
        } : null
      };

      const res = await api.post(`/public/${orgSlug}/checkin`, payload);
      
      localStorage.setItem("filz_ticket_code", res.entry_code);
      localStorage.setItem("filz_ticket_number", String(res.ticket_number));
      localStorage.setItem("filz_ticket_position", String(res.position_in_queue));
      localStorage.setItem("filz_ticket_wait", String(res.estimated_wait_minutes));
      localStorage.setItem("filz_ticket_customer", customerName);
      
      showSuccess("Inscription réussie", "Vous avez rejoint la file d'attente");
      onComplete();
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "finaliser l'inscription à la file" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper">
        <div className="flex flex-col items-center gap-4">
          <img src={filzIcon} alt="Filz" className="h-12 w-12 animate-pulse rounded-2xl" />
          <p className="animate-pulse text-sm font-semibold text-ink-soft">Chargement de votre file...</p>
        </div>
      </main>
    );
  }

  return <main className="min-h-screen bg-paper px-4 py-5 sm:py-10"><div className="mx-auto max-w-[480px]"><header className="flex items-center justify-between"><div className="flex items-center gap-2 rounded-xl text-left">{org?.logo_url ? <img src={org.logo_url} alt="" className="h-9 w-9 rounded-xl object-cover" /> : <img src={filzIcon} alt="Filz" className="h-9 w-9 rounded-xl" />}{org?.name && <span className="font-display text-base font-semibold tracking-tight text-ink">{org.name}</span>}</div><span className="rounded-full bg-pine-100 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-pine-800">QR sécurisé</span></header>

    <section className="mt-8 overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
      <div className="bg-pine-950 px-5 pb-11 pt-7 sm:px-7">
        <div className="flex items-center gap-2 text-xs font-semibold text-gold-300"><HugeiconsIcon icon={Location01Icon} size={15} />Accueil principal</div>
        <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-300">Bienvenue</p>
        <h1 className="mt-2 font-display text-[30px] font-semibold leading-[1.08] tracking-[-0.01em] text-white">Rejoignez la file en quelques secondes.</h1>
        <p className="mt-3 text-sm leading-6 text-pine-100/80">Nous vous préviendrons quand votre tour approchera. Pas d'application à télécharger.</p>

        {activeService && (
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-400 text-pine-950"><HugeiconsIcon icon={Clock01Icon} size={17} /></span>
            <p className="text-xs text-pine-100/80">Attente estimée pour ce service : <strong className="font-mono text-gold-300">{activeService.average_service_minutes} min</strong></p>
          </div>
        )}
        {serviceClosed && (
          <div className="mt-3 rounded-xl border border-gold-300/40 bg-gold-100 px-3 py-2.5 text-xs font-bold text-gold-700">
            Ce service est actuellement fermé{activeService?.opening_time && activeService?.closing_time ? ` (${activeService.opening_time} - ${activeService.closing_time})` : ""}.
          </div>
        )}
      </div>

      <div className="relative">
        <div className="border-t-2 border-dashed border-line" />
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Filz · ticket</span>
        <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
        <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-7 pt-7 sm:px-7">
        <Field label="Service souhaité">
          <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="input bg-white">
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        {activeTemplate?.fields.map((field) => (
          <Field key={field.key} label={field.label}>
            {field.field_type === "textarea" ? (
              <textarea required={field.is_required} value={dynamicData[field.key] || ""} onChange={(e) => handleDynamicChange(field.key, e.target.value)} placeholder={`Saisir ${field.label.toLowerCase()}`} className="input min-h-[80px] py-2" />
            ) : field.field_type === "select" ? (
              <select required={field.is_required} value={dynamicData[field.key] || ""} onChange={(e) => handleDynamicChange(field.key, e.target.value)} className="input bg-white">
                <option value="">Sélectionnez une option</option>
                {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <input required={field.is_required} type={field.field_type === "number" ? "number" : field.field_type === "phone" ? "tel" : "text"} value={dynamicData[field.key] || ""} onChange={(e) => handleDynamicChange(field.key, e.target.value)} placeholder={`Saisir ${field.label.toLowerCase()}`} className="input" />
            )}
          </Field>
        ))}

        {!activeTemplate && (
          <>
            <Field label="Votre nom complet">
              <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Aïcha Koné" className="input" />
            </Field>

            <Field label="Votre téléphone">
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex. 07 00 00 00 00" className="input" />
            </Field>
          </>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-paper p-3 text-xs leading-5 text-ink-soft"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold-500" /><span>J’accepte de recevoir les notifications liées à mon passage dans cette file.</span></label>

        <LoadingButton type="submit" disabled={serviceClosed} isLoading={isSubmitting} loadingText="Inscription…" className="mt-2 w-full bg-pine-900 text-white hover:bg-pine-700 shadow-primary" icon={!isSubmitting && <HugeiconsIcon icon={ArrowRight01Icon} size={18} />}>{serviceClosed ? "Service fermé" : "Rejoindre la file"}</LoadingButton>
      </form>
    </section>

    <p className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 text-center text-[11px] leading-5 text-ink-faint"><HugeiconsIcon icon={Shield01Icon} size={14} />Vos données sont utilisées uniquement pour votre prise en charge.</p></div></main>;
}

function Field({ label, children }: {label: string;children: React.ReactNode;}) {return <label className="block text-sm font-semibold text-ink"><span>{label}</span><div className="mt-2">{children}</div></label>;}
