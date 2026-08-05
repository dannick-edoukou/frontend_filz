import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Building02Icon, MoreHorizontalIcon, Location01Icon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { api } from "../utils/api";
import { Screen } from "../types";

interface Branch {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
}

export function EstablishmentsPage({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [added, setAdded] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const fetchBranches = () => {
    setLoading(true);
    api.get("/organization/branches")
      .then((data) => setBranches(data))
      .catch(() => setError("Impossible de charger les agences"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address) return;
    
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/organization/branches", { name, address });
      setAdded(false);
      setName("");
      setAddress("");
      fetchBranches();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'agence");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageServices = (branch: Branch) => {
    localStorage.setItem("filz_selected_branch_id", branch.id);
    onNavigate("services");
  };

  const handleToggleBranch = async (branch: Branch) => {
    setError(null);
    setOpenMenuId(null);
    try {
      await api.patch(`/organization/branches/${branch.id}`, { is_active: !branch.is_active });
      fetchBranches();
    } catch (err: any) {
      setError(err.message || "Impossible de modifier l'agence");
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    setError(null);
    const confirmed = window.confirm(
      `Supprimer l'établissement « ${branch.name} » ?\n\nTous ses services, files d'attente et tickets seront définitivement supprimés.`
    );
    if (!confirmed) return;
    setOpenMenuId(null);
    try {
      await api.delete(`/organization/branches/${branch.id}`);
      fetchBranches();
    } catch (err: any) {
      setError(err.message || "Impossible de supprimer l'agence");
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="Organisation" 
        title="Établissements" 
        description="Gérez les points d’accueil, leurs services et leur visibilité publique." 
        action={<Button onClick={() => setAdded(true)} icon={<HugeiconsIcon icon={Add01Icon} size={18} />}>Ajouter une agence</Button>} 
      />
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <p className="text-sm text-[#788292]">Chargement...</p>
        ) : branches.map((branch) => (
          <article key={branch.id} className="rounded-2xl border border-[#e5e5df] bg-white p-5">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]">
                <HugeiconsIcon icon={Building02Icon} size={20} />
              </span>
              <div className="relative">
              <button
                onClick={() => setOpenMenuId(openMenuId === branch.id ? null : branch.id)}
                className="focus-ring rounded-lg p-1.5 text-[#7a8492] hover:bg-[#f5f5f2]"
                aria-label={`Actions pour ${branch.name}`}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} size={20} />
              </button>
              {openMenuId === branch.id && (
                <div className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-[#e5e5df] bg-white p-1 shadow-lg">
                  <button
                    onClick={() => handleManageServices(branch)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#253144] hover:bg-[#f7f7f5]"
                  >
                    Gérer les services
                  </button>
                  <button
                    onClick={() => handleToggleBranch(branch)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#253144] hover:bg-[#f7f7f5]"
                  >
                    {branch.is_active ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDeleteBranch(branch)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#c13d2e] hover:bg-[#fff1ef]"
                  >
                    Supprimer
                  </button>
                </div>
              )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-between gap-3">
              <div>
                <h2 className="font-bold tracking-[-.02em]">{branch.name}</h2>
                <p className="mt-1 text-sm text-[#778091] flex items-center gap-1">
                  <HugeiconsIcon icon={Location01Icon} size={14} />
                  {branch.address}
                </p>
              </div>
              <StatusBadge state={branch.is_active ? "active" : "inactive"} />
            </div>
            
            <dl className="mt-6 grid grid-cols-2 border-y border-[#efefea] py-4">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-[.1em] text-[#929aa7]">ID Agence</dt>
                <dd className="mt-1 text-xs font-mono text-[#596477] truncate pr-2">{branch.id}</dd>
              </div>
            </dl>
            
            <div className="mt-4 flex gap-2">
              <Button onClick={() => handleManageServices(branch)} variant="secondary" className="flex-1">Gérer les services</Button>
            </div>
          </article>
        ))}
      </div>
      
      {added && (
        <section className="mt-5 rounded-2xl border border-[#e5e5df] bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-bold text-[#172033]">Nouvelle agence (point d'accueil)</h2>
              <p className="mt-1 text-sm text-[#687385]">Saisissez les informations de votre nouvel emplacement.</p>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Nom de l'agence
                <input required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Clinique Yopougon" className="input mt-1" />
              </label>
              <label className="text-sm font-semibold">
                Adresse
                <input required value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Yopougon Niangon" className="input mt-1" />
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" onClick={() => setAdded(false)} variant="secondary">Annuler</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Création..." : "Créer l'agence"}</Button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
