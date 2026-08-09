import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api } from "../utils/api";

export function EmailVerificationPage({ onComplete, onBack }: {onComplete: () => void;onBack: () => void;}) {
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingEmail = localStorage.getItem("filz_pending_email") || "votre adresse";

  const handleVerify = async () => {
    if (code.length < 5) {
      setError("Veuillez entrer un code valide.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/verify-email", {
        email: pendingEmail,
        code: code
      });
      
      setVerified(true);
    } catch (err: any) {
      setError(err.message || "Code invalide.");
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-sand p-4"><section className="w-full max-w-md rounded-[26px] border border-line bg-white p-8 text-center shadow-[0_16px_60px_rgba(23,32,51,.07)]"><span className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${verified ? "bg-teal-50 text-teal-700" : "bg-pine-50 text-pine-600"}`}><HugeiconsIcon icon={verified ? CheckmarkCircle02Icon : Mail01Icon} size={26} /></span><p className="mt-6 text-xs font-bold uppercase tracking-[.14em] text-pine-700">Vérification d'e-mail</p><h1 className="mt-3 text-3xl font-bold tracking-[-.05em]">{verified ? "Inscription confirmée" : "Confirmez votre adresse"}</h1><p className="mt-3 text-sm leading-6 text-ink-soft">{verified ? `Merci ${pendingEmail}. Votre inscription est confirmée et en attente d'approbation de notre équipe. Vous recevrez un email dès que votre espace sera activé (généralement sous 24h).` : `Un code de vérification a été envoyé à ${pendingEmail}. Entrez le code pour confirmer votre inscription.`}</p>
  {verified ? <Button onClick={onComplete} className="mt-7 w-full">Se connecter à mon espace</Button> : <>
  <div className="mt-6 flex flex-col gap-3">
    {error && <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100">{error}</div>}
    <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code à 6 chiffres" className="focus-ring h-11 w-full rounded-xl border border-line px-4 text-center text-lg font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal" />
    <Button onClick={handleVerify} disabled={loading} className="w-full">{loading ? "Vérification..." : "Valider le code"}</Button>
  </div>
  <button onClick={onBack} className="focus-ring mt-4 rounded-md text-xs font-bold text-pine-500">Utiliser une autre adresse</button></>}</section></main>;
}
