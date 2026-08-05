import { useState, useEffect, ReactNode, Suspense, lazy } from "react";
import { AppShell } from "./components/layout/AppShell";
import { SuperadminShell } from "./components/layout/SuperadminShell";
import { Screen } from "./types";
import { ToastProvider } from "./components/ui/Toast";
import { getAuthToken, getUserRole } from "./utils/api";

// Route-level code splitting: each screen is fetched on demand so the initial
// bundle stays small instead of inlining every page in one big chunk.
function lazyPage<T extends Record<string, unknown>>(importFn: () => Promise<T>, name: keyof T) {
  return lazy(() => importFn().then((m) => ({ default: m[name] as React.ComponentType<any> })));
}

const LandingPage = lazyPage(() => import("./pages/LandingPage"), "LandingPage");
const PricingPage = lazyPage(() => import("./pages/PricingPage"), "PricingPage");
const PartnerPage = lazyPage(() => import("./pages/PartnerPage"), "PartnerPage");
const PartnerLoginPage = lazyPage(() => import("./pages/PartnerLoginPage"), "PartnerLoginPage");
const PartnerDashboard = lazyPage(() => import("./pages/PartnerDashboard"), "PartnerDashboard");
const LoginPage = lazyPage(() => import("./pages/LoginPage"), "LoginPage");
const OverviewPage = lazyPage(() => import("./pages/OverviewPage"), "OverviewPage");
const QueuesPage = lazyPage(() => import("./pages/QueuesPage"), "QueuesPage");
const ServicesPage = lazyPage(() => import("./pages/ServicesPage"), "ServicesPage");
const FormBuilderPage = lazyPage(() => import("./pages/FormBuilderPage"), "FormBuilderPage");
const StaffPage = lazyPage(() => import("./pages/StaffPage"), "StaffPage");
const SupportPage = lazyPage(() => import("./pages/SupportPage"), "SupportPage");
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"), "SettingsPage");
const SubscriptionPage = lazyPage(() => import("./pages/SubscriptionPage"), "SubscriptionPage");
const PublicCheckinPage = lazyPage(() => import("./pages/PublicCheckinPage"), "PublicCheckinPage");
const PublicStatusPage = lazyPage(() => import("./pages/PublicStatusPage"), "PublicStatusPage");
const SignupPage = lazyPage(() => import("./pages/SignupPage"), "SignupPage");
const OnboardingPage = lazyPage(() => import("./pages/OnboardingPage"), "OnboardingPage");
const EstablishmentsPage = lazyPage(() => import("./pages/EstablishmentsPage"), "EstablishmentsPage");
const TeamPage = lazyPage(() => import("./pages/TeamPage"), "TeamPage");
const SuperadminPage = lazyPage(() => import("./pages/SuperadminPage"), "SuperadminPage");
const HistoryPage = lazyPage(() => import("./pages/HistoryPage"), "HistoryPage");
const TicketDetailPage = lazyPage(() => import("./pages/TicketDetailPage"), "TicketDetailPage");
const NotificationsPage = lazyPage(() => import("./pages/NotificationsPage"), "NotificationsPage");
const InvoicesPage = lazyPage(() => import("./pages/InvoicesPage"), "InvoicesPage");
const AccessStatePage = lazyPage(() => import("./pages/AccessStatePage"), "AccessStatePage");
const PasswordForgotPage = lazyPage(() => import("./pages/PasswordForgotPage"), "PasswordForgotPage");
const PasswordResetPage = lazyPage(() => import("./pages/PasswordResetPage"), "PasswordResetPage");
const EmailVerificationPage = lazyPage(() => import("./pages/EmailVerificationPage"), "EmailVerificationPage");
const StaffInvitePage = lazyPage(() => import("./pages/StaffInvitePage"), "StaffInvitePage");
const ErrorStatePage = lazyPage(() => import("./pages/ErrorStatePage"), "ErrorStatePage");
const MissingSlugPage = lazyPage(() => import("./pages/MissingSlugPage"), "MissingSlugPage");
const AdminPlansPage = lazyPage(() => import("./pages/AdminPlansPage"), "AdminPlansPage");
const AdminSupportPage = lazyPage(() => import("./pages/AdminSupportPage"), "AdminSupportPage");

function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper" role="status" aria-label="Chargement">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-pine-100 border-t-pine-800" />
    </div>
  );
}

// Analytics is merged into OverviewPage to avoid duplicate dashboard content.

function SuperadminScreen({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const map: Record<string, ReactNode> = {
    superadmin: <SuperadminPage onNavigate={onNavigate} />,
    "admin-plans": <AdminPlansPage />,
    "admin-support": <AdminSupportPage />,
  };
  const content = map[screen] ?? <SuperadminPage onNavigate={onNavigate} />;
  return <SuperadminShell screen={screen} onNavigate={onNavigate}>{content}</SuperadminShell>;
}

function AuthenticatedScreen({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const map: Record<string, ReactNode> = {
    overview: <OverviewPage onNavigate={onNavigate} />,
    analytics: <OverviewPage onNavigate={onNavigate} />,
    queues: <QueuesPage onOpenTicket={(id: string) => { setActiveTicketId(id); onNavigate("ticket"); }} onNavigate={onNavigate} />,
    ticket: <TicketDetailPage ticketId={activeTicketId} onBack={() => onNavigate("queues")} />,
    history: <HistoryPage />,
    services: <ServicesPage />,
    forms: <FormBuilderPage />,
    staff: <StaffPage />,
    establishments: <EstablishmentsPage onNavigate={onNavigate} />,
    team: <TeamPage />,
    notifications: <NotificationsPage />,
    support: <SupportPage />,
    settings: <SettingsPage />,
    subscription: <SubscriptionPage />,
    invoices: <InvoicesPage />,
  };
  const content = map[screen] ?? <OverviewPage onNavigate={onNavigate} />;
  return <AppShell screen={screen} onNavigate={onNavigate}>{content}</AppShell>;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSlug = params.get("slug");
    const urlScreen = params.get("screen");
    const refCode = params.get("ref");

    if (urlSlug) {
      localStorage.setItem("filz_org_slug", urlSlug);
    }
    if (refCode) {
      localStorage.setItem("filz_ref_code", refCode);
    }
    if (urlScreen === "signup") {
      setScreen("signup");
      return;
    }
    if (urlScreen === "checkin") {
      const effectiveSlug = urlSlug || localStorage.getItem("filz_org_slug");
      if (!effectiveSlug) {
        setScreen("missing-slug");
        return;
      }
      setScreen("checkin");
      return;
    }
    if (urlScreen === "staff-invite" || urlScreen === "password-reset") {
      setScreen(urlScreen);
      return;
    }

    const token = getAuthToken();
    const role = getUserRole();
    if (token && role) {
      if (role === "superadmin") {
        setScreen("superadmin");
      } else if (role === "staff") {
        setScreen("queues");
      } else {
        setScreen("overview");
      }
    }
  }, []);

  const handleLogin = (role: string) => {
    if (role === "superadmin") {
      setScreen("superadmin");
    } else if (role === "staff") {
      setScreen("queues");
    } else {
      setScreen("overview");
    }
  };

  const content = (
    <>
      {screen === "landing" && <LandingPage onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} onPartner={() => setScreen("partner")} onPricing={() => setScreen("pricing")} onPartnerLogin={() => setScreen("partner-login")} />}
      {screen === "pricing" && <PricingPage onHome={() => setScreen("landing")} onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} onPartner={() => setScreen("partner")} />}
      {screen === "partner" && <PartnerPage onHome={() => setScreen("landing")} onPartnerLogin={() => setScreen("partner-login")} />}
      {screen === "partner-login" && <PartnerLoginPage onLogin={() => setScreen("partner-dashboard")} onHome={() => setScreen("landing")} />}
      {screen === "partner-dashboard" && <PartnerDashboard onLogout={() => setScreen("partner-login")} onHome={() => setScreen("landing")} />}
      {screen === "login" && <LoginPage onLogin={handleLogin} onSignup={() => setScreen("signup")} onForgotPassword={() => setScreen("password-forgot")} onAdmin={() => setScreen("superadmin")} onHome={() => setScreen("landing")} />}
      {screen === "signup" && <SignupPage onLogin={() => setScreen("login")} onComplete={() => setScreen("email-verification")} onHome={() => setScreen("landing")} />}
      {screen === "email-verification" && <EmailVerificationPage onBack={() => setScreen("signup")} onComplete={() => setScreen("login")} />}
      {screen === "onboarding" && <OnboardingPage onComplete={() => setScreen("overview")} />}
      {screen === "password-forgot" && <PasswordForgotPage onBack={() => setScreen("login")} onSent={() => setScreen("password-reset")} />}
      {screen === "password-reset" && <PasswordResetPage onBack={() => setScreen("login")} onComplete={() => setScreen("login")} />}
      {screen === "staff-invite" && <StaffInvitePage onDecline={() => setScreen("login")} onComplete={() => setScreen("staff")} />}
      {screen === "not-found" && <ErrorStatePage type="not-found" onBack={() => setScreen("login")} onSupport={() => setScreen("support")} />}
      {screen === "technical-error" && <ErrorStatePage type="technical" onBack={() => setScreen("login")} onSupport={() => setScreen("support")} />}
      {screen === "missing-slug" && <MissingSlugPage />}
      {screen === "checkin" && <PublicCheckinPage onComplete={() => setScreen("status")} onBack={() => setScreen("overview")} />}
      {screen === "status" && <PublicStatusPage onBack={() => setScreen("checkin")} />}
      {screen === "restricted" && <AccessStatePage onBack={() => setScreen("invoices")} onSupport={() => setScreen("support")} />}
      {["superadmin", "admin-plans", "admin-support"].includes(screen) && <SuperadminScreen screen={screen} onNavigate={setScreen} />}
      {!["landing", "pricing", "partner", "partner-login", "partner-dashboard", "login", "signup", "email-verification", "onboarding", "password-forgot", "password-reset", "staff-invite", "not-found", "technical-error", "missing-slug", "checkin", "status", "restricted", "superadmin", "admin-plans", "admin-support"].includes(screen) && <AuthenticatedScreen screen={screen} onNavigate={setScreen} />}
    </>
  );

  return <ToastProvider><Suspense fallback={<PageLoader />}>{content}</Suspense></ToastProvider>;
}
