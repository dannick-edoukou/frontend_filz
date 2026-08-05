import { ReactNode, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { HugeiconsIcon } from "@hugeicons/react";
import { Activity03Icon, DashboardSquare01Icon, File02Icon, HeadphonesIcon, Menu01Icon, Notification01Icon, Settings01Icon, ShoppingBag01Icon, UserGroupIcon, Clock01Icon, Cancel01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { Screen } from "../../types";
import { api, getUserRole, getOrgSlug } from "../../utils/api";
import { Button } from "../ui/Ui";
import { useToast } from "../ui/Toast";
import filzIcon from "../../assets/filz_icon.png";

type NavItem = {id: Screen;label: string;icon: typeof DashboardSquare01Icon;roles?: "admin" | "staff";};

const navigation: NavItem[] = [
  { id: "overview", label: "Tableau de bord", icon: Activity03Icon, roles: "admin" },
  { id: "queues", label: "Files d’attente", icon: UserGroupIcon, roles: "admin" },
  { id: "history", label: "Historique", icon: Clock01Icon, roles: "admin" },
  { id: "services", label: "Services", icon: ShoppingBag01Icon, roles: "admin" },
  { id: "forms", label: "Formulaires", icon: File02Icon, roles: "admin" },
  { id: "staff", label: "Console staff", icon: UserGroupIcon, roles: "staff" },
  { id: "establishments", label: "Établissements", icon: ShoppingBag01Icon, roles: "admin" },
  { id: "team", label: "Équipe & accès", icon: UserGroupIcon, roles: "admin" },
  { id: "notifications", label: "Notifications", icon: Notification01Icon, roles: "admin" },
];

type UserInfo = {
  full_name: string;
  email: string;
  role: string;
};

type OrgInfo = {
  name: string;
  slug: string;
  business_type: string;
  subscription?: {
    status: string;
    current_period_end: string | null;
  } | null;
} | null;

function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getSubscriptionWarning(org: OrgInfo): { type: "warning" | "error"; title: string; message: string } | null {
  if (!org?.subscription) return null;
  const { status, current_period_end } = org.subscription;
  if (!current_period_end) return null;

  const endDate = new Date(current_period_end);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (status === "expired" || diffDays <= 0) {
    return {
      type: "error",
      title: "Abonnement expiré",
      message: "🚨 Votre abonnement a expiré. Vos files de check-in sont temporairement suspendues. Veuillez régulariser votre abonnement.",
    };
  }

  if (diffDays <= 3) {
    return {
      type: "warning",
      title: "Abonnement",
      message: `⚠️ Votre période d'abonnement se termine le ${endDate.toLocaleDateString("fr-FR")} (dans ${diffDays} jour${diffDays > 1 ? "s" : ""}). Pensez à renouveler pour éviter toute coupure.`,
    };
  }

  return null;
}

export function AppShell({ screen, onNavigate, children }: {screen: Screen;onNavigate: (screen: Screen) => void;children: ReactNode;}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [org, setOrg] = useState<OrgInfo>(null);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await api.get("/auth/me");
        if (!cancelled) {
          setUser(res.user);
          setOrg(res.organization);
        }
      } catch (err) {
        console.warn("Impossible de charger /auth/me :", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    loadMe();
    return () => { cancelled = true; };
  }, []);

  const role = getUserRole() || (user?.role === "company_admin" ? "admin" : user?.role === "staff" ? "staff" : user?.role || "");
  const visibleNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    if (role === "superadmin") return true;
    if (item.roles === "admin") return role === "admin" || role === "company_admin";
    return item.roles === "staff";
  });

  const displayName = loading ? "Chargement…" : user?.full_name || "Invité";
  const displayRole = loading ? "…" : user ? (role === "company_admin" || role === "admin" ? "Admin" : role === "staff" ? "Staff" : role === "superadmin" ? "Superadmin" : user.role) : "";
  const displayOrg = org?.name || "";
  const headerSubtitle = displayOrg ? `${displayOrg} · ${role === "superadmin" ? "Plateforme" : "Console"}` : "Console";
  const initials = getInitials(displayName);

  const navigate = (target: Screen) => { onNavigate(target); setMobileOpen(false); };
  const activeScreen = screen;
  const orgSlug = getOrgSlug();
  const checkinUrl = `${window.location.origin}/?screen=checkin&slug=${orgSlug}`;

  const { showToast } = useToast();

  useEffect(() => {
    const w = getSubscriptionWarning(org);
    if (!w) return;
    showToast({ type: w.type, title: w.title, message: w.message, duration: 20000 });
  }, [org, showToast]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      {mobileOpen && (
        <button
          aria-label="Fermer la navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-pine-950/60 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-4 top-1/2 z-40 flex h-[calc(100vh-2rem)] w-[274px] -translate-y-1/2 flex-col rounded-[28px] bg-pine-950 px-4 py-5 shadow-[0_24px_60px_rgba(18,51,45,0.35)] ring-1 ring-white/10 transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        <button
          onClick={() => navigate("overview")}
          className="focus-ring flex items-center gap-3 rounded-xl px-2 py-2 text-left"
        >
          <img src={filzIcon} alt="Filz" className="h-10 w-10 rounded-xl" />
          <span className="font-display text-lg font-semibold tracking-tight text-paper">Filz</span>
        </button>
        <nav aria-label="Navigation principale" className="mt-9 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-pine-100/50">
            Gestion
          </p>
          {visibleNavigation.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`focus-ring flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-pine-800 text-gold-300"
                    : "text-pine-100/80 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <HugeiconsIcon icon={item.icon} size={19} strokeWidth={2} />
                {item.label}
                {item.id === "staff" && (
                  <span className="ml-auto rounded-md bg-gold-400 px-1.5 py-0.5 text-[9px] font-extrabold text-pine-950">
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
          {role !== "staff" && (
            <>
              <button
                onClick={() => navigate("support")}
                className={`focus-ring flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-semibold ${
                  screen === "support" ? "bg-pine-800 text-gold-300" : "text-pine-100/80 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <HugeiconsIcon icon={HeadphonesIcon} size={19} />
                Support
              </button>
              <button
                onClick={() => navigate("subscription")}
                className={`focus-ring flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-semibold ${
                  screen === "subscription" || screen === "invoices"
                    ? "bg-pine-800 text-gold-300"
                    : "text-pine-100/80 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <HugeiconsIcon icon={ShoppingBag01Icon} size={19} />
                Abonnement
              </button>
              <button
                onClick={() => navigate("invoices")}
                className={`focus-ring flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-semibold ${
                  screen === "invoices" ? "bg-pine-800 text-gold-300" : "text-pine-100/80 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <HugeiconsIcon icon={File02Icon} size={19} />
                Factures
              </button>
              <button
                onClick={() => navigate("settings")}
                className={`focus-ring flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-left text-sm font-semibold ${
                  screen === "settings" ? "bg-pine-800 text-gold-300" : "text-pine-100/80 hover:bg-white/5 hover:text-paper"
                }`}
              >
                <HugeiconsIcon icon={Settings01Icon} size={19} />
                Réglages
              </button>
            </>
          )}
          <button
            onClick={() => {
              localStorage.removeItem("filz_token");
              localStorage.removeItem("filz_user_role");
              localStorage.removeItem("filz_org_id");
              window.location.href = "/";
            }}
            className="focus-ring flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-semibold text-clay-300 hover:bg-white/5"
          >
            Déconnexion
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-full bg-white/5 p-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gold-400 text-xs font-bold text-pine-950">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-paper">{displayName}</p>
            <p className="truncate text-[11px] text-pine-100/60">
              {displayRole}
              {displayOrg ? ` · ${displayOrg}` : ""}
            </p>
          </div>
        </div>
      </aside>
      <div className="lg:pl-[298px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:px-9">
          <button
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(true)}
            className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-line bg-white lg:hidden"
          >
            <HugeiconsIcon icon={Menu01Icon} size={20} />
          </button>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-ink-soft">{headerSubtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-ink-soft sm:inline">
              Dernière synchro · à l’instant
            </span>
            <button
              onClick={() => setShowQrModal(true)}
              className="focus-ring flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-paper"
            >
              <HugeiconsIcon icon={DashboardSquare01Icon} size={15} className="text-gold-600" />
              Voir le QR public
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1520px] p-4 sm:p-7 lg:p-9">{children}</main>
      </div>

      {showQrModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-pine-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-ticket">
            <div className="flex items-start justify-between border-b border-line p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.13em] text-gold-700">
                  QR public
                </p>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">Code QR général</h2>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="focus-ring grid h-8 w-8 place-items-center rounded-xl bg-paper text-sm font-bold text-ink-soft hover:bg-sand"
                aria-label="Fermer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </button>
            </div>

            <div className="p-5">
              <div className="mx-auto flex w-[260px] items-center justify-center rounded-2xl border border-line bg-white p-3">
                <QRCode value={checkinUrl} size={240} fgColor="#12332D" />
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-ink-soft">
                Imprimez et affichez ce code à l'entrée. Les visiteurs scannent, choisissent leur service et
                suivent leur position en temps réel.
              </p>

              <div className="mt-4 grid gap-2">
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
                    checkinUrl,
                  )}`}
                  download={`QR-General-${orgSlug}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="no-underline"
                >
                  <Button className="w-full">
                    <HugeiconsIcon icon={Download01Icon} size={16} />
                    Télécharger le QR
                  </Button>
                </a>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    void navigator.clipboard?.writeText(checkinUrl);
                  }}
                >
                  Copier le lien public
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
