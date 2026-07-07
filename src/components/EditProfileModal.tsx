"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/lib/actions";

type EditProfileModalProps = {
  role: string;
  id: string | null;
  initialData: {
    name?: string;
    email: string;
    phone: string;
    address?: string;
    photo?: string;
  };
};

export default function EditProfileModal({ role, id, initialData }: EditProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialData.name || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [photo, setPhoto] = useState(initialData.photo || "");
  
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPhoto(data.url);
      } else {
        setErrorMsg(data.error || "Error al subir la imagen.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de conexión al subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await updateProfileAction(role, id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        photo,
      });

      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Algo salió mal al guardar los cambios.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#2E4068] hover:bg-opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
      >
        <Image src="/edit.png" alt="" width={14} height={14} className="brightness-200" />
        Editar Datos
      </button>

      {/* MODAL OVERLAY */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-[#2E4068] mb-1">Actualizar Información</h3>
            <p className="text-xs text-slate-500 mb-6">
              Modifica tu nombre, datos de contacto y sube una foto de perfil actualizada.
            </p>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs font-semibold text-center mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* PHOTO UPLOADER */}
              <div className="flex items-center gap-4 border-b border-slate-50 pb-4 mb-2">
                <div className="w-16 h-16 rounded-full overflow-hidden relative bg-slate-100 flex items-center justify-center border border-slate-200">
                  <Image
                    src={photo || "/avatar.png"}
                    alt="Avatar Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-700">Foto de Perfil</span>
                  <label className="text-[10px] font-bold text-[#F47A20] hover:underline cursor-pointer">
                    {uploading ? "Subiendo..." : "Subir nueva foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="ring-[1.5px] ring-gray-200 focus:ring-2 focus:ring-[#2E4068] p-3 rounded-xl text-sm w-full bg-slate-50 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="ring-[1.5px] ring-gray-200 focus:ring-2 focus:ring-[#2E4068] p-3 rounded-xl text-sm w-full bg-slate-50 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">Teléfono</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Número de contacto"
                  className="ring-[1.5px] ring-gray-200 focus:ring-2 focus:ring-[#2E4068] p-3 rounded-xl text-sm w-full bg-slate-50 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Address - Only show if not admin */}
              {role !== "admin" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">Dirección Residencial</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, Número, Colonia, Ciudad"
                    className="ring-[1.5px] ring-gray-200 focus:ring-2 focus:ring-[#2E4068] p-3 rounded-xl text-sm w-full bg-slate-50 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-5 py-2.5 rounded-xl bg-[#2E4068] hover:bg-opacity-95 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
