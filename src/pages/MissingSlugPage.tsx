import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import filzIcon from "../assets/filz_icon.png";

export function MissingSlugPage() {
  return (
    <main className="min-h-screen bg-sand grid place-items-center px-4">
      <div className="mx-auto max-w-[420px] text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pine-50">
          <HugeiconsIcon icon={AlertCircleIcon} size={40} className="text-pine-500" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-[-.04em] text-ink">
          QR code invalide
        </h1>

        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Ce lien ne contient pas les informations nécessaires pour identifier
          l'établissement. Veuillez scanner un <strong>QR code valide</strong> à
          l'accueil de votre établissement.
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-[0_12px_35px_rgba(23,32,51,.04)]">
          <p className="text-xs font-semibold text-ink-soft">Que faire ?</p>
          <ul className="mt-3 space-y-2 text-left text-xs leading-5 text-ink-soft">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-pine-500" />
              Demandez au personnel de vous fournir un QR code à scanner.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-pine-500" />
              Vérifiez que votre lien contient bien le paramètre <code className="rounded bg-sand px-1 font-mono text-[11px]">slug</code>.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-pine-500" />
              Si le problème persiste, contactez l'établissement directement.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-ink-faint">
          <img src={filzIcon} alt="Filz" className="h-5 w-5" />
          Propulsé par Filz
        </div>
      </div>
    </main>
  );
}
