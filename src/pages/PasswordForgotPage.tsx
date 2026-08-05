import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api } from "../utils/api";
import filzIcon from "../assets/filz_icon.png";

export function PasswordForgotPage({ onBack, onSent }: {onBack: () => void;onSent: () => void;}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/password/forgot", { email });
      if (res?.reset_token) localStorage.setItem("filz_reset_token", res.reset_token);
      onSent();
    } finally {
      setLoading(false);
    }
  };
  return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
    <div className="relative bg-pine-950 px-7 pb-10 pt-8 text-center">
      <button type="button" onClick={onBack} className="focus-ring absolute left-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-pine-100/70 hover:bg-white/10 hover:text-paper">← Retour</button>
      <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper">Filz</h1>
      <p className="mt-1.5 text-sm text-pine-100/70">Accès à votre compte.</p>
    </div>
    <div className="relative">
      <div className="border-t-2 border-dashed border-line" />
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Mot de passe oublié</span>
      <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
      <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
    </div>
    <form onSubmit={submit} className="space-y-5 px-7 pb-7 pt-7">
      <label className="block text-sm font-semibold text-ink">Adresse e-mail<div className="relative mt-2"><HugeiconsIcon icon={Mail01Icon} size={18} className="pointer-events-none absolute left-3 top-3 text-ink-faint" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="vous@entreprise.ci" className="input !pl-11" /></div></label>
      <Button type="submit" disabled={loading || !email} className="w-full bg-pine-900 text-paper hover:bg-pine-950 shadow-[0_8px_18px_rgba(18,51,45,0.20)]" icon={!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={17} />}>{loading ? "Génération…" : "Générer le lien"}</Button>
    </form>
    <div className="border-t border-line px-7 py-5 text-center">
      <p className="text-xs leading-5 text-ink-soft">Vous vous souvenez de votre mot de passe ? <button type="button" onClick={onBack} className="focus-ring rounded font-bold text-gold-700">Revenir à la connexion</button></p>
    </div>
  </section></main>;
}
