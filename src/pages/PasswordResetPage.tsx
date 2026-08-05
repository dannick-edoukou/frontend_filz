import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, LockPasswordIcon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api } from "../utils/api";
import filzIcon from "../assets/filz_icon.png";

export function PasswordResetPage({ onComplete, onBack }: {onComplete: () => void;onBack: () => void;}) {
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [token] = useState(() => new URLSearchParams(window.location.search).get("token") || localStorage.getItem("filz_reset_token") || "");
  const [loading, setLoading] = useState(false);
  const [mismatch, setMismatch] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {setMismatch(true);return;}
    setLoading(true);
    try {
      await api.post("/auth/password/reset", { token, password });
      localStorage.removeItem("filz_reset_token");
      setDone(true);
    } finally {
      setLoading(false);
    }
  };
  if (done) return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white p-8 text-center shadow-ticket"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} /></span><h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">Mot de passe mis à jour</h1><p className="mt-3 text-sm leading-6 text-ink-soft">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p><Button onClick={onComplete} className="mt-7 w-full">Se connecter</Button></section></main>;
  if (!token) return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white p-8 text-center shadow-ticket"><img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" /><h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">Lien invalide ou expiré</h1><p className="mt-3 text-sm leading-6 text-ink-soft">Ce lien de réinitialisation n'est plus valide. Demandez un nouveau lien depuis la page de connexion.</p><Button onClick={onBack} className="mt-7 w-full">Demander un nouveau lien</Button></section></main>;
  return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
    <div className="relative bg-pine-950 px-7 pb-10 pt-8 text-center">
      <button type="button" onClick={onBack} className="focus-ring absolute left-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-pine-100/70 hover:bg-white/10 hover:text-paper">← Annuler</button>
      <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper">Filz</h1>
      <p className="mt-1.5 text-sm text-pine-100/70">Sécurisez votre accès.</p>
    </div>
    <div className="relative">
      <div className="border-t-2 border-dashed border-line" />
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Nouveau mot de passe</span>
      <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
      <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
    </div>
    <form onSubmit={submit} className="space-y-5 px-7 pb-7 pt-7">
      <label className="block text-sm font-semibold text-ink">Nouveau mot de passe<div className="relative mt-2"><HugeiconsIcon className="pointer-events-none absolute left-3 top-3 text-ink-faint" icon={LockPasswordIcon} size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="8 caractères minimum" className="input !pl-11" /></div></label>
      <label className="block text-sm font-semibold text-ink">Confirmer le mot de passe<div className="relative mt-2"><input type="password" value={confirmation} onChange={(event) => {setConfirmation(event.target.value);setMismatch(false);}} required minLength={8} placeholder="Répétez votre mot de passe" className="input" />{mismatch && <span className="mt-1.5 block text-xs font-medium text-clay-600">Les mots de passe ne correspondent pas.</span>}</div></label>
      <Button type="submit" disabled={loading || !token || password.length < 8 || confirmation.length < 8} className="w-full bg-pine-900 text-paper hover:bg-pine-950 shadow-[0_8px_18px_rgba(18,51,45,0.20)]">{loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}</Button>
    </form>
  </section></main>;
}
