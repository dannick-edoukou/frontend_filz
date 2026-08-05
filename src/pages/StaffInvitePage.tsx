import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, CheckmarkCircle02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/Ui";
import { api, getOrgSlug, setAuthToken, setRefreshToken, setUserRole } from "../utils/api";

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
  if (role === "superadmin") return "super-administrateur Fila";
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
    return <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-4">
      <section className="w-full max-w-md rounded-[26px] border border-[#e4e4de] bg-white p-8 text-center shadow-[0_16px_60px_rgba(23,32,51,.07)]">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#ecf6ef] text-[#287044]">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-[-.05em]">Invitation acceptée</h1>
        <p className="mt-3 text-sm leading-6 text-[#687385]">
          Votre accès staff à <strong>{meta.organizationName}</strong> est actif. Vous pourrez ouvrir la console de file dès votre connexion.
        </p>
        <Button onClick={onComplete} className="mt-7 w-full">Accéder à Fila</Button>
      </section>
    </main>;
  }

  return <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-4">
    <section className="w-full max-w-md rounded-[26px] border border-[#e4e4de] bg-white p-8 shadow-[0_16px_60px_rgba(23,32,51,.07)]">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e87325] text-lg font-extrabold text-white">F</span>
        <span className="text-xs font-bold text-[#788292]">Invitation Fila</span>
      </div>
      <span className="mt-8 grid h-11 w-11 place-items-center rounded-xl bg-[#edf5fb] text-[#2871a2]">
        <HugeiconsIcon icon={UserGroupIcon} size={22} />
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-[-.05em]">Vous êtes invité(e) chez {meta.organizationName}</h1>
      <p className="mt-3 text-sm leading-6 text-[#687385]">
        <strong>{meta.inviterName}</strong> vous invite en tant que <strong>{meta.inviterRoleLabel}</strong>
        {meta.branchName ? <> pour l’établissement <strong>{meta.branchName}</strong></> : <> pour accéder à la console de gestion</>}.
      </p>
      <div className="mt-6 rounded-xl bg-[#f7f7f5] p-4">
        <p className="flex items-center gap-2 text-xs font-bold text-[#596477]">
          <HugeiconsIcon icon={Building02Icon} size={16} />
          Accès : Console staff · Consultation générale
        </p>
      </div>
      <div className="mt-7 flex gap-3">
        <Button onClick={acceptInvite} disabled={loading || !token || password.length < 8} className="flex-1">{loading ? "Activation…" : "Accepter"}</Button>
        <Button onClick={onDecline} variant="secondary" className="flex-1">Refuser</Button>
      </div>
      <label className="mt-4 block text-sm font-semibold text-[#414b5d]">Créer votre mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="8 caractères minimum" className="input mt-2" /></label>
      {error && <p className="mt-3 rounded-xl bg-[#fff1ef] p-3 text-xs font-bold text-[#c13d2e]">{error}</p>}
    </section>
  </main>;
}
