import { loginGeneralAction } from "@/lib/actions";
import LoginFormClient from "@/components/LoginFormClient";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const isInvalidLink = searchParams.error === "invalid_link";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#E4ECFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 flex flex-col items-center relative overflow-hidden">
        
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#F04F23]"></div>

        {/* LOGO */}
        <div className="flex items-center gap-2 mb-6">
          <Image src="/logo.png" alt="logo" width={48} height={48} className="object-contain" />
          <div className="flex flex-col">
            <span className="font-black text-2xl text-[#2E4068] tracking-tight leading-none">vocali</span>
            <span className="text-[8px] uppercase tracking-widest font-bold text-slate-500 mt-1">LENGUAS EXTRANJERAS</span>
          </div>
        </div>

        <h2 className="text-xl font-black text-[#2E4068] text-center mb-1">Portal de Acceso</h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          Ingresa tus credenciales autorizadas (Administrador, Profesor, Alumno o Tutor) para entrar al sistema.
        </p>

        {isInvalidLink && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold text-center w-full mb-4">
            El enlace de acceso ha expirado o no es válido. Por favor, inicia sesión de nuevo.
          </div>
        )}

        {/* CLIENT FORM */}
        <LoginFormClient loginAction={loginGeneralAction} />
      </div>
    </div>
  );
}