import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, File02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Button, PageHeader } from "../components/ui/Ui";
import { api } from "../utils/api";

type InvoiceRow = {
  id: string;
  date: string;
  dateISO: string | null;
  amount: string;
  amountValue: number;
  state: "paid" | "pending" | "failed";
};

type InvoiceRecord = {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  plan_name: string | null;
};

type SubscriptionResponse = {
  subscription: { id: string; plan_id?: string; status: string; queue_entries_this_period: number } | null;
  plan: { id: string; name: string; price_monthly: number } | null;
  current_period_end: string | null;
};

function formatAmountFCFA(v: number): string {
  if (v <= 0) return "Gratuit";
  return `${Math.round(v).toLocaleString("fr-FR")} FCFA`;
}

function formatFRDate(d: Date): string {
  return `${d.getDate().toString().padStart(2, "0")} ${
    ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][d.getMonth()]
  } ${d.getFullYear()}`;
}

function toRow(inv: InvoiceRecord): InvoiceRow {
  const date = inv.paid_at || inv.period_end || null;
  const d = date ? new Date(date) : null;
  return {
    id: inv.invoice_number,
    date: d ? formatFRDate(d) : "—",
    dateISO: d ? d.toISOString() : null,
    amount: formatAmountFCFA(inv.amount),
    amountValue: inv.amount,
    state: inv.status,
  };
}

export function InvoicesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.get("/admin/subscription"),
      api.get("/admin/invoices"),
    ])
      .then(([subRes, invRes]) => {
        if (cancelled) return;
        setData(subRes as SubscriptionResponse);
        const list = (invRes as { invoices: InvoiceRecord[] }).invoices ?? [];
        setInvoices(list.map(toRow));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Impossible de charger les informations.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const planPrice = data?.plan?.price_monthly ?? 0;
  const nextDate = data?.current_period_end ? new Date(data.current_period_end) : null;

  return <>
    <PageHeader
      eyebrow="Facturation"
      title="Factures & paiements"
      description="Retrouvez les reçus de votre abonnement entreprise et suivez vos prochains prélèvements."
      action={<Button variant="secondary">Mettre à jour le paiement</Button>}
    />
    {error && (
      <div className="mb-4 rounded-xl border border-[#f0d8bd] bg-[#fffbf6] p-3 text-xs font-bold text-[#b94d10]">{error}</div>
    )}
    <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <article className="overflow-hidden rounded-2xl border border-[#e5e5df] bg-white">
        <div className="flex items-center gap-3 border-b border-[#ecece7] p-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff1e5] text-[#d6641b]">
            <HugeiconsIcon icon={File02Icon} size={19} />
          </span>
          <div>
            <h2 className="font-bold">Historique des factures</h2>
            <p className="text-xs text-[#788292]">Les justificatifs sont disponibles pendant 24 mois.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-left">
            <thead className="bg-[#fafaf8]">
              <tr className="text-[10px] font-bold uppercase tracking-[.12em] text-[#929aa7]">
                <th className="px-5 py-3">Référence</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">État</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr className="border-t border-[#f0f0eb] text-sm">
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-[#788292]">
                    Chargement des factures…
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr className="border-t border-[#f0f0eb] text-sm">
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-[#788292]">
                    Aucune facture disponible pour le moment.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t border-[#f0f0eb] text-sm">
                    <td className="px-5 py-4 font-bold">{invoice.id}</td>
                    <td className="px-4 py-4 text-[#596477]">{invoice.date}</td>
                    <td className="px-4 py-4 font-semibold">{invoice.amount}</td>
                    <td className="px-4 py-4">
                      {invoice.state === "paid" ? (
                        <span className="rounded-full bg-[#ebf6ee] px-2.5 py-1 text-[11px] font-bold text-[#287044]">Payée</span>
                      ) : invoice.state === "pending" ? (
                        <span className="rounded-full bg-[#e9f5ff] px-2.5 py-1 text-[11px] font-bold text-[#216a9b]">En attente</span>
                      ) : (
                        <span className="rounded-full bg-[#ffe9e7] px-2.5 py-1 text-[11px] font-bold text-[#c13d2e]">Échouée</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        disabled={invoice.state !== "paid"}
                        className="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-[#b94d10] hover:bg-[#fff1e5] disabled:opacity-40 disabled:hover:bg-transparent"
                        title={invoice.state === "paid" ? "Télécharger le PDF" : "Disponible après paiement"}
                      >
                        <HugeiconsIcon icon={Download01Icon} size={15} />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
      <aside className="space-y-5">
        <section className="rounded-2xl bg-[#173f3a] p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#f0b27e]">Prochain paiement</p>
          <p className="mt-3 text-3xl font-bold tracking-[-.05em]">
            {loading ? "…" : formatAmountFCFA(planPrice)}
          </p>
          <p className="mt-2 text-sm text-[#c8ddd8]">
            {loading
              ? "Chargement…"
              : nextDate
                ? `Le ${formatFRDate(nextDate)} · ${data?.plan?.name ?? "Abonnement"}`
                : "Aucune échéance configurée."}
          </p>
          <Button className="mt-5 !bg-white !text-[#173f3a] hover:!bg-[#f7f7f5]">Voir l’abonnement</Button>
        </section>
        <section className="rounded-2xl border border-[#f0d8bd] bg-[#fffbf6] p-5">
          <div className="flex gap-3">
            <HugeiconsIcon icon={InformationCircleIcon} size={19} className="shrink-0 text-[#c45b1a]" />
            <p className="text-xs leading-5 text-[#86572f]">
              Si un paiement échoue, l’équipe Filz vous contacte avant toute suspension de l’accès public.
            </p>
          </div>
        </section>
      </aside>
    </section>
  </>;
}