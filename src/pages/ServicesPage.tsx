import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Copy01Icon, Download01Icon, PrinterIcon, QrCodeIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader, StatusBadge } from "../components/ui/Ui";
import { api, getOrgSlug } from "../utils/api";
import filzIcon from "../assets/filz_icon.png";

interface Branch {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  average_service_minutes: number;
  is_active: boolean;
  qr_code_token: string;
  form_template_id: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  working_days?: string | null;
}

interface FormTemplate {
  id: string;
  name: string;
}

export function ServicesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  
  const [showQr, setShowQr] = useState(false);
  const [activePublicUrl, setActivePublicUrl] = useState("");
  const [activeQrName, setActiveQrName] = useState("");
  const [activeBranchName, setActiveBranchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Service modal states
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceMinutes, setNewServiceMinutes] = useState(15);
  const [newServiceTemplate, setNewServiceTemplate] = useState("");
  const [newOpeningTime, setNewOpeningTime] = useState("08:00");
  const [newClosingTime, setNewClosingTime] = useState("18:00");
  const [editingService, setEditingService] = useState<ServiceCategory | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinutes, setEditMinutes] = useState(15);
  const [editTemplate, setEditTemplate] = useState("");
  const [editOpeningTime, setEditOpeningTime] = useState("");
  const [editClosingTime, setEditClosingTime] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const orgSlug = getOrgSlug();

  // Load branches and templates
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get("/organization/branches"),
      api.get("/admin/form-templates")
    ])
    .then(([branchesData, templatesData]) => {
      if (cancelled) return;
      setBranches(branchesData);
      setTemplates(templatesData);
      if (branchesData && branchesData.length > 0) {
        const storedBranchId = localStorage.getItem("filz_selected_branch_id");
        const initialBranch = branchesData.find((branch: Branch) => branch.id === storedBranchId) || branchesData[0];
        setSelectedBranchId(initialBranch.id);
      } else {
        setLoading(false);
      }
    })
    .catch(() => {
      if (cancelled) return;
      setError("Erreur de chargement des données.");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Load services for selected branch
  const fetchServices = () => {
    if (!selectedBranchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/admin/branches/${selectedBranchId}/services`)
      .then((data) => {
        setServices(data);
        setError(null);
      })
      .catch(() => setError("Erreur de chargement des services."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, [selectedBranchId]);

  const handleOpenQr = (service: ServiceCategory) => {
    const checkinUrl = `${window.location.origin}/?screen=checkin&slug=${orgSlug}&service=${service.id}`;
    const branch = branches.find((item) => item.id === selectedBranchId);

    setActivePublicUrl(checkinUrl);
    setActiveQrName(service.name);
    setActiveBranchName(branch?.name || "Établissement");
    setShowQr(true);
  };

  const copyPublicUrl = async () => {
    await navigator.clipboard.writeText(activePublicUrl);
  };

  const printQrPoster = () => {
    window.print();
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !selectedBranchId) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/admin/branches/${selectedBranchId}/services`, {
        name: newServiceName,
        average_service_minutes: newServiceMinutes,
        form_template_id: newServiceTemplate || null,
        opening_time: newOpeningTime || null,
        closing_time: newClosingTime || null,
        working_days: "0,1,2,3,4,5",
      });
      setShowCreate(false);
      setNewServiceName("");
      setNewServiceMinutes(15);
      setNewServiceTemplate("");
      setNewOpeningTime("08:00");
      setNewClosingTime("18:00");
      fetchServices();
    } catch (err: any) {
      setError(err.message || "Erreur de création");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditService = (service: ServiceCategory) => {
    setEditingService(service);
    setEditName(service.name);
    setEditMinutes(service.average_service_minutes);
    setEditTemplate(service.form_template_id || "");
    setEditOpeningTime(service.opening_time || "");
    setEditClosingTime(service.closing_time || "");
    setEditIsActive(service.is_active);
  };

  const closeEditService = () => {
    setEditingService(null);
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService || !editName.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/admin/services/${editingService.id}`, {
        name: editName,
        average_service_minutes: editMinutes,
        form_template_id: editTemplate || null,
        opening_time: editOpeningTime || null,
        closing_time: editClosingTime || null,
        working_days: editingService.working_days || "0,1,2,3,4,5",
        is_active: editIsActive,
      });
      closeEditService();
      fetchServices();
    } catch (err: any) {
      setError(err.message || "Erreur de modification du service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (service: ServiceCategory) => {
    const confirmed = window.confirm(
      `Supprimer le service « ${service.name} » ?\n\nLes files d'attente et tickets liés seront définitivement supprimés.`
    );
    if (!confirmed) return;
    setError(null);
    try {
      await api.delete(`/admin/services/${service.id}`);
      fetchServices();
    } catch (err: any) {
      setError(err.message || "Erreur de suppression du service");
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-[#e6e6e0]">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-[#687385]">Agence :</label>
          <select 
            value={selectedBranchId} 
            onChange={(e) => {
              localStorage.setItem("filz_selected_branch_id", e.target.value);
              setSelectedBranchId(e.target.value);
            }}
            className="input bg-[#f8f8f6] py-1.5 min-w-[200px]"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<HugeiconsIcon icon={Add01Icon} size={16} />}>
          Nouveau service
        </Button>
      </div>

      <PageHeader 
        eyebrow="Configuration" 
        title="Services & Files" 
        description="Créez les différents services proposés dans cette agence pour lesquels les clients peuvent s'inscrire en file d'attente." 
      />

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}

      {loading ? (
        <p className="text-center text-sm py-10">Chargement des services...</p>
      ) : services.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-[#e5e5df]">
          <p className="text-sm text-[#788292]">Aucun service pour cette agence.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="rounded-2xl border border-[#e5e5df] bg-white p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold tracking-[-.02em]">{service.name}</h2>
                    <p className="mt-1 text-xs text-[#778091]">Attente moy. : {service.average_service_minutes} min</p>
                    <p className="mt-1 text-xs text-[#778091]">{service.opening_time && service.closing_time ? `${service.opening_time} - ${service.closing_time}` : "Horaires libres"}</p>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]"><HugeiconsIcon icon={QrCodeIcon} size={18} /></span>
                </div>
                
                <div className="mt-4 border-t border-[#efefea] pt-4 flex justify-between items-center">
                  <StatusBadge state={service.is_active ? "active" : "inactive"} />
                  <span className="text-[10px] uppercase font-bold text-[#8a93a1]">
                    {service.form_template_id ? "Formulaire lié" : "Sans form."}
                  </span>
                </div>
              </div>

              <div>
                <div className="mt-4 flex gap-2 pt-4 border-t border-[#efefea]">
                  <Button onClick={() => handleOpenQr(service)} variant="secondary" className="flex-1">Code QR</Button>
                  <Button onClick={() => openEditService(service)} variant="ghost" className="flex-1">Modifier</Button>
                  <Button onClick={() => handleDeleteService(service)} variant="danger" className="flex-1">Supprimer</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">Créer un service</h2>
              <button onClick={() => setShowCreate(false)} className="focus-ring text-sm font-bold text-[#667085]">Fermer</button>
            </div>
            
            <form onSubmit={handleCreateService} className="flex flex-col gap-4">
              <label className="text-sm font-semibold">
                Nom du service
                <input required value={newServiceName} onChange={e => setNewServiceName(e.target.value)} placeholder="Ex: Consultation Générale" className="input mt-1" />
              </label>
              <label className="text-sm font-semibold">
                Temps d'attente moyen (minutes)
                <input type="number" min={1} required value={newServiceMinutes} onChange={e => setNewServiceMinutes(Number(e.target.value))} className="input mt-1" />
              </label>
              <label className="text-sm font-semibold">
                Formulaire de collecte
                <select value={newServiceTemplate} onChange={e => setNewServiceTemplate(e.target.value)} className="input mt-1 bg-white">
                  <option value="">-- Aucun formulaire --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Ouverture
                  <input type="time" value={newOpeningTime} onChange={e => setNewOpeningTime(e.target.value)} className="input mt-1" />
                </label>
                <label className="text-sm font-semibold">
                  Fermeture
                  <input type="time" value={newClosingTime} onChange={e => setNewClosingTime(e.target.value)} className="input mt-1" />
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="button" onClick={() => setShowCreate(false)} variant="secondary" className="flex-1">Annuler</Button>
                <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Création..." : "Créer le service"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingService && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold">Modifier le service</h2>
              <button onClick={closeEditService} className="focus-ring text-sm font-bold text-[#667085]">Fermer</button>
            </div>

            <form onSubmit={handleUpdateService} className="flex flex-col gap-4">
              <label className="text-sm font-semibold">
                Nom du service
                <input required value={editName} onChange={e => setEditName(e.target.value)} className="input mt-1" />
              </label>
              <label className="text-sm font-semibold">
                Temps d'attente moyen (minutes)
                <input type="number" min={1} required value={editMinutes} onChange={e => setEditMinutes(Number(e.target.value))} className="input mt-1" />
              </label>
              <label className="text-sm font-semibold">
                Formulaire de collecte
                <select value={editTemplate} onChange={e => setEditTemplate(e.target.value)} className="input mt-1 bg-white">
                  <option value="">-- Aucun formulaire --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Ouverture
                  <input type="time" value={editOpeningTime} onChange={e => setEditOpeningTime(e.target.value)} className="input mt-1" />
                </label>
                <label className="text-sm font-semibold">
                  Fermeture
                  <input type="time" value={editClosingTime} onChange={e => setEditClosingTime(e.target.value)} className="input mt-1" />
                </label>
              </div>
              <label className="flex items-center justify-between rounded-xl border border-[#e5e5df] p-3 text-sm font-semibold">
                Service actif
                <input type="checkbox" checked={editIsActive} onChange={e => setEditIsActive(e.target.checked)} className="h-4 w-4" />
              </label>
              <div className="mt-4 flex gap-2">
                <Button type="button" onClick={closeEditService} variant="secondary" className="flex-1">Annuler</Button>
                <Button type="submit" disabled={submitting} className="flex-1">{submitting ? "Enregistrement..." : "Enregistrer"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQr && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="no-print flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.13em] text-[#c45b1a]">QR public</p>
                <h2 className="mt-2 text-xl font-bold">{activeQrName}</h2>
              </div>
              <button onClick={() => setShowQr(false)} className="focus-ring text-sm font-bold text-[#667085]">Fermer</button>
            </div>
            
            <div className="print-poster mx-auto mt-6 rounded-2xl border border-[#e5e5df] bg-white p-6 text-center">
              <div className="flex justify-center mb-3"><img src={filzIcon} alt="Filz" className="h-8 w-8" /></div>
              <h1 className="mt-3 text-2xl font-extrabold tracking-[-.04em] text-[#172033]">Scannez pour rejoindre la file</h1>
              <p className="mt-2 text-sm font-semibold text-[#596477]">{activeBranchName} · {activeQrName}</p>
              <div className="mx-auto mt-6 flex h-56 w-56 items-center justify-center bg-white p-3">
                <QRCode value={activePublicUrl} size={200} />
              </div>
              <p className="mx-auto mt-5 max-w-xs text-xs leading-5 text-[#667085]">
                Aucun téléchargement d’application. Scannez, remplissez le formulaire, puis suivez votre position en temps réel.
              </p>
            </div>
            
            <div className="no-print mt-5 grid gap-2 sm:grid-cols-3">
              <Button onClick={copyPublicUrl} variant="secondary" icon={<HugeiconsIcon icon={Copy01Icon} size={16} />}>Copier</Button>
              <Button onClick={printQrPoster} variant="secondary" icon={<HugeiconsIcon icon={PrinterIcon} size={16} />}>Imprimer</Button>
              <Button onClick={printQrPoster} icon={<HugeiconsIcon icon={Download01Icon} size={16} />}>PDF</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
