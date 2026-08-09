import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeToggle } from "../theme/ThemeProvider";
import {
  Activity03Icon,
  ArrowRight01Icon,
  Building02Icon,
  Call02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CreditCardIcon,
  HeadphonesIcon,
  Menu01Icon,
  QrCodeIcon,
  Shield01Icon,
  ShoppingBag01Icon,
  SparklesIcon,
  Ticket01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import filzIcon from "../assets/filz_icon.png";

export function LandingPage({
  onLogin,
  onSignup,
  onPartner,
  onPricing,
  onPartnerLogin,
}: { onLogin: () => void; onSignup: () => void; onPartner: () => void; onPricing: () => void; onPartnerLogin: () => void }) {
  const pains = [
    {
      icon: Clock01Icon,
      title: "Des files qui découragent",
      text: "Quand l'attente dépasse quelques minutes, une partie de vos clients repart ou se tourne ailleurs. Chaque file d'attente peut devenir un client perdu.",
    },
    {
      icon: UserGroupIcon,
      title: "Une équipe débordée",
      text: "Vos agents répètent « encore deux minutes », gèrent le monde à l'accueil et n'ont aucun outil pour prioriser les urgences.",
    },
    {
      icon: Activity03Icon,
      title: "Aucune visibilité",
      text: "Combien de passages par jour ? Quelle heure de pointe ? Sans données, impossible d'anticiper l'affluence ni d'améliorer l'organisation.",
    },
  ];

  const steps = [
    {
      step: "01",
      icon: QrCodeIcon,
      title: "Le client scanne",
      text: "Le visiteur scanne le QR code affiché à votre accueil et indique son besoin en quelques secondes.",
    },
    {
      step: "02",
      icon: Ticket01Icon,
      title: "Il reçoit son ticket",
      text: "Il obtient son numéro et suit en direct sa position et le temps d'attente estimé sur son téléphone.",
    },
    {
      step: "03",
      icon: Call02Icon,
      title: "Vous l'appelez",
      text: "Votre agent appelle le ticket à l'écran. Le client est notifié instantanément, où qu'il se trouve.",
    },
  ];

  const features = [
    {
      icon: QrCodeIcon,
      title: "Check-in par QR code",
      text: "Vos visiteurs scannent un QR code affiché à l'accueil et rejoignent la file en quelques secondes, sans application à installer.",
    },
    {
      icon: Clock01Icon,
      title: "Position en temps réel",
      text: "Chaque visiteur suit sa position dans la file avec un temps d'attente estimé et mis à jour en continu.",
    },
    {
      icon: Call02Icon,
      title: "Appel au guichet",
      text: "Vos agents appellent les tickets à l'écran, avec notification automatique du visiteur. Fini les appels perdus dans le bruit.",
    },
    {
      icon: Building02Icon,
      title: "Multi-établissements",
      text: "Organisez plusieurs sites, services et guichets dans un seul espace, avec une file adaptée à chaque type de demande.",
    },
    {
      icon: UserGroupIcon,
      title: "Équipe organisée",
      text: "Rôles et permissions : pilotez qui prépare, appelle ou clôture chaque passage, et gardez le contrôle de l'activité.",
    },
    {
      icon: Activity03Icon,
      title: "Statistiques claires",
      text: "Mesurez les passages, les temps d'attente et l'activité par service pour mieux dimensionner vos équipes.",
    },
  ];

  const sectors = [
    { icon: Building02Icon, name: "Cliniques & cabinets" },
    { icon: CreditCardIcon, name: "Banques & administrations" },
    { icon: ShoppingBag01Icon, name: "Boutiques & commerces" },
    { icon: HeadphonesIcon, name: "Hôtels & restaurants" },
    { icon: UserGroupIcon, name: "Salons & instituts" },
    { icon: Ticket01Icon, name: "Services & ateliers" },
  ];

  const navLinks = [
    { href: "#solution", label: "Comment ça marche" },
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#secteurs", label: "Secteurs" },
  ];

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <img src={filzIcon} alt="Filz" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">Filz</span>
          </div>
          <nav className="hidden items-center gap-5 xl:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu} className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">{link.label}</a>
            ))}
            <button onClick={onPricing} className="focus-ring rounded text-sm font-semibold text-ink-soft transition-colors hover:text-ink">Tarifs</button>
            <button onClick={onPartnerLogin} className="focus-ring rounded text-sm font-semibold text-ink-soft transition-colors hover:text-ink">Espace partenaire</button>
            <button onClick={onPartner} className="focus-ring rounded-full border border-gold-300 bg-gold-100 px-4 py-2 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-200">
              Devenir partenaire
            </button>
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <ThemeToggle />
            <button onClick={onLogin} className="focus-ring hidden rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-sand sm:block">Se connecter</button>
            <button
              onClick={onSignup}
              className="focus-ring inline-flex touch-target items-center gap-2 rounded-xl bg-pine-900 px-4 text-sm font-semibold text-white shadow-primary hover:bg-pine-700"
            >
              Créer un compte
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-soft transition-colors hover:bg-sand xl:hidden"
            >
              <HugeiconsIcon icon={menuOpen ? Cancel01Icon : Menu01Icon} size={20} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-line bg-paper px-4 py-3 sm:px-6 xl:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} onClick={closeMenu} className="rounded-lg px-2 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-sand hover:text-ink">{link.label}</a>
              ))}
              <button onClick={() => { onPricing(); closeMenu(); }} className="rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-ink-soft transition-colors hover:bg-sand hover:text-ink">Tarifs</button>
              <button onClick={() => { onPartnerLogin(); closeMenu(); }} className="rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-ink-soft transition-colors hover:bg-sand hover:text-ink">Espace partenaire</button>
              <button onClick={() => { onLogin(); closeMenu(); }} className="rounded-lg px-2 py-2.5 text-left text-sm font-semibold text-ink-soft transition-colors hover:bg-sand hover:text-ink">Se connecter</button>
              <button
                onClick={() => { onPartner(); closeMenu(); }}
                className="focus-ring mt-2 inline-flex touch-target items-center justify-center gap-2 rounded-xl border border-gold-300 bg-gold-100 px-4 py-2.5 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-200"
              >
                Devenir partenaire
              </button>
            </div>
          </nav>
        )}
      </header>

      <section className="relative overflow-hidden bg-pine-950 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-pine-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              <HugeiconsIcon icon={Ticket01Icon} size={14} />
              Gestion de file d'attente par QR code
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Vos clients n'attendent plus.
              <br />
              <span className="text-gold-400">Votre accueil respire.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-pine-100/80">
              Filz organise l'accueil de vos visiteurs : ils s'inscrivent en scannant un QR code, suivent leur position
              en temps réel et sont appelés au bon moment. Sans application à télécharger, sans borne ni matériel à acheter.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onSignup}
                className="focus-ring inline-flex touch-target items-center justify-center gap-2 rounded-xl bg-pine-500 px-6 text-sm font-bold text-white shadow-primary hover:bg-pine-700"
              >
                Créer un compte gratuitement
                <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
              </button>
              <button
                onClick={onLogin}
                className="focus-ring inline-flex touch-target items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                J'ai déjà un compte
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[28px] border border-line bg-white p-6 text-center shadow-ticket sm:p-8">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900">
                <HugeiconsIcon icon={QrCodeIcon} size={26} />
              </span>
              <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-ink-faint">Ticket numéro</p>
              <p className="mt-1 font-display text-6xl font-semibold leading-none tracking-tight text-ink">042</p>
              <p className="mt-4 text-sm text-ink-soft">Bonjour Aminata, vous êtes bien enregistrée dans la file d'attente.</p>
              <div className="relative mt-6">
                <div className="border-t-2 border-dashed border-line" />
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Filz · ticket</span>
              </div>
              <div className="mt-6 grid grid-cols-2 divide-x divide-line border-y border-line">
                <div className="py-4">
                  <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-ink">03</p>
                  <p className="mt-1 text-[11px] text-ink-faint">personnes devant vous</p>
                </div>
                <div className="py-4">
                  <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-ink">12<span className="text-xl"> min</span></p>
                  <p className="mt-1 text-[11px] text-ink-faint">temps estimé</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 -z-10 hidden h-full w-full rounded-[28px] bg-gold-500/15 sm:block" />
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={QrCodeIcon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">Aucune application à installer</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Clock01Icon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">Sans borne ni matériel à acheter</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Building02Icon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">Multi-établissements & services</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Shield01Icon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">Données privées et protégées</span>
            </div>
          </div>
        </div>
      </section>

      <section id="probleme" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-clay-600">Le constat</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Attendre fait fuir vos clients. Et épuise vos équipes.
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Sans organisation, chaque heure de pointe devient une épreuve : pour vos visiteurs, pour vos agents, pour votre image.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {pains.map((pain) => (
            <article key={pain.title} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-clay-100 text-clay-700">
                <HugeiconsIcon icon={pain.icon} size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">{pain.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{pain.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="solution" className="scroll-mt-24 bg-pine-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              <HugeiconsIcon icon={SparklesIcon} size={14} />
              La solution
            </p>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Filz transforme votre accueil en un guichet calme et organisé
            </h2>
            <p className="mt-4 text-sm leading-6 text-pine-100/80">
              Un parcours simple, qui tient dans un QR code : votre client se numérote, s'installe à l'aise, et revient au bon moment.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {steps.map((step) => (
              <article key={step.step} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-gold-400">{step.step}</p>
                <span className="mt-5 grid h-11 w-11 place-items-center rounded-xl bg-gold-500/15 text-gold-300">
                  <HugeiconsIcon icon={step.icon} size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-pine-100/75">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="scroll-mt-24 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Fonctionnalités</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Tout ce qu'il faut pour un accueil sans friction
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            De l'inscription du visiteur à la clôture du passage, Filz centralise toute votre file d'attente.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-100 text-pine-900">
                <HugeiconsIcon icon={feature.icon} size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="secteurs" className="scroll-mt-24 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Pour qui ?</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Pensé pour votre métier
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Que vous accueilliez des patients, des clients ou des usagers, Filz s'adapte à votre organisation.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {sectors.map((sector) => (
            <div key={sector.name} className="rounded-2xl border border-line bg-white p-5 text-center shadow-card">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700">
                <HugeiconsIcon icon={sector.icon} size={20} />
              </span>
              <p className="mt-3 text-xs font-semibold leading-4 text-ink">{sector.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-pine-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
          </span>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Prêt à fluidifier votre accueil ?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-pine-100/80">
            Créez votre espace, générez vos QR codes et offrez à vos visiteurs une attente enfin maîtrisée.
          </p>
          <button
            onClick={onSignup}
            className="focus-ring mt-8 inline-flex touch-target items-center justify-center gap-2 rounded-xl bg-pine-500 px-6 text-sm font-bold text-white shadow-primary hover:bg-pine-700"
          >
            Commencer maintenant
            <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
          </button>
          <p className="mt-4 text-xs text-pine-100/60">
            Essai gratuit · <button onClick={onPricing} className="focus-ring rounded font-semibold text-gold-300 underline-offset-2 hover:underline">Voir les tarifs</button>
          </p>
        </div>
      </section>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="flex items-center gap-2.5">
              <img src={filzIcon} alt="Filz" className="h-7 w-7 rounded-lg" />
              <span className="font-display text-base font-semibold tracking-tight text-ink">Filz</span>
            </div>
            <p className="font-mono text-[11px] text-ink-faint">Filz · le guichet qui n'attend pas</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-xs font-semibold text-ink-soft transition-colors hover:text-ink">{link.label}</a>
            ))}
            <button onClick={onPricing} className="focus-ring rounded text-xs font-semibold text-ink-soft transition-colors hover:text-ink">Tarifs</button>
            <button onClick={onPartner} className="focus-ring rounded text-xs font-semibold text-ink-soft transition-colors hover:text-ink">Devenir partenaire</button>
            <button onClick={onPartnerLogin} className="focus-ring rounded text-xs font-semibold text-ink-soft transition-colors hover:text-ink">Espace partenaire</button>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-faint">
            <HugeiconsIcon icon={Shield01Icon} size={14} />
            Vos données restent privées et ne servent qu'à votre prise en charge.
          </div>
        </div>
      </footer>
    </main>
  );
}
