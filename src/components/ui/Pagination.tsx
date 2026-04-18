import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;        // current page (1-indexed)
  totalPages: number;
  onChange: (page: number) => void;
  siblingCount?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const leftSibling = Math.max(page - siblingCount, 1);
  const rightSibling = Math.min(page + siblingCount, totalPages);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  let pages: (number | "…")[];
  if (!showLeftDots && !showRightDots) {
    pages = range(1, totalPages);
  } else if (!showLeftDots) {
    pages = [...range(1, rightSibling + 1), "…", totalPages];
  } else if (!showRightDots) {
    pages = [1, "…", ...range(leftSibling - 1, totalPages)];
  } else {
    pages = [1, "…", ...range(leftSibling, rightSibling), "…", totalPages];
  }

  const btnBase: React.CSSProperties = {
    minWidth: "2rem",
    height: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.5rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    border: "1px solid var(--color-border-card)",
  };

  const activeStyle: React.CSSProperties = {
    ...btnBase,
    backgroundColor: "var(--color-accent-amber)",
    color: "#000",
    borderColor: "var(--color-accent-amber)",
    fontWeight: 700,
  };

  const inactiveStyle: React.CSSProperties = {
    ...btnBase,
    backgroundColor: "transparent",
    color: "var(--color-text-secondary)",
  };

  const arrowStyle: React.CSSProperties = {
    ...btnBase,
    backgroundColor: "transparent",
    color: "var(--color-text-muted)",
    padding: "0 0.375rem",
  };

  return (
    <div
      className="flex items-center justify-center gap-1 pt-2"
      role="navigation"
      aria-label="Pagination"
    >
      {/* Prev */}
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        style={{ ...arrowStyle, opacity: page === 1 ? 0.3 : 1 }}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`dots-${i}`}
            style={{ ...inactiveStyle, cursor: "default", border: "none", color: "var(--color-text-muted)" }}
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            style={p === page ? activeStyle : inactiveStyle}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        style={{ ...arrowStyle, opacity: page === totalPages ? 0.3 : 1 }}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
