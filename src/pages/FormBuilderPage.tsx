import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, ArrowDown01Icon, ArrowUp01Icon, Delete02Icon, DragDropIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader } from "../components/ui/Ui";
import { api } from "../utils/api";

interface FormField {
  id?: string;
  label: string;
  key: string;
  field_type: "text" | "textarea" | "select" | "phone" | "number";
  is_required: boolean;
  options?: string[];
  display_order: number;
}

interface FormTemplate {
  id: string;
  name: string;
  business_type: string;
  fields: FormField[];
}

export function FormBuilderPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<FormTemplate | null>(null);
  
  const [fields, setFields] = useState<FormField[]>([]);
  const [templateName, setTemplateName] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTemplates = () => {
    setLoading(true);
    api.get("/admin/form-templates")
      .then((data: FormTemplate[]) => {
        setTemplates(data);
        if (data.length > 0 && !activeTemplate) {
          selectTemplate(data[0]);
        }
      })
      .catch(() => setError("Erreur de chargement des formulaires."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const selectTemplate = (template: FormTemplate) => {
    setActiveTemplate(template);
    setTemplateName(template.name);
    // Sort fields by display_order
    const sortedFields = [...template.fields].sort((a, b) => a.display_order - b.display_order);
    setFields(sortedFields);
    setSuccess(null);
    setError(null);
  };

  const handleCreateNew = () => {
    const newTemp: FormTemplate = {
      id: "new",
      name: "Nouveau Modèle",
      business_type: "generic",
      fields: [
        { label: "Nom complet", key: "nom", field_type: "text", is_required: true, display_order: 1 },
        { label: "Téléphone", key: "telephone", field_type: "phone", is_required: true, display_order: 2 }
      ]
    };
    setActiveTemplate(newTemp);
    setTemplateName(newTemp.name);
    setFields(newTemp.fields);
    setSuccess(null);
    setError(null);
  };

  const updateField = (index: number, patch: Partial<FormField>) => {
    setFields(current => {
      const next = [...current];
      next[index] = { ...next[index], ...patch };
      // auto-generate key if label changes and no key is set yet
      if (patch.label && (!next[index].key || next[index].key.startsWith("custom-"))) {
        next[index].key = patch.label.toLowerCase().replace(/[^a-z0-9]/g, "_");
      }
      return next;
    });
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addField = () => {
    setFields(current => [
      ...current, 
      { 
        label: "Nouveau champ", 
        key: `custom_${Date.now()}`, 
        field_type: "text", 
        is_required: false,
        display_order: current.length + 1
      }
    ]);
  };

  const removeField = (index: number) => {
    setFields(current => current.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!activeTemplate || !templateName.trim()) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    // Ensure display_order is correct before saving
    const formattedFields = fields.map((f, i) => ({
      label: f.label,
      key: f.key,
      field_type: f.field_type,
      is_required: f.is_required,
      options: f.options,
      display_order: i + 1
    }));

    try {
      if (activeTemplate.id === "new") {
        const res = await api.post("/admin/form-templates", {
          name: templateName,
          business_type: "generic",
          fields: formattedFields
        });
        setTemplates([...templates, res]);
        selectTemplate(res);
        setSuccess("Modèle créé avec succès !");
      } else {
        const res = await api.patch(`/admin/form-templates/${activeTemplate.id}`, {
          name: templateName,
          fields: formattedFields
        });
        setTemplates(templates.map(t => t.id === res.id ? res : t));
        selectTemplate(res);
        setSuccess("Modifications enregistrées !");
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="Configuration" 
        title="Formulaire d’entrée" 
        description="Créez et modifiez les formulaires de collecte d'informations pour chaque service." 
        action={<Button onClick={handleSave} disabled={saving || !activeTemplate}>{saving ? "Sauvegarde..." : "Enregistrer"}</Button>} 
      />

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100">{success}</div>}

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_310px]">
        {/* SIDEBAR: TEMPLATES LIST */}
        <aside className="rounded-2xl border border-[#e5e5df] bg-white p-4">
          <div className="flex items-center justify-between mb-3 px-2">
            <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929aa7]">Vos Modèles</p>
            <button onClick={handleCreateNew} className="text-[#e87325] hover:bg-[#fff1e5] p-1 rounded-md">
              <HugeiconsIcon icon={Add01Icon} size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {loading && <p className="text-xs text-[#778091] px-2">Chargement...</p>}
            {templates.map((template) => (
              <button 
                onClick={() => selectTemplate(template)} 
                key={template.id} 
                className={`focus-ring w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${activeTemplate?.id === template.id ? "bg-[#fff1e5] text-[#b94d10]" : "text-[#596477] hover:bg-[#f5f5f2]"}`}
              >
                {template.name}
              </button>
            ))}
            {activeTemplate?.id === "new" && (
              <button className="focus-ring w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold bg-[#fff1e5] text-[#b94d10]">
                {templateName || "Nouveau Modèle"}
              </button>
            )}
          </div>
          
          {activeTemplate && (
            <div className="mt-6 border-t border-[#efefea] px-2 pt-5">
              <p className="text-xs font-bold text-[#344054]">
                Modèle sélectionné
              </p>
              <input 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)} 
                placeholder="Nom du modèle"
                className="input mt-2 px-2 py-1.5 w-full text-sm font-bold"
              />
            </div>
          )}
        </aside>

        {/* MAIN EDITOR */}
        <section className="rounded-2xl border border-[#e5e5df] bg-white p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold">Champs du formulaire</h2>
              <p className="mt-1 text-xs text-[#7a8492]">Modifiez le libellé, le type, et réordonnez les champs.</p>
            </div>
            <span className="rounded-lg bg-[#f4f4f1] px-2 py-1 text-xs font-bold text-[#667085]">{fields.length} champs</span>
          </div>
          
          <div className="mt-6 space-y-2">
            {!activeTemplate && <p className="text-sm text-[#778091] text-center py-10">Sélectionnez ou créez un modèle pour commencer.</p>}
            
            {activeTemplate && fields.map((field, index) => (
              <div key={index} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e8e8e2] bg-[#fff] p-3">
                <HugeiconsIcon icon={DragDropIcon} size={18} className="text-[#afb5be]" />
                <div className="min-w-[150px] flex-1">
                  <input 
                    aria-label="Libellé du champ" 
                    value={field.label} 
                    onChange={(e) => updateField(index, { label: e.target.value })} 
                    className="focus-ring w-full rounded-lg border-0 bg-transparent px-1 py-1 text-sm font-semibold" 
                    placeholder="Libellé"
                  />
                </div>
                <select 
                  aria-label="Type de champ" 
                  value={field.field_type} 
                  onChange={(e) => updateField(index, { field_type: e.target.value as FormField["field_type"] })} 
                  className="focus-ring rounded-lg border border-[#deded8] bg-white px-2 py-1.5 text-xs text-[#596477]"
                >
                  <option value="text">Texte court</option>
                  <option value="phone">Téléphone</option>
                  <option value="select">Liste (Choix)</option>
                  <option value="textarea">Texte long</option>
                  <option value="number">Nombre</option>
                </select>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#596477]">
                  <input 
                    checked={field.is_required} 
                    onChange={(e) => updateField(index, { is_required: e.target.checked })} 
                    type="checkbox" 
                    className="accent-[#e87325]" 
                  />
                  Requis
                </label>
                <div className="flex items-center">
                  <button aria-label="Monter le champ" onClick={() => moveField(index, -1)} className="focus-ring rounded-md p-1 text-[#7a8492] hover:bg-[#f2f2ee]">
                    <HugeiconsIcon icon={ArrowUp01Icon} size={15} />
                  </button>
                  <button aria-label="Descendre le champ" onClick={() => moveField(index, 1)} className="focus-ring rounded-md p-1 text-[#7a8492] hover:bg-[#f2f2ee]">
                    <HugeiconsIcon icon={ArrowDown01Icon} size={15} />
                  </button>
                  <button aria-label="Supprimer le champ" onClick={() => removeField(index)} className="focus-ring ml-1 rounded-md p-1 text-[#a86a64] hover:bg-[#fff0ed]">
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </button>
                </div>
                
                {field.field_type === "select" && (
                  <div className="w-full mt-2 pt-2 border-t border-[#f4f4f1]">
                    <input 
                      placeholder="Options (séparées par une virgule)"
                      value={field.options?.join(", ") || ""}
                      onChange={(e) => updateField(index, { options: e.target.value.split(",").map(s => s.trim()) })}
                      className="input w-full text-xs py-1.5"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {activeTemplate && (
            <button onClick={addField} className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d6d6cf] py-3 text-sm font-bold text-[#b94d10] hover:bg-[#fffaf5]">
              <HugeiconsIcon icon={Add01Icon} size={17} />
              Ajouter un champ
            </button>
          )}
        </section>

        {/* PREVIEW */}
        <aside className="rounded-2xl border border-[#e5e5df] bg-white p-5 hidden xl:block">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929aa7]">Aperçu mobile</p>
          <div className="mt-4 rounded-[24px] border-[6px] border-[#172033] bg-[#fafaf8] p-4 shadow-lg min-h-[400px]">
            <span className="block text-[10px] font-bold text-[#c45b1a]">{templateName || "VOTRE ENTREPRISE"}</span>
            <p className="mt-2 text-sm font-bold">Bienvenue, rejoignez la file</p>
            <p className="mt-1 text-[10px] leading-4 text-[#778091]">Veuillez remplir ces informations.</p>
            <div className="mt-4 space-y-3">
              {fields.slice(0, 5).map((field, i) => (
                <div key={i}>
                  <span className="text-[9px] font-bold text-[#4d5768]">{field.label}{field.is_required && " *"}</span>
                  {field.field_type === "textarea" ? (
                    <span className="mt-1 block h-10 rounded-md border border-[#deded8] bg-white" />
                  ) : field.field_type === "select" ? (
                    <span className="mt-1 flex items-center justify-between h-6 rounded-md border border-[#deded8] bg-white px-2">
                      <span className="text-[8px] text-[#a0a5b1]">Sélectionner...</span>
                      <HugeiconsIcon icon={ArrowDown01Icon} size={10} className="text-[#a0a5b1]" />
                    </span>
                  ) : (
                    <span className="mt-1 block h-6 rounded-md border border-[#deded8] bg-white" />
                  )}
                </div>
              ))}
              {fields.length > 5 && <p className="text-[9px] text-center text-[#a0a5b1] italic">... {fields.length - 5} autres champs</p>}
            </div>
            <span className="mt-5 block rounded-lg bg-[#e87325] py-2 text-center text-[10px] font-bold text-white shadow-sm">
              Rejoindre la file
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}