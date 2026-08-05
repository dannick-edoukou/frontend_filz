import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, LockPasswordIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { LoadingButton } from "../components/ui/LoadingSpinner";
import { api, setAuthToken, setRefreshToken, setUserRole, setOrgId, setOrgSlug } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import filzIcon from "../assets/filz_icon.png";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function LoginPage({ onLogin, onSignup, onForgotPassword, onAdmin, onHome }: {onLogin: (role: string) => void;onSignup: () => void;onForgotPassword: () => void;onAdmin: () => void;onHome?: () => void;}) {
  void onAdmin;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showSuccess, showError } = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res && res.access_token) {
        setAuthToken(res.access_token);
        if (res.refresh_token) setRefreshToken(res.refresh_token);
        const payload = decodeJwt(res.access_token);
        if (payload) {
          setUserRole(payload.role);
          setOrgId(payload.organization_id);
          if (res.org_slug) {
            setOrgSlug(res.org_slug);
          }
          showSuccess("Connexion réussie", "Bienvenue sur Fila");
          onLogin(payload.role);
        } else {
          throw new Error("Invalid session token payload");
        }
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "connexion" }));
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10"><section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
    {onHome && (
      <button type="button" onClick={onHome} className="focus-ring absolute left-0 top-0 hidden" aria-hidden="true" />
    )}
    <div className="bg-pine-950 px-7 pb-10 pt-8 text-center relative">
      {onHome && (
        <button type="button" onClick={onHome} className="focus-ring absolute left-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-pine-100/70 hover:bg-white/10 hover:text-paper">
          ← Accueil
        </button>
      )}
      <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-paper">Filz</h1>
      <p className="mt-1.5 text-sm text-pine-100/70">Gérez vos files d’attente par QR code.</p>
    </div>
    <div className="relative">
      <div className="border-t-2 border-dashed border-line" />
      <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Espace entreprise</span>
      <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
      <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
    </div>
      <form onSubmit={submit} className="space-y-5 px-7 pb-7 pt-7"><label className="block text-sm font-semibold text-ink">Adresse e-mail<div className="relative mt-2"><HugeiconsIcon className="absolute left-3 top-3 text-ink-faint" icon={Mail01Icon} size={18} /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.ci" className="focus-ring h-11 w-full rounded-xl border border-line bg-white !pl-11 pr-3 text-sm placeholder:text-ink-faint" /></div></label><label className="block text-sm font-semibold text-ink">Mot de passe<div className="relative mt-2"><HugeiconsIcon className="absolute left-3 top-3 text-ink-faint" icon={LockPasswordIcon} size={18} /><input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="focus-ring h-11 w-full rounded-xl border border-line bg-white !pl-11 pr-3 text-sm" /></div></label><div className="flex items-center justify-between"><label className="flex cursor-pointer items-center gap-2 text-xs text-ink-soft"><input type="checkbox" className="accent-gold-500" />Se souvenir de moi</label><button type="button" onClick={onForgotPassword} className="focus-ring text-xs font-bold text-gold-700">Mot de passe oublié ?</button></div><LoadingButton isLoading={loading} loadingText="Connexion en cours…" className="w-full bg-pine-900 text-paper hover:bg-pine-950 shadow-[0_8px_18px_rgba(18,51,45,0.20)]" type="submit" icon={!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={17} />}>Se connecter</LoadingButton></form>
      <div className="border-t border-line px-7 py-5 text-center">
        <p className="text-xs leading-5 text-ink-soft">Vous découvrez Filz ? <button type="button" onClick={onSignup} className="focus-ring rounded font-bold text-gold-700">Créer votre espace entreprise</button></p>
        <p className="mt-2 text-xs text-ink-soft">Besoin d’aide pour accéder à votre espace ? <button className="focus-ring rounded font-bold text-gold-700">Contacter Filz</button></p>
      </div>
  </section></main>;
}