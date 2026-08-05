import { ReactNode, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { DashboardSquare01Icon, HeadphonesIcon, Logout01Icon, Menu01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Screen } from "../../types";
import filzIcon from "../../assets/filz_icon.png";

type SuperadminShellProps = {screen: Screen;onNavigate: (screen: Screen) => void;children: ReactNode;};
const adminNavigation = [
{ id: "superadmin" as Screen, label: "Vue plateforme", icon: DashboardSquare01Icon },
{ id: "admin-plans" as Screen, label: "Plans & tarifs", icon: ShoppingBag01Icon },
{ id: "admin-support" as Screen, label: "Centre de support", icon: HeadphonesIcon }];


export function SuperadminShell({ screen, onNavigate, children }: SuperadminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (target: Screen) => {onNavigate(target);setMobileOpen(false);};
  return <div className="min-h-screen bg-paper text-ink">
    {mobileOpen && <button aria-label="Fermer la navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-pine-950/60 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-[274px] flex-col bg-pine-950 px-4 py-5 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <button onClick={() => navigate("superadmin")} className="focus-ring flex items-center gap-3 rounded-xl px-2 py-2 text-left"><img src={filzIcon} alt="Filz" className="h-9 w-9 rounded-xl" /><span className="font-display text-lg font-semibold tracking-tight text-paper">Filz</span></button>
      <nav aria-label="Navigation administration Fila" className="mt-9 space-y-1"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-pine-100/50">Plateforme</p>{adminNavigation.map((item) => <button key={item.id} onClick={() => navigate(item.id)} className={`focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold ${screen === item.id ? "bg-pine-800 text-gold-300" : "text-pine-100/80 hover:bg-white/5 hover:text-paper"}`}><HugeiconsIcon icon={item.icon} size={19} />{item.label}</button>)}</nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <button onClick={() => {
          import("../../utils/api").then(({ clearSession }) => {
            clearSession();
            window.location.href = "/";
          });
        }} className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-clay-300 hover:bg-white/5"> 
          <HugeiconsIcon icon={Logout01Icon} size={19} />Se déconnecter
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-xs font-bold text-pine-950">MK</span><div><p className="text-xs font-bold text-paper">Mariam Koné</p><p className="text-[11px] text-pine-100/60">Superadmin Fila</p></div></div>
    </aside>
    <div className="lg:pl-[274px]"><header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:px-9"><button aria-label="Ouvrir le menu" onClick={() => setMobileOpen(true)} className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-line bg-white lg:hidden"><HugeiconsIcon icon={Menu01Icon} size={20} /></button><p className="hidden text-xs font-semibold text-ink-soft lg:block">Console interne · accès restreint</p><span className="rounded-full bg-pine-100 px-3 py-1.5 text-[11px] font-bold text-pine-800">Superadmin</span></header><main className="mx-auto max-w-[1520px] p-4 sm:p-7 lg:p-9">{children}</main></div>
  </div>;
}
