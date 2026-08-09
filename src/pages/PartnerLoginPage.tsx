import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, HandshakeIcon, LockPasswordIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { LoadingButton } from "../components/ui/LoadingSpinner";
import { api, setPartnerToken, setPartnerRefreshToken, setPartnerInfo } from "../utils/api";
import { useToast } from "../components/ui/Toast";
import { getErrorMessage } from "../utils/errorHandler";
import filzIcon from "../assets/filz_icon.png";

export function PartnerLoginPage({ onLogin, onHome }: { onLogin: () => void; onHome: () => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { showSuccess, showError } = useToast();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/partners/login", { email, password });
      if (res && res.access_token) {
        setPartnerToken(res.access_token);
        setPartnerRefreshToken(res.refresh_token ?? null);
        setPartnerInfo({
          id: res.partner?.id,
          full_name: res.partner?.full_name,
          email: res.partner?.email,
          referral_code: res.partner?.referral_code,
        });
        showSuccess("Bienvenue sur votre espace", "Vos statistiques de parrainage sont à jour.");
        onLogin();
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      showError(getErrorMessage(err, { action: "connexion partenaire" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
        <div className="relative bg-pine-950 px-7 pb-10 pt-8 text-center">
          <button
            type="button"
            onClick={onHome}
            className="focus-ring absolute left-4 top-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-pine-100/70 hover:bg-white/10 hover:text-white"
          >
            ← Accueil
          </button>
          <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
            <HugeiconsIcon icon={HandshakeIcon} size={14} />
            Espace partenaire
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">Connexion</h1>
          <p className="mt-1.5 text-sm text-pine-100/70">Suivez vos parrainages et vos commissions.</p>
        </div>
        <div className="relative">
          <div className="border-t-2 border-dashed border-line" />
          <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Partenaire</span>
          <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
          <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
        </div>
        <form onSubmit={submit} className="space-y-4 px-7 pb-7 pt-7">
          <label className="block text-sm font-semibold text-ink">
            Adresse e-mail
            <div className="relative mt-2">
              <HugeiconsIcon icon={Mail01Icon} size={18} className="pointer-events-none absolute left-3 top-3 text-ink-faint" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="input !pl-11" />
            </div>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Mot de passe
            <div className="relative mt-2">
              <HugeiconsIcon icon={LockPasswordIcon} size={18} className="pointer-events-none absolute left-3 top-3 text-ink-faint" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Votre mot de passe" className="input !pl-11" />
            </div>
          </label>
          <LoadingButton type="submit" isLoading={loading} loadingText="Connexion…" className="mt-1 w-full bg-pine-900 text-white hover:bg-pine-700 shadow-primary" icon={!loading && <HugeiconsIcon icon={ArrowRight01Icon} size={17} />}>
            Accéder à mon espace
          </LoadingButton>
          <p className="text-center text-[11px] leading-5 text-ink-faint">
            Pas encore partenaire ? Rejoignez le programme et percevez 30 % pendant 5 mois.
          </p>
        </form>
      </section>
    </main>
  );
}
