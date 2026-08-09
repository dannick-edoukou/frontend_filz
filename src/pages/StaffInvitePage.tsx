import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, CheckmarkCircle02Icon, LockPasswordIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api, getOrgSlug, setAuthToken, setRefreshToken, setUserRole } from "../utils/api";
import filzIcon from "../assets/filz_icon.png";

type InviteMeta = {
  organizationName: string;
  inviterName: string;
  inviterRoleLabel: string;
  branchName: string | null;
};

const DEFAULT_META: InviteMeta = {
  organizationName: "votre établissement",
  inviterName: "Un·e administrateur·trice",
  inviterRoleLabel: "membre staff",
  branchName: null,
};

function deriveInviterRoleLabel(role?: string): string {
  if (role === "superadmin") return "super-administrateur Filz";
  if (role === "company_admin") return "administrateur";
  return "membre staff";
}

export function StaffInvitePage({ onComplete, onDecline }: { onComplete: () => void; onDecline: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [meta, setMeta] = useState<InviteMeta>(DEFAULT_META);
  const [token, setToken] = useState(() => new URLSearchParams(window.location.search).get("token") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const slugFromUrl = params.get("org_slug");
    const orgLabel = params.get("org_name");
    const inviterFromUrl = params.get("inviter_name");
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      api.get(`/auth/staff-invitations/${tokenFromUrl}`).then((res) => {
        if (cancelled) return;
        setMeta({
          organizationName: res.organization_name || DEFAULT_META.organizationName,
          inviterName: inviterFromUrl || DEFAULT_META.inviterName,
          inviterRoleLabel: deriveInviterRoleLabel(res.role),
          branchName: null,
        });
      }).catch(() => {
        if (!cancelled) setError("Invitation introuvable ou expirée.");
      });
      return () => { cancelled = true; };
    }

    api.get("/auth/me").then((res) => {
      if (cancelled) return;
      const orgName = res?.organization?.name || orgLabel || (slugFromUrl ?? getOrgSlug());
      const inviterRole = res?.user?.role;
      const inviterName = inviterFromUrl || res?.user?.full_name || res?.user?.email || DEFAULT_META.inviterName;
      setMeta({
        organizationName: orgName || DEFAULT_META.organizationName,
        inviterName,
        inviterRoleLabel: deriveInviterRoleLabel(inviterRole),
        branchName: null,
      });
    }).catch(() => {
      if (cancelled) return;
      const fallback = slugFromUrl && orgLabel ? orgLabel : DEFAULT_META.organizationName;
      setMeta({
        organizationName: orgLabel || fallback,
        inviterName: inviterFromUrl || DEFAULT_META.inviterName,
        inviterRoleLabel: DEFAULT_META.inviterRoleLabel,
        branchName: null,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const acceptInvite = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/staff-invitations/accept", { token, password });
      setAuthToken(res.access_token);
      if (res.refresh_token) setRefreshToken(res.refresh_token);
      setUserRole(res.role || "staff");
      setAccepted(true);
    } catch (err: any) {
      setError(err.message || "Impossible d’accepter cette invitation.");
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white p-8 text-center shadow-ticket">
        <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
        <span className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">Invitation acceptée</h1>
        <p className="mt-3 text-sm leading-6 text-ink-soft">
          Votre accès staff à <strong>{meta.organizationName}</strong> est actif. Vous pourrez ouvrir la console de file dès votre connexion.
        </p>
        <Button onClick={onComplete} className="mt-7 w-full">Accéder à Filz</Button>
      </section>
    </main>;
  }

  return <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
    <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-white shadow-ticket">
      <div className="relative bg-pine-950 px-7 pb-10 pt-8 text-center">
        <img src={filzIcon} alt="Filz" className="mx-auto h-12 w-12 rounded-2xl" />
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white">Filz</h1>
        <p className="mt-1.5 text-sm text-pine-100/70">Vous êtes invité(e) à rejoindre l’équipe.</p>
      </div>
      <div className="relative">
        <div className="border-t-2 border-dashed border-line" />
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Invitation</span>
        <span className="absolute left-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
        <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 rounded-full border border-line bg-white" />
      </div>
      <div className="px-7 pb-7 pt-7">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pine-100 text-pine-800">
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Rejoindre {meta.organizationName}</h2>
            <p className="mt-1.5 text-sm leading-6 text-ink-soft">
              <strong>{meta.inviterName}</strong> vous invite en tant que <strong>{meta.inviterRoleLabel}</strong>
              {meta.branchName ? <> pour l’établissement <strong>{meta.branchName}</strong></> : <> pour accéder à la console de gestion</>}.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-sand/60 px-4 py-3 text-xs font-bold text-ink-soft">
          <HugeiconsIcon icon={Building02Icon} size={16} />
          Accès : Console staff · Consultation générale
        </div>
        <label className="mt-6 block text-sm font-semibold text-ink">Créer votre mot de passe
          <div className="relative mt-2">
            <HugeiconsIcon className="pointer-events-none absolute left-3 top-3 text-ink-faint" icon={LockPasswordIcon} size={18} />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="8 caractères minimum" className="input !pl-11" />
          </div>
        </label>
        {error && <p className="mt-3 rounded-xl bg-clay-100 p-3 text-xs font-bold text-clay-700">{error}</p>}
        <div className="mt-7 flex gap-3">
          <Button onClick={acceptInvite} disabled={loading || !token || password.length < 8} className="flex-1">{loading ? "Activation…" : "Accepter l’invitation"}</Button>
          <Button onClick={onDecline} variant="secondary" className="flex-1">Refuser</Button>
        </div>
      </div>
    </section>
  </main>;
}
