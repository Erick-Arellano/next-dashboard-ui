"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PaginationProps = {
  page: number;
  count: number;
  limit?: number;
};

const Pagination = ({ page, count, limit = 10 }: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(count / limit);

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (count === 0) return null;

  // Generate page numbers sliding window
  const pageNumbers = [];
  const maxVisiblePages = 5;
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);

    if (startPage === 1) {
      endPage = maxVisiblePages;
    } else if (endPage === totalPages) {
      startPage = totalPages - maxVisiblePages + 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="p-4 flex items-center justify-between text-gray-500 select-none">
      {/* PREV BUTTON */}
      <button
        disabled={!hasPrev}
        onClick={() => changePage(page - 1)}
        className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#2E4068] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100 transition duration-150 cursor-pointer"
        type="button"
      >
        Prev
      </button>

      {/* PAGE NUMBERS */}
      <div className="flex items-center gap-2 text-xs">
        {pageNumbers.map((num) => {
          const isActive = num === page;
          return (
            <button
              key={num}
              onClick={() => changePage(num)}
              className={`px-3 py-1.5 rounded-lg font-bold transition duration-150 ${
                isActive
                  ? "bg-vocaliBlue text-white shadow-sm"
                  : "bg-slate-50 text-gray-600 hover:bg-slate-100"
              }`}
              type="button"
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* NEXT BUTTON */}
      <button
        disabled={!hasNext}
        onClick={() => changePage(page + 1)}
        className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#2E4068] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-100 transition duration-150 cursor-pointer"
        type="button"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
