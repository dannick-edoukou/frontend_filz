import { useState, Fragment } from "react";
import QRCode from "react-qr-code";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Building02Icon, CheckmarkCircle02Icon, QrCodeIcon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api, getOrgSlug } from "../utils/api";

const steps = ["Établissement", "Service", "QR public"];

export function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: Branch & Sector info
  const [branchName, setBranchName] = useState("Site Principal");
  const [sector, setSector] = useState("clinic");
  const [address, setAddress] = useState("Abidjan, Côte d'Ivoire");

  // Step 1: Service info
  const [serviceName, setServiceName] = useState("Accueil & Consultation");
  const [averageWaitMinutes, setAverageWaitMinutes] = useState(15);

  // Created IDs & QR Info
  const [createdBranchId, setCreatedBranchId] = useState<string | null>(null);
  const [createdService, setCreatedService] = useState<any>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  void createdBranchId;
  void createdService;

  const orgSlug = getOrgSlug();

  // Preset services based on sector selection
  const handleSectorChange = (newSector: string) => {
    setSector(newSector);
    if (newSector === "restaurant" || newSector === "maquis") {
      setServiceName("Service en salle / Table");
      setAverageWaitMinutes(20);
    } else if (newSector === "clinic") {
      setServiceName("Consultation générale");
      setAverageWaitMinutes(15);
    } else {
      setServiceName("Service Général");
      setAverageWaitMinutes(10);
    }
  };

  const handleNext = async () => {
    setError(null);
    if (step === 0) {
      if (!branchName.trim()) {
        setError("Veuillez renseigner le nom de l'établissement.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!serviceName.trim()) {
        setError("Veuillez renseigner le nom du service.");
        return;
      }
      setLoading(true);
      try {
        // 1. Create Branch in backend
        const branchRes = await api.post("/organization/branches", {
          name: branchName,
          address: address,
        });
        setCreatedBranchId(branchRes.id);

        // 2. Create Service for that branch in backend
        const serviceRes = await api.post(`/admin/branches/${branchRes.id}/services`, {
          name: serviceName,
          average_service_minutes: Number(averageWaitMinutes),
        });
        setCreatedService(serviceRes);

        // 3. Generate QR Code data for public checkin
        const checkinUrl = `${window.location.origin}/?screen=checkin&slug=${orgSlug}&service=${serviceRes.id}`;
        setQrImageUrl(checkinUrl);

        setStep(2);
      } catch (err: any) {
        setError(err.message || "Erreur lors de la création de la configuration.");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      onComplete();
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e87325] text-lg font-extrabold text-white">F</span>
            <span className="font-extrabold tracking-[-.04em]">Fila</span>
          </div>
          <span className="text-xs font-semibold text-[#788292]">Configuration guidée dynamique</span>
        </header>

        <div className="mt-10">
          <div className="flex items-center justify-between gap-2">
            {steps.map((item, index) => (
              <Fragment key={item}>
                <div className="flex items-center gap-2">
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${index <= step ? "bg-[#e87325] text-white" : "bg-[#e7e7e2] text-[#8a93a1]"}`}>
                    {index < step ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> : index + 1}
                  </span>
                  <span className={`hidden text-xs font-bold sm:block ${index <= step ? "text-[#253144]" : "text-[#949ca8]"}`}>{item}</span>
                </div>
                {index < steps.length - 1 && <span className={`h-px flex-1 ${index < step ? "bg-[#e87325]" : "bg-[#deded8]"}`} />}
              </Fragment>
            ))}
          </div>

          <section className="mt-8 rounded-[26px] border border-[#e4e4de] bg-white p-6 shadow-[0_12px_35px_rgba(23,32,51,.04)] sm:p-9">
            {error && <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}

            {/* STEP 1: ÉTABLISSEMENT */}
            {step === 0 && (
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]">
                  <HugeiconsIcon icon={Building02Icon} size={23} />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-[#c45b1a]">Étape 1 · Établissement</p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-.05em]">Où accueillez-vous vos visiteurs ?</h1>
                <p className="mt-3 text-sm leading-6 text-[#687385]">Saisissez le nom et l'emplacement de votre premier point d'accueil.</p>
                
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold">
                    Nom de l’établissement
                    <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Ex: Siège Principal - Cocody" className="input mt-2" />
                  </label>
                  <label className="text-sm font-semibold">
                    Secteur d'activité
                    <select value={sector} onChange={(e) => handleSectorChange(e.target.value)} className="input mt-2 bg-white">
                      <option value="clinic">Clinique / Hôpital</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="maquis">Maquis / Lounge</option>
                      <option value="generic">Service public ou privé</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">
                    Adresse complète
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ex: Abidjan, Rue des Jardins" className="input mt-2" />
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: SERVICE */}
            {step === 1 && (
              <div>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf5fb] text-[#2871a2]">
                  <HugeiconsIcon icon={Building02Icon} size={23} />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-[#c45b1a]">Étape 2 · Service</p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-.05em]">Quel premier service voulez-vous ouvrir ?</h1>
                <p className="mt-3 text-sm leading-6 text-[#687385]">Définissez le nom du service et le temps moyen de prise en charge d'un client.</p>
                
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-semibold sm:col-span-2">
                    Nom du service
                    <input type="text" value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Ex: Consultation, Service à table..." className="input mt-2" />
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">
                    Temps moyen d'attente / traitement (en minutes)
                    <input type="number" min={1} max={180} value={averageWaitMinutes} onChange={(e) => setAverageWaitMinutes(Number(e.target.value))} className="input mt-2" />
                  </label>
                </div>
              </div>
            )}

            {/* STEP 3: QR CODE PUBLIC GENERATE */}
            {step === 2 && (
              <div className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]">
                  <HugeiconsIcon icon={QrCodeIcon} size={24} />
                </span>
                <p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-[#c45b1a]">Étape 3 · QR Public Prêt</p>
                <h1 className="mt-3 text-3xl font-bold tracking-[-.05em]">Votre QR code est généré et actif !</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#687385]">
                  Les visiteurs scannent ce QR code pour rejoindre la file de <strong>{serviceName}</strong> à <strong>{branchName}</strong>.
                </p>

                {qrImageUrl && (
                  <div className="mx-auto mt-6 flex justify-center bg-white p-3 border border-[#e5e5df] rounded-xl w-48 h-48 shadow-sm">
                    <QRCode value={qrImageUrl} size={166} className="w-full h-full" />
                  </div>
                )}

                <div className="mt-4">
                  <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrImageUrl || "")}`} download={`${serviceName}-QR.png`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#e87325] underline">
                    Télécharger l'image du QR Code
                  </a>
                </div>
              </div>
            )}

            <div className="mt-9 flex items-center justify-between border-t border-[#ecece7] pt-5">
              <button disabled={step === 0 || loading} onClick={() => setStep(step - 1)} className="focus-ring rounded-lg px-3 py-2 text-sm font-bold text-[#667085] disabled:opacity-0">
                Retour
              </button>
              <Button onClick={handleNext} disabled={loading} icon={!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={17} />}>
                {loading ? "Création en cours..." : step === 2 ? "Ouvrir mon espace" : "Continuer"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}