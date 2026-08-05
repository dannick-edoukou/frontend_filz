import { Button } from "./Ui";

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

export function Pagination({ page, pages, total, pageSize, onPageChange, onPageSizeChange }: PaginationProps) {
  if (total <= 0) return null;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-ink-soft">
        {from}–{to} sur <span className="font-semibold text-ink">{total.toLocaleString("fr-FR")}</span>
        {pages > 1 && <span className="text-ink-faint"> · Page {page} / {pages}</span>}
      </p>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="focus-ring h-9 rounded-xl border border-line bg-white px-2 text-xs font-semibold text-ink-soft"
            aria-label="Éléments par page"
          >
            {[10, 20, 50, 100].map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Précédent
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  );
}
