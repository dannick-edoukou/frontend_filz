import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeToggle } from "../theme/ThemeProvider";
import {
  ArrowRight01Icon,
  BankIcon,
  Calendar01Icon,
  ChartLineIcon,
  CheckmarkCircle02Icon,
  CreditCardIcon,
  HandshakeIcon,
  HeadphonesIcon,
  Link02Icon,
  Message02Icon,
  Money01Icon,
  QrCodeIcon,
  Rocket01Icon,
  Share02Icon,
  Ticket01Icon,
  UserGroupIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import filzIcon from "../assets/filz_icon.png";
import { api } from "../utils/api";
import { getErrorMessage } from "../utils/errorHandler";

export function PartnerPage({ onHome, onPartnerLogin }: { onHome: () => void; onPartnerLogin: () => void }) {
  const [price, setPrice] = useState(15000);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [channel, setChannel] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const commission = Math.round(price * 0.3);
  const total = Math.round(commission * 5);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitApplication = async () => {
    setError(null);
    setSending(true);
    try {
      await api.post("/partners/apply", {
        full_name: name,
        email,
        phone: phone || null,
        password,
        channel: channel || null,
      });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const steps = [
    {
      step: "01",
      icon: Link02Icon,
      title: "Recevez votre lien unique",
      text: "Dès votre candidature validée, vous obtenez votre lien de parrainage personnel. Prêt à diffuser.",
    },
    {
      step: "02",
      icon: Message02Icon,
      title: "Partagez-le",
      text: "E-mail, WhatsApp, LinkedIn, bouche-à-oreille… chaque entreprise qui s'abonne via votre lien est rattachée à vous.",
    },
    {
      step: "03",
      icon: Wallet01Icon,
      title: "Touchez vos commissions",
      text: "30 % du montant de l'abonnement de chaque client parrainé, chaque mois, pendant 5 mois. Sans plafond.",
    },
  ];

  const perks = [
    {
      icon: Wallet01Icon,
      title: "Revenus récurrents",
      text: "Tant que l'entreprise reste abonnée, vous êtes payé chaque mois pendant 5 mois. Un revenu qui se répète.",
    },
    {
      icon: ChartLineIcon,
      title: "Suivi transparent",
      text: "Un espace partenaire pour suivre vos parrainages, vos clients actifs et vos gains accumulés en temps réel.",
    },
    {
      icon: Share02Icon,
      title: "Partage en un clic",
      text: "Un lien unique et des outils de partage prêts à l'emploi pour vos réseaux et vos messages.",
    },
    {
      icon: UserGroupIcon,
      title: "Sans limite",
      text: "Parrainez autant d'entreprises que vous le souhaitez. Chaque nouveau client rapporte ses 5 mois de commission.",
    },
    {
      icon: BankIcon,
      title: "Versements réguliers",
      text: "Vos gains sont versés chaque mois sur le compte de votre choix, dès que le montant minimum est atteint.",
    },
    {
      icon: HeadphonesIcon,
      title: "Accompagnement",
      text: "Notre équipe vous suit : ressources de présentation, réponses à vos questions et aide à vos premiers parrainages.",
    },
  ];

  const audiences = [
    "Freelances & consultants",
    "Agences & prestataires",
    "Influenceurs & créateurs",
    "Commerçants & entrepreneurs",
    "Étudiants & jeunes actifs",
    "Toute personne qui connaît des entreprises",
  ];

  const faqs = [
    {
      q: "Comment est calculée ma commission ?",
      a: "Vous percevez 30 % du montant mensuel de l'abonnement de chaque entreprise que vous avez parrainée. Exemple : une entreprise abonnée à 15 000 FCFA/mois vous rapporte 4 500 FCFA/mois.",
    },
    {
      q: "Pendant combien de temps suis-je payé ?",
      a: "5 mois à compter de l'abonnement de l'entreprise parrainée. Chaque mois où elle reste abonnée, vous percevez vos 30 %.",
    },
    {
      q: "Combien d'entreprises puis-je parrainer ?",
      a: "Autant que vous le souhaitez, sans aucun plafond. Chaque entreprise parrainée vous rapporte ses 5 mois de commission.",
    },
    {
      q: "Comment mes parrainages sont-ils suivis ?",
      a: "Tout passe par votre lien de parrainage unique. Quand une entreprise s'abonne via ce lien, elle est automatiquement rattachée à votre compte et vos gains apparaissent dans votre espace partenaire.",
    },
    {
      q: "Quand suis-je payé ?",
      a: "Vos gains sont versés chaque mois sur le compte de votre choix (mobile money ou virement), dès que vous avez atteint le montant minimum de versement.",
    },
    {
      q: "Qu'est-ce que Filz ?",
      a: "Filz est un service de gestion de file d'attente par QR code : vos clients scannent, s'enregistrent et suivent leur tour en temps réel, sans application à installer.",
    },
  ];

  const fmt = (n: number) => n.toLocaleString("fr-FR");

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={onHome} className="focus-ring flex items-center gap-2.5 rounded-xl text-left">
            <img src={filzIcon} alt="Filz" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-lg font-semibold tracking-tight text-ink">Filz</span>
          </button>
          <nav className="hidden items-center gap-6 lg:flex">
            <button onClick={() => scrollTo("how")} className="focus-ring text-sm font-semibold text-ink-soft transition-colors hover:text-ink">Comment ça marche</button>
            <button onClick={() => scrollTo("example")} className="focus-ring text-sm font-semibold text-ink-soft transition-colors hover:text-ink">Simulateur</button>
            <button onClick={() => scrollTo("faq")} className="focus-ring text-sm font-semibold text-ink-soft transition-colors hover:text-ink">FAQ</button>
            <button onClick={onPartnerLogin} className="focus-ring text-sm font-semibold text-ink-soft transition-colors hover:text-ink">Espace partenaire</button>
            <span className="rounded-full border border-gold-300 bg-gold-100 px-4 py-2 text-sm font-semibold text-gold-700">Devenir partenaire</span>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => scrollTo("join")}
              className="focus-ring inline-flex touch-target items-center gap-2 rounded-xl bg-pine-900 px-4 text-sm font-semibold text-white shadow-primary hover:bg-pine-700"
            >
              Rejoindre
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-pine-950 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-pine-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              <HugeiconsIcon icon={HandshakeIcon} size={14} />
              Programme Partenaire
            </p>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Gagnez <span className="text-gold-400">30 %</span> sur chaque
              <br />
              abonnement pendant 5 mois
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-pine-100/80">
              Référez des entreprises à Filz. Dès qu'une entreprise parrainée s'abonne, vous percevez 30 % du montant
              de son abonnement, chaque mois, pendant 5 mois. Sans plafond, sans frais, sans effort répété.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => scrollTo("join")}
                className="focus-ring inline-flex touch-target items-center justify-center gap-2 rounded-xl bg-pine-500 px-6 text-sm font-bold text-white shadow-primary hover:bg-pine-700"
              >
                Rejoindre le programme
                <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
              </button>
              <button
                onClick={() => scrollTo("how")}
                className="focus-ring inline-flex touch-target items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10"
              >
                Comment ça marche
              </button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[28px] border border-line bg-white p-6 text-center shadow-ticket sm:p-8">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900">
                <HugeiconsIcon icon={Ticket01Icon} size={26} />
              </span>
              <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-ink-faint">Votre exemple de gains</p>
              <p className="mt-2 text-sm leading-6 text-ink-soft">Une entreprise s'abonne à</p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">15 000 FCFA<span className="text-base text-ink-faint">/mois</span></p>
              <div className="relative mt-6">
                <div className="border-t-2 border-dashed border-line" />
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-faint">Filz · partenaire</span>
              </div>
              <div className="mt-6 grid grid-cols-2 divide-x divide-line border-y border-line">
                <div className="py-4">
                  <p className="font-mono text-3xl font-semibold tracking-[-0.04em] text-gold-700">4 500 FCFA</p>
                  <p className="mt-1 text-[11px] text-ink-faint">30 % chaque mois</p>
                </div>
                <div className="py-4">
                  <p className="font-mono text-3xl font-semibold tracking-[-0.04em] text-ink">22 500 FCFA</p>
                  <p className="mt-1 text-[11px] text-ink-faint">total sur 5 mois</p>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-5 text-ink-faint">Exemple illustratif. Vos gains réels dépendent des abonnements souscrits par les entreprises que vous parrainez.</p>
            </div>
            <div className="absolute -bottom-4 -left-4 -z-10 hidden h-full w-full rounded-[28px] bg-gold-500/15 sm:block" />
          </div>
        </div>
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Money01Icon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">30 % de commission</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Calendar01Icon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">5 mois de revenus par client</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={UserGroupIcon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">Parrainages illimités</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={ChartLineIcon} size={18} className="shrink-0 text-gold-300" />
              <span className="text-xs font-semibold text-pine-100/80">Suivi de vos gains en temps réel</span>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Comment ça marche</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Votre parrainage, en trois gestes
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Pas besoin d'être commercial. Partagez, c'est tout : Filz s'occupe de rattacher chaque entreprise à vous.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {steps.map((step) => (
            <article key={step.step} className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
              <p className="font-mono text-4xl font-semibold tracking-[-0.04em] text-gold-400">{step.step}</p>
              <span className="mt-5 grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-700">
                <HugeiconsIcon icon={step.icon} size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="example" className="bg-pine-950 text-white">
        <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              <HugeiconsIcon icon={CreditCardIcon} size={14} />
              Simulateur
            </p>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Combien pouvez-vous gagner ?
            </h2>
            <p className="mt-4 text-sm leading-6 text-pine-100/80">
              Glissez le montant de l'abonnement mensuel d'une entreprise parrainée. Filz calcule votre commission
              de 30 % et son total sur 5 mois.
            </p>            <div className="mt-8 space-y-4">
              <label className="block text-sm font-semibold text-white">
                Abonnement mensuel du client (FCFA) · montant d’exemple
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="input mt-2 !border-white/20 !bg-white/10 !text-white placeholder:!text-pine-100/40"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine-100/60">Votre commission / mois</p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] text-gold-400">{fmt(commission)} FCFA</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine-100/60">Total sur 5 mois</p>
                  <p className="mt-2 font-mono text-3xl font-semibold tracking-[-0.04em] text-white">{fmt(total)} FCFA</p>
                </div>
              </div>
              <p className="text-[11px] leading-5 text-pine-100/50">
                Simulation indicative : 30 % × montant mensuel × 5 mois, hors taxes et conditions de versement en vigueur.
                Les tarifs définitifs de Filz ne sont pas encore fixés — le montant ci-dessus est un exemple.
              </p>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pine-100/60">Exemple concret (montants indicatifs)</p>
              <p className="mt-4 font-display text-2xl font-semibold tracking-tight">3 entreprises parrainées en 5 mois</p>
              <ul className="mt-6 space-y-3 text-sm leading-6 text-pine-100/80">
                <li className="flex items-start gap-3"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-0.5 shrink-0 text-gold-400" />Chaque entreprise s'abonne à 15 000 FCFA/mois (exemple)</li>
                <li className="flex items-start gap-3"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-0.5 shrink-0 text-gold-400" />Vous percevez 4 500 FCFA/mois par entreprise</li>
                <li className="flex items-start gap-3"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-0.5 shrink-0 text-gold-400" />Soit 13 500 FCFA/mois cumulés</li>
                <li className="flex items-start gap-3"><HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} className="mt-0.5 shrink-0 text-gold-400" />Et 67 500 FCFA au total sur 5 mois</li>
              </ul>
              <div className="relative mt-7">
                <div className="border-t-2 border-dashed border-white/15" />
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-pine-950 px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-pine-100/50">Filz · partenaire</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Pourquoi participer</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Un vrai revenu, pas une simple réduction
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink-soft">
            Chaque entreprise que vous amenez devient une source de revenus récurrents pendant 5 mois — et recommence
            avec la suivante.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((perk) => (
            <article key={perk.title} className="rounded-2xl border border-line bg-white p-6 shadow-card">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-100 text-pine-900">
                <HugeiconsIcon icon={perk.icon} size={22} />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">{perk.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{perk.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-sand/50">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">Pour qui ?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Tout le monde peut devenir partenaire
            </h2>
            <p className="mt-4 text-sm leading-6 text-ink-soft">
              Vous côtoyez des cliniques, commerces, banques ou salons ? Vous avez déjà la ressource la plus précieuse :
              votre réseau.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((audience) => (
              <div key={audience} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-card">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} />
                </span>
                <p className="text-sm font-semibold leading-5 text-ink">{audience}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-700">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Questions fréquentes
          </h2>
        </div>
        <div className="mt-10 space-y-3">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <div key={faq.q} className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                <button
                  onClick={() => setOpenFaq(open ? null : index)}
                  className="focus-ring flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-ink">{faq.q}</span>
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition-transform ${open ? "rotate-45" : ""}`}>+</span>
                </button>
                {open && <p className="border-t border-line px-5 py-4 text-sm leading-6 text-ink-soft">{faq.a}</p>}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-dashed border-gold-300 bg-gold-100/50 p-5">
          <HugeiconsIcon icon={QrCodeIcon} size={20} className="mt-0.5 shrink-0 text-gold-700" />
          <p className="text-sm leading-6 text-ink-soft">
            <strong className="font-bold text-ink">C'est quoi Filz ?</strong> Un service de gestion de file d'attente par
            QR code : vos clients scannent, s'enregistrent et suivent leur tour en temps réel, sans application à installer.
            Le bon argument à donner aux entreprises que vous recommandez.
          </p>
        </div>
      </section>

      <section id="join" className="bg-pine-950 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold-500/15 text-gold-400">
              <HugeiconsIcon icon={Rocket01Icon} size={24} />
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Prêt à monétiser votre réseau ?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-pine-100/80">
              Déposez votre candidature. Nous validons votre profil sous 48 h et vous envoyons votre lien de parrainage.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-white text-ink shadow-ticket">
            {sent ? (
              <div className="p-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-pine-100 text-pine-900">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">Candidature envoyée</h3>
                <p className="mt-3 text-sm leading-6 text-ink-soft">
                  Merci {name || "pour votre intérêt"} ! Notre équipe revient vers vous sous 48 h pour activer votre lien
                  de parrainage.
                </p>
              </div>
            ) : (
              <form
                className="space-y-4 p-7"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitApplication();
                }}
              >
                <label className="block text-sm font-semibold text-ink">
                  Nom complet
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Awa Konan" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Adresse e-mail
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Téléphone / WhatsApp
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex. 07 00 00 00 00" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Mot de passe de votre espace partenaire
                  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} placeholder="8 caractères minimum" className="input mt-2" />
                </label>
                <label className="block text-sm font-semibold text-ink">
                  Comment comptez-vous présenter Filz ?
                  <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Ex. à mes clients, sur LinkedIn, WhatsApp…" className="input mt-2" />
                </label>
                {error && (
                  <p className="rounded-xl bg-clay-100 px-3 py-2.5 text-xs font-medium leading-5 text-clay-700">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="focus-ring inline-flex touch-target w-full items-center justify-center gap-2 rounded-xl bg-pine-900 px-6 py-3 text-sm font-bold text-white shadow-primary hover:bg-pine-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Envoi en cours…" : "Envoyer ma candidature"}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={17} />
                </button>
                <p className="text-center text-[11px] leading-5 text-ink-faint">
                  Sans frais, sans engagement. Votre candidature est traitée par notre équipe.
                </p>
              </form>
            )}
            <div className="flex items-center justify-center gap-1.5 border-t border-line px-7 py-4 text-xs text-ink-faint">
              <span>Vous êtes déjà partenaire ?</span>
              <button onClick={onPartnerLogin} className="focus-ring font-semibold text-gold-700 underline-offset-2 hover:underline">Se connecter</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-between sm:text-left">
          <button onClick={onHome} className="focus-ring flex items-center gap-2.5 rounded-xl">
            <img src={filzIcon} alt="Filz" className="h-7 w-7 rounded-lg" />
            <span className="font-display text-base font-semibold tracking-tight text-ink">Filz</span>
          </button>
          <nav className="flex items-center gap-6 text-sm font-semibold text-ink-soft">
            <button onClick={onHome} className="focus-ring hover:text-ink">Accueil</button>
            <button onClick={() => scrollTo("faq")} className="focus-ring hover:text-ink">FAQ</button>
            <button onClick={() => scrollTo("join")} className="focus-ring hover:text-ink">Devenir partenaire</button>
          </nav>
          <p className="text-xs text-ink-faint">© 2026 Filz · Programme Partenaire</p>
        </div>
      </footer>
    </main>
  );
}
