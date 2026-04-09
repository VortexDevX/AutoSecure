import React from 'react';
import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
  totalItems: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
}: PaginationProps) {
  const pages = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between rounded-[18px] border border-slate-200/80 bg-[rgba(239,245,253,0.82)] px-4 py-3 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn btn-secondary"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn btn-secondary ml-3"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </p>

          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="input h-10 w-auto min-w-[132px] py-0 text-sm"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        <div>
          <nav
            className="relative z-0 inline-flex -space-x-px rounded-[14px] shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={clsx(
                'relative inline-flex items-center rounded-l-[14px] border border-slate-200 bg-[rgba(239,245,253,0.9)] px-2 py-2 text-sm font-medium',
                currentPage === 1
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-500 hover:bg-[#fbf6ee]'
              )}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {startPage > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className="relative inline-flex items-center border border-slate-200 bg-[rgba(239,245,253,0.9)] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="relative inline-flex items-center border border-slate-200 bg-[rgba(239,245,253,0.9)] px-4 py-2 text-sm font-medium text-slate-700">
                    ...
                  </span>
                )}
              </>
            )}

            {pages.map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={clsx(
                  'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
                  page === currentPage
                    ? 'z-10 border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 bg-[rgba(239,245,253,0.9)] text-slate-700 hover:bg-slate-50'
                )}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="relative inline-flex items-center border border-slate-200 bg-[rgba(239,245,253,0.9)] px-4 py-2 text-sm font-medium text-slate-700">
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className="relative inline-flex items-center border border-slate-200 bg-[rgba(239,245,253,0.9)] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={clsx(
                'relative inline-flex items-center rounded-r-[14px] border border-slate-200 bg-[rgba(239,245,253,0.9)] px-2 py-2 text-sm font-medium',
                currentPage === totalPages
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-500 hover:bg-[#fbf6ee]'
              )}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
