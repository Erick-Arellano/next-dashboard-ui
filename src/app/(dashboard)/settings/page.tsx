import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { role } = await getSession();

  if (role === "guest") {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 bg-[#F7F8FA] min-h-screen flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-sm p-8 mt-6">
        <h1 className="text-2xl font-black text-[#2E4068] mb-1">Configuración del Sistema</h1>
        <p className="text-xs text-slate-500 mb-6">
          Gestiona las preferencias de tu portal y consulta las directivas de acceso escolar.
        </p>

        <div className="flex flex-col gap-6">
          {/* General Preferences */}
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Preferencias Generales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">Idioma de Interfaz</span>
                <select className="ring-[1.5px] ring-gray-100 p-2.5 rounded-xl text-xs bg-slate-50 font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="es">Español (México)</option>
                  <option value="en" disabled>Inglés (Próximamente)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500 font-medium">Modo Visual</span>
                <select className="ring-[1.5px] ring-gray-100 p-2.5 rounded-xl text-xs bg-slate-50 font-bold text-slate-700 outline-none cursor-pointer">
                  <option value="light">Modo Claro (Predeterminado)</option>
                  <option value="dark" disabled>Modo Oscuro (Próximamente)</option>
                </select>
              </div>
            </div>
          </div>

          {/* School Information */}
          <div className="border-b border-slate-100 pb-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Información de la Institución</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px]">Nombre</span>
                <span className="font-bold text-[#2E4068]">Vocali Lenguas Extranjeras</span>
              </div>
              <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-400 uppercase tracking-wide text-[9px]">Ciclo Académico</span>
                <span className="font-bold text-[#2E4068]">Ciclo 2026 - Primavera/Verano</span>
              </div>
            </div>
          </div>

          {/* Access Codes Table (Only for Admin to consult) */}
          {role === "admin" && (
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                Guía de Acceso para Usuarios (Administrador)
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Los usuarios pueden ingresar desde la pantalla de inicio de sesión utilizando la siguiente estructura de credenciales:
              </p>

              <div className="overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                      <th className="p-3">Rol</th>
                      <th className="p-3">Identificador/Usuario</th>
                      <th className="p-3">Código de Acceso / Contraseña</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-3 font-bold text-[#1872D9]">Administrador</td>
                      <td className="p-3 font-mono">admin</td>
                      <td className="p-3 font-mono">admin2026 <span className="text-[10px] text-slate-400">(o vocaliadmin)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-[#F47A20]">Profesores</td>
                      <td className="p-3">Código del profesor <span className="font-mono text-[10px] text-slate-400">(ej. T001)</span></td>
                      <td className="p-3 font-mono">vocali2026 <span className="text-[10px] text-slate-400">(o vocali[ID])</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-purple-600">Alumnos</td>
                      <td className="p-3">Matrícula del alumno <span className="font-mono text-[10px] text-slate-400">(ej. S001)</span></td>
                      <td className="p-3 font-mono">vocali2026 <span className="text-[10px] text-slate-400">(o vocali[ID])</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-emerald-600">Tutores / Padres</td>
                      <td className="p-3">Letra P seguida de la matrícula del alumno <span className="font-mono text-[10px] text-slate-400">(ej. PS001)</span></td>
                      <td className="p-3 font-mono">vocali2026 <span className="text-[10px] text-slate-400">(o vocali[ID])</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
