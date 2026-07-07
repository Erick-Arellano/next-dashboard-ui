"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export interface FilterOptionGroup {
  label: string;
  paramName: string;
  options: { label: string; value: string }[];
}

export interface SortOption {
  label: string;
  value: string;
}

interface ListHeaderToolbarProps {
  placeholder?: string;
  filterOptions?: FilterOptionGroup[];
  sortOptions?: SortOption[];
}

export default function ListHeaderToolbar({
  placeholder = "Buscar...",
  filterOptions = [],
  sortOptions = [],
}: ListHeaderToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search input state
  const currentSearchValue = searchParams.get("search") || "";
  const [searchValue, setSearchValue] = useState(currentSearchValue);

  // Popover open states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Refs for clicking outside
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Sync search input value with URL if it changes externally
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update query params helper
  const updateQueryParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    router.push(`${pathname}?${newParams.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ search: searchValue });
  };

  const handleFilterChange = (paramName: string, value: string) => {
    updateQueryParams({ [paramName]: value });
  };

  const handleSortSelect = (value: string) => {
    updateQueryParams({ sort: value });
    setIsSortOpen(false);
  };

  const handleClearAll = () => {
    setSearchValue("");
    router.push(pathname);
  };

  // Determine if there are any active search/filter/sort parameters
  const hasActiveParams = Array.from(searchParams.keys()).some((key) => {
    const val = searchParams.get(key);
    return val !== null && val !== "";
  });

  // Calculate count of active filters (excluding search and sort)
  const activeFiltersCount = filterOptions.reduce((acc, curr) => {
    const val = searchParams.get(curr.paramName);
    return val ? acc + 1 : acc;
  }, 0);

  const activeSort = searchParams.get("sort") || "";

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
      {/* SEARCH INPUT */}
      <form onSubmit={handleSearchSubmit} className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 bg-transparent">
        <button type="submit" className="focus:outline-none flex items-center justify-center p-2">
          <Image src="/search.png" alt="Buscar" width={14} height={14} />
        </button>
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-[200px] py-2 bg-transparent outline-none text-gray-700"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              updateQueryParams({ search: null });
            }}
            className="text-gray-400 hover:text-gray-600 font-bold px-1 text-sm"
          >
            ×
          </button>
        )}
      </form>

      {/* FILTER & SORT CONTROLS */}
      <div className="flex items-center gap-4 self-end">
        {/* CLEAR FILTERS QUICK ACTION */}
        {hasActiveParams && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-500 hover:text-red-700 hover:underline transition duration-150 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Limpiar filtros
          </button>
        )}

        {/* FILTER POPOVER */}
        {filterOptions.length > 0 && (
          <div className="relative flex items-center" ref={filterRef}>
            <button
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsSortOpen(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 relative ${
                activeFiltersCount > 0
                  ? "bg-vocaliOrange text-white shadow-md scale-105"
                  : "bg-lamaYellow hover:bg-opacity-80 text-gray-700"
              }`}
              title="Filtrar"
              type="button"
            >
              <Image
                src="/filter.png"
                alt="Filtros"
                width={14}
                height={14}
                className={activeFiltersCount > 0 ? "brightness-0 invert" : ""}
              />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-10 w-64 bg-white border border-gray-100 rounded-lg shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm text-gray-800">Filtrar por:</h4>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={() => {
                        const clearedFilters: Record<string, null> = {};
                        filterOptions.forEach((f) => {
                          clearedFilters[f.paramName] = null;
                        });
                        updateQueryParams(clearedFilters);
                      }}
                      className="text-[10px] text-vocaliBlue hover:underline"
                      type="button"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
                <div className="space-y-3 font-normal text-left">
                  {filterOptions.map((group) => {
                    const activeVal = searchParams.get(group.paramName) || "";
                    return (
                      <div key={group.paramName} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500">{group.label}</label>
                        <select
                          value={activeVal}
                          onChange={(e) => handleFilterChange(group.paramName, e.target.value)}
                          className="text-xs p-2 border border-gray-200 rounded bg-gray-50 text-gray-800 focus:outline-none focus:ring-1 focus:ring-vocaliOrange focus:border-vocaliOrange w-full"
                        >
                          <option value="">Todos</option>
                          {group.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SORT POPOVER */}
        {sortOptions.length > 0 && (
          <div className="relative flex items-center" ref={sortRef}>
            <button
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsFilterOpen(false);
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                activeSort
                  ? "bg-vocaliBlue text-white shadow-md scale-105"
                  : "bg-lamaYellow hover:bg-opacity-80 text-gray-700"
              }`}
              title="Ordenar"
              type="button"
            >
              <Image
                src="/sort.png"
                alt="Ordenar"
                width={14}
                height={14}
                className={activeSort ? "brightness-0 invert" : ""}
              />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-10 w-56 bg-white border border-gray-100 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <h4 className="font-semibold text-sm text-gray-800 px-4 py-1.5 border-b border-gray-100 text-left">
                  Ordenar por:
                </h4>
                <div className="max-h-60 overflow-y-auto mt-1">
                  {sortOptions.map((opt) => {
                    const isSelected = activeSort === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSortSelect(opt.value)}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition duration-150 ${
                          isSelected
                            ? "bg-vocaliBlueLight text-vocaliBlue font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        type="button"
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-vocaliBlue">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
