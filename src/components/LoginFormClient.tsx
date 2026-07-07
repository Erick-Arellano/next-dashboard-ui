"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginFormClientProps = {
  loginAction: (identifier: string, accessCode: string) => Promise<{ success: boolean; error?: string; role?: string }>;
};

export default function LoginFormClient({ loginAction }: LoginFormClientProps) {
  const [identifier, setIdentifier] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await loginAction(identifier.trim(), accessCode.trim());
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setErrorMsg(res.error || "Identificador o código incorrecto.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold text-center animate-shake">
          {errorMsg}
        </div>
      )}

      {/* Identifier */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-500 font-bold">Identificador / Usuario</label>
        <input
          type="text"
          placeholder="Ej. admin, T001, S001, o Teléfono de tutor"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="ring-[1.5px] ring-gray-200 focus:ring-2 focus:ring-[#2E4068] p-3 rounded-xl text-sm w-full bg-slate-50 focus:bg-white focus:outline-none transition-all duration-200 font-sans"
        />
      </div>

      {/* Access Code / Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-500 font-bold">Código de Acceso / Contraseña</label>
        <input
          type="password"
          placeholder="Código de acceso escolar"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          required
          className="ring-[1.5px] ring-gray-200 focus:ring-2 focus:ring-[#2E4068] p-3 rounded-xl text-sm w-full bg-slate-50 focus:bg-white focus:outline-none transition-all duration-200 font-sans"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-[#2E4068] hover:bg-[#F04F23] text-white py-3.5 rounded-xl text-sm font-black tracking-wide active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-md disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Verificando..." : "Iniciar Sesión"}
      </button>
    </form>
  );
}
