"use client";

export default function PrintButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex items-center gap-2 bg-[#F04F23] hover:bg-[#d63f17] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h-11.32m11.32 0a49.255 49.255 0 0 0 1.258-2.035c.216-.382.228-.829-.028-1.203a54.437 54.437 0 0 0-3.187-4.189c-.588-.706-1.538-.779-2.147-.148L11.5 13.047a2.25 2.25 0 0 1-3.182 0l-1.025-1.026c-.609-.61-1.56-.537-2.148.17a54.407 54.407 0 0 0-3.186 4.19c-.256.374-.24.821-.029 1.203A49.304 49.304 0 0 0 6.34 18"
        />
      </svg>
      Imprimir / Guardar PDF
    </button>
  );
}
