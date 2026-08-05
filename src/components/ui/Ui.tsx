import { ButtonHTMLAttributes, ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkCircle01Icon, Clock01Icon } from "@hugeicons/core-free-icons";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
  size?: "md" | "sm";
};

export function Button({ className = "", children, variant = "primary", icon, size = "md", type = "button", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-pine-900 text-paper hover:bg-pine-950 shadow-[0_8px_18px_rgba(18,51,45,0.20)]",
    secondary: "bg-white text-ink border border-line hover:border-pine-200 hover:bg-paper",
    ghost: "text-ink-soft hover:bg-sand",
    danger: "bg-clay-100 text-clay-700 hover:bg-clay-300/60"
  };
  const sizes = {
    md: "px-4 h-10 text-sm",
    sm: "px-3 h-9 text-xs",
  };
  return <button type={type} className={`focus-ring inline-flex touch-target items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props} aria-label={props["aria-label"]}>{icon}{children}</button>;
}

export function PageHeader({ eyebrow, title, description, action }: {eyebrow?: string;title: string;description: string;action?: ReactNode;}) {
  return <header className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-gold-700">{eyebrow}</p>}
      <h1 className="font-display text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-[30px]">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft">{description}</p>
    </div>
    {action}
  </header>;
}

export function StatusBadge({ state }: { state: string; }) {
  const labelMap: Record<string, string> = { waiting: "En attente", preparing: "En préparation", called: "Appelé", serving: "En service", absent: "Absent", completed: "Terminé", open: "Ouverte", paused: "En pause", in_progress: "En cours", resolved: "Résolu", active: "Actif", inactive: "Inactif", closed: "Fermé", cancelled: "Annulé", served: "Servi", trialing: "Essai", past_due: "En retard", pending: "En attente approbation" };
  const colorMap: Record<string, string> = { waiting: "bg-gold-100 text-gold-700", preparing: "bg-pine-100 text-pine-800", called: "bg-gold-300 text-pine-950", serving: "bg-pine-100 text-pine-800", absent: "bg-sand text-ink-soft", completed: "bg-pine-100 text-pine-800", open: "bg-pine-100 text-pine-800", paused: "bg-gold-100 text-gold-700", in_progress: "bg-gold-100 text-gold-700", resolved: "bg-sand text-ink-soft", active: "bg-pine-100 text-pine-800", inactive: "bg-sand text-ink-soft", closed: "bg-sand text-ink-soft", cancelled: "bg-sand text-ink-soft", served: "bg-pine-100 text-pine-800", trialing: "bg-gold-100 text-gold-700", past_due: "bg-clay-100 text-clay-700", pending: "bg-gold-100 text-gold-700" };
  const fallback = "bg-sand text-ink-soft";
  const text = labelMap[state] ?? (state ? `${state[0].toUpperCase()}${state.slice(1).replace(/_/g, " ")}` : "—");
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colorMap[state] ?? fallback}`} role="status" aria-label={`Statut: ${text}`}>{text}</span>;
}

export function MetricCard({ label, value, helper, tone = "orange", icon }: {label: string;value: string;helper: string;tone?: "orange" | "green" | "blue" | "charcoal";icon?: ReactNode;}) {
  const tones = { orange: "bg-gold-100 text-gold-700", green: "bg-pine-100 text-pine-800", blue: "bg-pine-100 text-pine-800", charcoal: "bg-sand text-ink-soft" };
  return <article className="rounded-2xl border border-line bg-white p-5 shadow-card">
    <div className="flex items-start justify-between"><p className="text-sm font-medium text-ink-soft">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span></div>
    <p className="mt-5 font-mono text-[26px] font-semibold tracking-[-0.04em] text-ink">{value}</p>
    <p className="mt-2 text-xs text-ink-faint">{helper}</p>
  </article>;
}

export function EmptyState({ title, text, action, ariaLabel }: {title: string;text: string;action?: ReactNode; ariaLabel?: string;}) {
  return <div className="rounded-2xl border border-dashed border-line bg-paper px-6 py-10 text-center" role="status" aria-label={ariaLabel || title}><div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700"><HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} /></div><h3 className="mt-4 text-sm font-bold text-ink">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-ink-soft">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function SmallLink({ children, ariaLabel }: {children: ReactNode; ariaLabel?: string;}) {return <button className="focus-ring inline-flex touch-target-sm items-center gap-1 rounded-md text-sm font-bold text-gold-700 hover:text-gold-600" aria-label={ariaLabel}>{children}<HugeiconsIcon icon={ArrowRight01Icon} size={15} /></button>;}
export function WaitIcon() {return <HugeiconsIcon icon={Clock01Icon} size={19} strokeWidth={2} />;}
