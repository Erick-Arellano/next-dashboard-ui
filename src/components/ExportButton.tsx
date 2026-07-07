"use client";

type Column = {
  header: string;
  key: string;
};

type ExportButtonProps = {
  data: any[];
  filename: string;
  columns: Column[];
};

const ExportButton = ({ data, filename, columns }: ExportButtonProps) => {
  const handleExport = () => {
    try {
      // 1. Create CSV headers row
      const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");

      // 2. Create CSV rows
      const rows = data.map((item) => {
        return columns
          .map((col) => {
            let val = item[col.key];
            
            // Handle nested objects (like item.student.name if key is student.name)
            if (col.key.includes(".")) {
              const keys = col.key.split(".");
              let tempVal = item;
              for (const k of keys) {
                tempVal = tempVal ? tempVal[k] : "";
              }
              val = tempVal;
            }



            const cleanVal = val === null || val === undefined ? "" : String(val).trim();
            // Escape double quotes inside values by doubling them
            return `"${cleanVal.replace(/"/g, '""')}"`;
          })
          .join(",");
      });

      // 3. Combine with UTF-8 BOM
      const csvContent = "\uFEFF" + [headers, ...rows].join("\n");

      // 4. Trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow hover:bg-yellow-200 transition-all duration-200 shadow-sm border border-yellow-200"
      title="Exportar a Excel / CSV"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        className="w-4 h-4 text-gray-700"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
    </button>
  );
};

export default ExportButton;
