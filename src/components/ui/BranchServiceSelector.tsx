import { useEffect, useState } from "react";
import { api } from "../../utils/api";

interface Branch {
  id: string;
  name: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  average_service_minutes: number;
}

interface BranchServiceSelectorProps {
  selectedBranchId: string;
  selectedServiceId: string;
  onBranchChange: (branchId: string) => void;
  onServiceChange: (serviceId: string) => void;
  allowAllServices?: boolean;
  className?: string;
}

export function BranchServiceSelector({
  selectedBranchId,
  selectedServiceId,
  onBranchChange,
  onServiceChange,
  allowAllServices = false,
  className = "",
}: BranchServiceSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load branches on mount
  useEffect(() => {
    let cancelled = false;
    api.get("/organization/branches")
      .then((data) => {
        if (cancelled) return;
        setBranches(data);
      })
      .catch(() => {
        if (cancelled) return;
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Auto-select the first branch if none is selected
  useEffect(() => {
    if (!selectedBranchId && branches.length > 0) {
      onBranchChange(branches[0].id);
    }
  }, [branches, selectedBranchId, onBranchChange]);

  // Load services when branch changes
  useEffect(() => {
    let cancelled = false;
    if (!selectedBranchId) return;
    api.get(`/admin/branches/${selectedBranchId}/services`)
      .then((data) => {
        if (cancelled) return;
        setServices(data);
      })
      .catch(() => {
        if (cancelled) return;
      });
    return () => { cancelled = true; };
  }, [selectedBranchId]);

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-[#e6e6e0] ${className}`}>
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[#687385] uppercase">Agence</label>
        <select 
          value={selectedBranchId} 
          onChange={(e) => onBranchChange(e.target.value)} 
          className="bg-white border border-[#deded8] px-3 py-1.5 rounded-lg text-xs font-semibold"
          disabled={loading}
        >
          {loading ? (
            <option>Chargement...</option>
          ) : branches.length === 0 ? (
            <option>Aucune agence</option>
          ) : (
            branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
          )}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[#687385] uppercase">Service</label>
        <select 
          value={selectedServiceId} 
          onChange={(e) => onServiceChange(e.target.value)} 
          className="bg-white border border-[#deded8] px-3 py-1.5 rounded-lg text-xs font-semibold"
          disabled={loading}
        >
          {allowAllServices && <option value="">Tous les services</option>}
          {services.length === 0 ? (
            <option>Aucun service</option>
          ) : (
            services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
          )}
        </select>
      </div>
    </div>
  );
}
