import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, CheckmarkCircle01Icon, Mail01Icon, MoreHorizontalIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { Page } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import { api } from "../utils/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export function TeamPage() {
  const [invite, setInvite] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("staff");

  const fetchUsers = () => {
    setLoading(true);
    api.get("/organization/users?page_size=100")
      .then((res) => setMembers((res as Page<User>).items ?? []))
      .catch(() => setError("Impossible de charger l'équipe"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) return;
    
    setSubmitting(true);
    setError(null);
    setInviteLink("");
    try {
      const res = await api.post("/organization/staff-invitations", {
        email,
        full_name: fullName,
        role,
      });
      if (res?.invite_url) {
        setInviteLink(res.invite_url);
      }
      setSentEmail(email);
      setEmail("");
      setFullName("");
      setRole("staff");
      setInvite(false);
      setInviteSent(true);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMenu = (memberId: string) => {
    setActiveMenuId(activeMenuId === memberId ? null : memberId);
  };

  const handleDeactivate = async (memberId: string) => {
    try {
      await api.patch(`/organization/users/${memberId}`, { is_active: false });
      setActiveMenuId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la désactivation");
    }
  };

  const handleActivate = async (memberId: string) => {
    try {
      await api.patch(`/organization/users/${memberId}`, { is_active: true });
      setActiveMenuId(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'activation");
    }
  };

  const handleRoleChange = async (memberId: string, role: string) => {
    setError(null);
    setActiveMenuId(null);
    try {
      await api.patch(`/organization/users/${memberId}`, { role });
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erreur lors du changement de rôle");
    }
  };

  const handleDeleteMember = async (member: User) => {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${member.full_name} » (${member.email}) de l'équipe ?`
    );
    if (!confirmed) return;
    setError(null);
    setActiveMenuId(null);
    try {
      await api.delete(`/organization/users/${member.id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression du membre");
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="Organisation" 
        title="Équipe & accès" 
        description="Invitez vos collaborateurs et limitez leur accès aux établissements pertinents." 
        action={<Button onClick={() => setInvite(true)} icon={<HugeiconsIcon icon={Add01Icon} size={18} />}>Inviter un membre</Button>} 
      />
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-[#e5e5df] bg-white">
        <div className="flex items-center gap-3 border-b border-[#ecece7] p-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf5fb] text-[#2871a2]">
            <HugeiconsIcon icon={UserGroupIcon} size={19} />
          </span>
          <div>
            <h2 className="font-bold">{members.length} membres actifs</h2>
            <p className="text-xs text-[#788292]">Les administrateurs peuvent gérer les invitations et les rôles.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-[#fafaf8]">
              <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-[#929aa7]">
                <th className="px-5 py-3">Membre</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Accès</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-5 text-center text-sm text-[#788292]">Chargement...</td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className="border-t border-[#f0f0eb]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#173f3a] text-xs font-bold text-white">
                        {member.full_name.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{member.full_name}</p>
                        <p className="text-xs text-[#788292]">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold capitalize">{member.role.replace("_", " ")}</td>
                  <td className="px-4 py-4"><StatusBadge state={member.is_active ? "active" : "inactive"} /></td>
                  <td className="px-5 py-4 text-right relative">
                    <button 
                      onClick={() => toggleMenu(member.id)}
                      className="focus-ring rounded-lg p-2 text-[#7a8492] hover:bg-[#f5f5f2]"
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={19} />
                    </button>
                    {activeMenuId === member.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-[#e5e5df] bg-white shadow-lg">
                        <div className="py-1">
                          {member.is_active ? (
                            <button
                              onClick={() => handleDeactivate(member.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Désactiver
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(member.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Activer
                            </button>
                          )}
                          {member.role === "company_admin" || member.role === "admin" ? (
                            <button
                              onClick={() => handleRoleChange(member.id, "staff")}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Passer au rôle Staff
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(member.id, "company_admin")}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Passer Administrateur
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="w-full px-4 py-2 text-left text-sm font-semibold text-[#c13d2e] hover:bg-[#fff1ef]"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      {invite && (
        <section className="mt-5 rounded-2xl border border-[#e5e5df] bg-white p-5">
          <h2 className="font-bold">Inviter un collaborateur</h2>
          <form onSubmit={handleInvite} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <input 
                required 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Nom complet" 
                className="input" 
              />
            </label>
            <label className="relative flex-1">
              <HugeiconsIcon icon={Mail01Icon} className="absolute left-3 top-3 text-[#8a93a1]" size={17} />
              <input 
                required 
                type="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="collaborateur@entreprise.ci" 
                className="input pl-9" 
              />
            </label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="input max-w-44 bg-white">
              <option value="staff">Staff</option>
              <option value="company_admin">Administrateur</option>
            </select>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>{submitting ? "En cours..." : "Créer le compte"}</Button>
              <Button type="button" onClick={() => setInvite(false)} variant="secondary">Annuler</Button>
            </div>
          </form>
          {inviteLink && (
            <p className="mt-3 rounded-xl bg-[#f7f7f5] p-3 text-xs leading-5 text-[#596477]">
              Mode développement : lien d’invitation <strong>{inviteLink}</strong>
            </p>
          )}
        </section>
      )}

      <Modal isOpen={inviteSent} onClose={() => setInviteSent(false)} title="Invitation envoyée" size="sm">
        <div className="flex flex-col items-center gap-4 pb-2 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#ebf6ee]">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={34} className="text-[#287044]" />
          </span>
          <p className="text-sm leading-6 text-[#596477]">
            Un e-mail d’invitation a été envoyé à <strong>{sentEmail}</strong>. Le collaborateur
            pourra rejoindre l’organisation dès qu’il aura créé son compte.
          </p>
          <Button className="mt-1 w-full" onClick={() => setInviteSent(false)}>Compris</Button>
        </div>
      </Modal>
    </>
  );
}
