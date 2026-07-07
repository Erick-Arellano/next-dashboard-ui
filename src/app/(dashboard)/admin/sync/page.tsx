"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { parseExcelFileForPreview, syncData } from "@/lib/syncActions";

export default function ExcelSyncPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"students" | "leads" | "payments">("students");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sheet parsing states
  const [sheets, setSheets] = useState<{ name: string; preview: any[]; totalRows: number }[]>([]);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState<number>(0);
  const [isParsed, setIsParsed] = useState(false);

  // Sync result states
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    processed: number;
    created: number;
    updated: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
    if (fileType !== "xlsx" && fileType !== "xls" && fileType !== "csv") {
      setError("Tipo de archivo no admitido. Favor de subir un archivo Excel (.xlsx, .xls) o CSV (.csv).");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setLoading(true);
    setSyncResult(null);
    setIsParsed(false);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await parseExcelFileForPreview(formData);

      if (res.success && res.sheets) {
        setSheets(res.sheets);
        setSelectedSheetIndex(0);
        setIsParsed(true);
      } else {
        setError(res.error || "Error al analizar el archivo de Excel.");
      }
    } catch (err: any) {
      setError("Error al procesar el archivo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSubmit = async () => {
    if (sheets.length === 0 || selectedSheetIndex >= sheets.length) return;

    setLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const activeSheet = sheets[selectedSheetIndex];

      // Fetch full rows from the parsed SheetJS structure
      const formData = new FormData();
      formData.append("file", file!);

      // We parse the entire sheet in the server
      const res = await parseExcelFileForPreview(formData);
      if (!res.success || !res.sheets) {
        setError(res.error || "Error al recargar el archivo en el servidor.");
        setLoading(false);
        return;
      }

      const fullRows = res.sheets[selectedSheetIndex].preview;

      // Wait, we need to pass ALL rows of the spreadsheet to syncData, not just the preview!
      // In parseExcelFileForPreview, we read all rows. Let's make sure our Server Action syncs ALL rows.
      // Ah! In parseExcelFileForPreview, we returned rows.slice(0, 5) in `preview` to keep payload small.
      // So to sync all rows, we can just let the Server Action read the file from the formData again, 
      // extract the selected sheet, and sync all rows! This is much safer and avoids sending a large JSON payload 
      // from client to server.
      // Let's implement a separate Server Action or adjust syncData to parse and sync in one go!
      // Wait, let's write a wrapper in syncActions or run the sync directly using the file in FormData!
      // Let's check: can we just write an action `syncExcelFile(formData: FormData, sheetIndex: number, type: string)`?
      // Yes! That is much more secure, token-efficient, and avoids serializing thousands of rows in the browser!
      // Let's create `syncExcelFile(formData: FormData, sheetIndex: number, type: string)` in `syncActions.ts`.
      // Let's write that now by modifying `syncActions.ts` or just creating it.
      // Wait, let's look at how we can do it. Let's first finish the page.tsx UI, and then we will update `syncActions.ts` to expose `syncExcelFile`.
    } catch (err: any) {
      setError("Error durante la sincronización: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFile(null);
    setSheets([]);
    setIsParsed(false);
    setSyncResult(null);
    setError(null);
  };

  return (
    <div className="bg-white p-6 rounded-md flex-1 m-4 mt-0 shadow-sm border border-gray-100 min-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sincronizador de Datos</h1>
          <p className="text-xs text-gray-500 mt-1">
            Sincroniza y actualiza la base de datos de Vocali a partir de tus archivos Excel (.xlsx) o CSV.
          </p>
        </div>
        <Image src="/logo.png" alt="Vocali" width={100} height={40} className="object-contain" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* CONTROL PANEL */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-vocaliOrange text-white flex items-center justify-center text-xs font-bold">1</span>
              Selecciona el tipo de datos
            </h3>

            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${importType === "students"
                  ? "border-vocaliOrange bg-vocaliOrangeLight text-vocaliOrange font-medium"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                }`}>
                <input
                  type="radio"
                  name="importType"
                  value="students"
                  checked={importType === "students"}
                  onChange={() => setImportType("students")}
                  className="hidden"
                />
                <Image src="/student.png" alt="" width={18} height={18} className={importType === "students" ? "brightness-50" : ""} />
                <div className="text-xs">
                  <p className="font-semibold">Alumnos</p>
                  <p className="text-[10px] opacity-85">Sincroniza matrículas, grupos, nivel y teléfonos.</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${importType === "payments"
                  ? "border-vocaliOrange bg-vocaliOrangeLight text-vocaliOrange font-medium"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                }`}>
                <input
                  type="radio"
                  name="importType"
                  value="payments"
                  checked={importType === "payments"}
                  onChange={() => setImportType("payments")}
                  className="hidden"
                />
                <Image src="/finance.png" alt="" width={18} height={18} className={importType === "payments" ? "brightness-50" : ""} />
                <div className="text-xs">
                  <p className="font-semibold">Cobros (Pagos)</p>
                  <p className="text-[10px] opacity-85">Sincroniza mensualidades, montos, vencimientos y estados.</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${importType === "leads"
                  ? "border-vocaliOrange bg-vocaliOrangeLight text-vocaliOrange font-medium"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                }`}>
                <input
                  type="radio"
                  name="importType"
                  value="leads"
                  checked={importType === "leads"}
                  onChange={() => setImportType("leads")}
                  className="hidden"
                />
                <Image src="/parent.png" alt="" width={18} height={18} className={importType === "leads" ? "brightness-50" : ""} />
                <div className="text-xs">
                  <p className="font-semibold">Prospectos (Leads)</p>
                  <p className="text-[10px] opacity-85">Sincroniza CRM, contactos, fecha clase muestra y estatus.</p>
                </div>
              </label>
            </div>
          </div>

          {/* FILE UPLOADER */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-vocaliOrange text-white flex items-center justify-center text-xs font-bold">2</span>
              Sube tu archivo
            </h3>

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={onButtonClick}
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 ${dragActive
                    ? "border-vocaliOrange bg-vocaliOrangeLight"
                    : "border-gray-300 hover:border-vocaliOrange bg-white"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                />
                <Image src="/upload.png" alt="Subir" width={32} height={32} className="opacity-60 mb-2" />
                <p className="text-xs font-semibold text-gray-700">Arrastra tu archivo aquí</p>
                <p className="text-[10px] text-gray-400 mt-1">O haz clic para buscar (.xlsx, .csv)</p>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600 font-bold text-xs">
                    XLS
                  </div>
                  <div className="text-left truncate">
                    <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                    <p className="text-[10px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold p-1 hover:bg-red-50 rounded"
                >
                  Quitar
                </button>
              </div>
            )}
          </div>

          {/* ACTIVE SYNC BUTTON */}
          {isParsed && (
            <button
              onClick={async () => {
                setLoading(true);
                setError(null);
                setSyncResult(null);

                try {
                  const formData = new FormData();
                  formData.append("file", file!);

                  // Dynamically call the full sync action on the server
                  const activeSheetName = sheets[selectedSheetIndex].name;
                  const response = await fetch("/api/sync", {
                    method: "POST",
                    body: JSON.stringify({
                      fileBase64: await fileToBase64(file!),
                      sheetName: activeSheetName,
                      importType,
                    }),
                    headers: {
                      "Content-Type": "application/json",
                    },
                  });

                  const res = await response.json();

                  if (res.success) {
                    setSyncResult(res);
                  } else {
                    setError(res.error || "Ocurrió un error al sincronizar.");
                  }
                } catch (err: any) {
                  setError("Error al sincronizar: " + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-2 ${loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-vocaliOrange hover:bg-opacity-95"
                }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sincronizando base...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Iniciar Sincronización
                </>
              )}
            </button>
          )}

          {/* HELP TIP */}
          <div className="bg-vocaliBlueLight p-4 rounded-lg border border-blue-100 text-left text-xs text-vocaliBlue">
            <h4 className="font-semibold mb-1 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              Sugerencia de Mapeo
            </h4>
            <p className="leading-relaxed opacity-90">
              {"Asegúrate de que tu hoja de cálculo incluya cabeceras reconocibles. El sistema es inteligente y asocia nombres como 'Matrícula', 'ID Alumno', 'Nombre Completo', 'Celular' o 'Grupo' automáticamente."}
            </p>
          </div>
        </div>

        {/* WORKSPACE VIEWPORT / PREVIEW / RESULTS */}
        <div className="xl:col-span-2 space-y-6">
          {loading && !isParsed && (
            <div className="h-64 border border-gray-100 rounded-lg flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-vocaliOrange border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-gray-500 font-medium">Analizando estructura del archivo...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-lg text-left flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500 shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-semibold mb-0.5">Error de Procesamiento</h4>
                <p className="opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* REPORT VIEW */}
          {syncResult && (
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-5 text-left space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${syncResult.errors.length === 0 ? "bg-green-500" : "bg-yellow-500"
                  }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-800">Sincronización Finalizada</h3>
                  <p className="text-[10px] text-gray-400">La base de datos local de Vocali ha sido actualizada.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Procesadas</p>
                  <p className="text-xl font-bold text-gray-700">{syncResult.processed}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-green-600 font-semibold uppercase">Creados</p>
                  <p className="text-xl font-bold text-green-700">+{syncResult.created}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-center">
                  <p className="text-[10px] text-blue-600 font-semibold uppercase">Actualizados</p>
                  <p className="text-xl font-bold text-blue-700">{syncResult.updated}</p>
                </div>
              </div>

              {syncResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-yellow-600">Advertencias / Conflictos ({syncResult.errors.length}):</p>
                  <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 text-xs max-h-40 overflow-y-auto space-y-1 font-mono text-gray-600">
                    {syncResult.errors.map((err, idx) => (
                      <p key={idx} className="flex gap-2">
                        <span className="text-yellow-600 font-bold">•</span>
                        <span>{err}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW CONTAINER */}
          {isParsed && (
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm overflow-hidden text-left">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-xs text-gray-700">Vista previa del archivo</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Mostrando las primeras 5 filas para verificación.</p>
                </div>

                {/* SHEET SELECTOR FOR MULTI-SHEET EXCEL */}
                {sheets.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-semibold text-gray-500">Hoja:</label>
                    <select
                      value={selectedSheetIndex}
                      onChange={(e) => setSelectedSheetIndex(Number(e.target.value))}
                      className="text-xs p-1 border border-gray-200 rounded bg-white font-medium text-gray-700"
                    >
                      {sheets.map((s, idx) => (
                        <option key={s.name} value={idx}>
                          {s.name} ({s.totalRows} filas)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold">
                        <th className="p-2 border-r border-gray-200">#</th>
                        {Object.keys(sheets[selectedSheetIndex].preview[0] || {}).map((header) => (
                          <th key={header} className="p-2 border-r border-gray-200 truncate max-w-[150px]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheets[selectedSheetIndex].preview.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-gray-200 hover:bg-gray-50 text-gray-600">
                          <td className="p-2 border-r border-gray-200 font-semibold bg-gray-50/50 text-center">{rIdx + 2}</td>
                          {Object.keys(sheets[selectedSheetIndex].preview[0] || {}).map((header) => {
                            const val = row[header];
                            const displayVal = val === null || val === undefined
                              ? ""
                              : val instanceof Date
                                ? val.toLocaleDateString("es-MX")
                                : String(val);
                            return (
                              <td key={header} className="p-2 border-r border-gray-200 truncate max-w-[150px]" title={displayVal}>
                                {displayVal}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-right">
                  Total de filas en la hoja: <strong className="text-gray-700">{sheets[selectedSheetIndex].totalRows}</strong>
                </p>
              </div>
            </div>
          )}

          {/* INITIAL STATE EMPTY VIEW */}
          {!isParsed && !loading && (
            <div className="h-80 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-gray-50/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mb-2 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              <p className="text-xs font-semibold">Esperando archivo para previsualización</p>
              <p className="text-[10px] max-w-xs mt-1">Sube un Excel con tus matrículas, leads o egresos para ver los registros aquí antes de actualizar el sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Client helper to convert a File object to Base64 string so it can be passed via JSON fetch
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}
