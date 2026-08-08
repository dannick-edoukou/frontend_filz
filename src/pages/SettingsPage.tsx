import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader } from "../components/ui/Ui";
import { api, clearSession } from "../utils/api";

type BusinessType =
  | "clinic"
  | "hospital"
  | "restaurant"
  | "maquis"
  | "salon"
  | "public_service"
  | "generic";

const BUSINESS_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: "clinic", label: "Clinique" },
  { value: "hospital", label: "Hôpital" },
  { value: "restaurant", label: "Restaurant" },
  { value: "maquis", label: "Maquis" },
  { value: "salon", label: "Salon" },
  { value: "public_service", label: "Service public / privé" },
  { value: "generic", label: "Autre" },
];

type OrgState = {
  name: string;
  business_type: BusinessType;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  brand_color: string;
};

type UserState = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

function initialsOf(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function roleLabel(role: string): string {
  if (role === "company_admin" || role === "admin") return "Administrateur";
  if (role === "staff") return "Staff";
  if (role === "superadmin") return "Superadministrateur";
  return role || "Utilisateur";
}

export function SettingsPage() {
  const [org, setOrg] = useState<OrgState | null>(null);
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const me = await api.get("/auth/me");
      setUser({
        id: me?.user?.id ?? "",
        full_name: me?.user?.full_name ?? "",
        email: me?.user?.email ?? "",
        role: me?.user?.role ?? "",
      });
      setProfileName(me?.user?.full_name ?? "");
      setProfileEmail(me?.user?.email ?? "");
      const orgData = me?.organization;
      if (orgData) {
        setOrg({
          name: orgData.name ?? "",
          business_type: (orgData.business_type as BusinessType) || "generic",
          contact_email: orgData.contact_email ?? "",
          contact_phone: orgData.contact_phone ?? "",
          logo_url: orgData.logo_url ?? "",
          brand_color: orgData.brand_color ?? "#e87325",
        });
      } else {
        setOrg({ name: "", business_type: "generic", contact_email: "", contact_phone: "", logo_url: "", brand_color: "#e87325" });
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de charger vos paramètres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!org || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<OrgState> = {};
      if (org.name) payload.name = org.name;
      payload.business_type = org.business_type;
      if (org.contact_email) payload.contact_email = org.contact_email;
      payload.contact_phone = org.contact_phone;
      payload.logo_url = org.logo_url;
      payload.brand_color = org.brand_color;
      await api.patch("/organization/me", payload);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearSession();
    window.location.href = "/";
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user || savingProfile) return;
    setSavingProfile(true);
    setError(null);
    try {
      await api.patch(`/organization/users/${user.id}`, {
        full_name: profileName,
        email: profileEmail,
      });
      await loadAll();
      setEditingProfile(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la mise à jour du profil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function deleteAccount() {
    if (!user) return;
    const confirmed = window.confirm(
      "Supprimer définitivement votre compte ?\n\nToutes vos données d'accès seront supprimées. Cette action est irréversible."
    );
    if (!confirmed) return;
    try {
      await api.delete("/auth/me");
      logout();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la suppression du compte.");
    }
  }

  return <>
    <PageHeader
      eyebrow="Organisation"
      title="Réglages"
      description="Gérez les informations de votre entreprise, vos établissements et votre profil."
    />
    <div className="max-w-4xl space-y-5">
      {error && (
        <div className="rounded-xl border border-[#f0d8bd] bg-[#fffbf6] p-3 text-xs font-bold text-[#b94d10]">
          {error}
        </div>
      )}
      <section className="rounded-2xl border border-[#e5e5df] bg-white">
        <div className="border-b border-[#ecece7] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff3e7] text-[#d6641b]">
              <HugeiconsIcon icon={Building02Icon} size={19} />
            </span>
            <div>
              <h2 className="font-bold">Organisation</h2>
              <p className="mt-0.5 text-xs text-[#788292]">Informations visibles par votre équipe.</p>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="p-5 text-xs text-[#788292]">Chargement…</div>
        ) : (
          <form onSubmit={save} className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#414b5d]">
                Nom de l’organisation
                <input
                  required
                  value={org?.name ?? ""}
                  onChange={(e) => setOrg((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-[#414b5d]">
                Secteur d’activité
                <select
                  value={org?.business_type ?? "generic"}
                  onChange={(e) =>
                    setOrg((prev) => (prev ? { ...prev, business_type: e.target.value as BusinessType } : prev))
                  }
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] bg-white px-3 text-sm font-normal"
                >
                  {BUSINESS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-[#414b5d]">
                E-mail de contact
                <input
                  type="email"
                  value={org?.contact_email ?? ""}
                  onChange={(e) => setOrg((prev) => (prev ? { ...prev, contact_email: e.target.value } : prev))}
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-[#414b5d]">
                Téléphone
                <input
                  value={org?.contact_phone ?? ""}
                  onChange={(e) => setOrg((prev) => (prev ? { ...prev, contact_phone: e.target.value } : prev))}
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-[#414b5d]">
                Logo URL
                <input
                  value={org?.logo_url ?? ""}
                  onChange={(e) => setOrg((prev) => (prev ? { ...prev, logo_url: e.target.value } : prev))}
                  placeholder="https://..."
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-[#414b5d]">
                Couleur de marque
                <input
                  type="color"
                  value={org?.brand_color ?? "#e87325"}
                  onChange={(e) => setOrg((prev) => (prev ? { ...prev, brand_color: e.target.value } : prev))}
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-2"
                />
              </label>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[#efefea] pt-5">
              <p aria-live="polite" className="text-xs font-semibold text-[#287044]">
                {saved && "Modifications enregistrées"}
              </p>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-[#e5e5df] bg-white">
        <div className="border-b border-[#ecece7] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf5fb] text-[#2871a2]">
              <HugeiconsIcon icon={UserIcon} size={19} />
            </span>
            <div>
              <h2 className="font-bold">Votre profil</h2>
              <p className="mt-0.5 text-xs text-[#788292]">Vos informations d’accès à Filz.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between p-5">
          {loading ? (
            <p className="text-xs text-[#788292]">Chargement…</p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#173f3a] text-sm font-bold text-white">
                  {initialsOf(user?.full_name ?? "")}
                </span>
                <div>
                  <p className="text-sm font-bold">{user?.full_name ?? "—"}</p>
                  <p className="mt-1 text-xs text-[#788292]">
                    <span className="font-mono">{user?.email ?? "—"}</span> · {roleLabel(user?.role ?? "")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <Button variant="secondary" onClick={() => setEditingProfile(!editingProfile)}>
                  Modifier le profil
                </Button>
                <Button
                  onClick={logout}
                  className="!bg-[#a86a64] !text-white hover:!bg-[#8e5853]"
                >
                  Se déconnecter
                </Button>
              </div>
            </>
          )}
        </div>
        {editingProfile && user && (
          <form onSubmit={saveProfile} className="border-t border-[#ecece7] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[#414b5d]">
                Nom complet
                <input
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-3 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-[#414b5d]">
                Adresse e-mail
                <input
                  required
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="focus-ring mt-2 h-10 w-full rounded-xl border border-[#deded8] px-3 text-sm font-normal"
                />
              </label>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#efefea] pt-5">
              <div>
                <p className="text-xs font-semibold text-[#287044]">{saved && "Profil mis à jour"}</p>
                <p className="mt-1 max-w-xs text-[11px] leading-5 text-[#788292]">
                  Zone sensible : une nouvelle adresse e-mail sera utilisée pour vos prochaines connexions.
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditingProfile(false)}>Annuler</Button>
                <Button type="submit" disabled={savingProfile}>{savingProfile ? "Enregistrement…" : "Enregistrer le profil"}</Button>
              </div>
            </div>
          </form>
        )}
        <div className="border-t border-[#ecece7] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#c13d2e]">Zone de danger</p>
              <p className="mt-1 text-xs leading-5 text-[#788292]">
                La suppression de votre compte est définitive : vous perdrez l'accès à cette espace.
              </p>
            </div>
            <Button
              onClick={deleteAccount}
              className="!bg-[#fff1ef] !text-[#c13d2e] hover:!bg-[#ffe3df] !border !border-[#f0b9b2]"
            >
              Supprimer mon compte
            </Button>
          </div>
        </div>
      </section>
    </div>
  </>;
}
