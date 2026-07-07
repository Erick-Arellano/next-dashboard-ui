"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState } from "react";
import { createLead, updateLead } from "@/lib/actions";

const schema = z.object({
  matricula: z.string().optional(),
  name: z.string().min(1, { message: "¡El nombre es obligatorio!" }),
  language: z.string().optional(),
  level: z.string().optional(),
  age: z.string().optional(),
  phone: z.string().optional(),
  contactMethod: z.string().optional(),
  leadDate: z.coerce.date().optional().nullable(),
  sampleClassDate: z.coerce.date().optional().nullable(),
  status: z.string().min(1, { message: "¡El estatus es obligatorio!" }),
  notes: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const LeadForm = ({
  type,
  data,
  onClose,
}: {
  type: "create" | "update";
  data?: any;
  onClose?: () => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data
      ? {
          ...data,
          leadDate: data.leadDate ? new Date(data.leadDate).toISOString().split("T")[0] : "",
          sampleClassDate: data.sampleClassDate ? new Date(data.sampleClassDate).toISOString().split("T")[0] : "",
        }
      : {},
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      let result;
      if (type === "create") {
        result = await createLead(values as any);
      } else {
        result = await updateLead(data.id, values as any);
      }

      if (result.success) {
        onClose?.();
      } else {
        setErrorMsg(result.error || "Algo salió mal al guardar el prospecto.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Registrar Nuevo Prospecto (Lead)" : "Actualizar Información de Prospecto"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nombre Completo"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors?.name}
        />
        <InputField
          label="Matrícula (Opcional)"
          name="matricula"
          defaultValue={data?.matricula}
          register={register}
          error={errors?.matricula}
        />
        <InputField
          label="Teléfono"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors?.phone}
        />
        <InputField
          label="Nivel (Ej: A1, A2)"
          name="level"
          defaultValue={data?.level}
          register={register}
          error={errors?.level}
        />
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Idioma de Interés</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full font-sans bg-white"
            {...register("language")}
            defaultValue={data?.language || "Inglés"}
          >
            <option value="Inglés">Inglés</option>
            <option value="Chino">Chino</option>
            <option value="Alemán">Alemán</option>
            <option value="Francés">Francés</option>
            <option value="Italiano">Italiano</option>
            <option value="Ruso">Ruso</option>
            <option value="Japonés">Japonés</option>
            <option value="Portugués">Portugués</option>
          </select>
          {errors.language?.message && (
            <p className="text-xs text-red-400">{errors.language.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Estatus</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full font-sans bg-white"
            {...register("status")}
            defaultValue={data?.status || "NUEVO"}
          >
            <option value="NUEVO">Nuevo</option>
            <option value="CONTACTADO">Contactado</option>
            <option value="CLASE_MUESTRA">Clase Muestra</option>
            <option value="LISTA_ESPERA">Lista de Espera</option>
            <option value="INSCRITO">Inscrito</option>
            <option value="NO_INTERESADO">No Interesado / Pérdida</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">{errors.status.message.toString()}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Canal de Contacto</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full font-sans bg-white"
            {...register("contactMethod")}
            defaultValue={data?.contactMethod || "Whatsapp"}
          >
            <option value="Whatsapp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Visita">Visita Directa</option>
            <option value="Llamada">Llamada Telefónica</option>
            <option value="Otro">Otro</option>
          </select>
          {errors.contactMethod?.message && (
            <p className="text-xs text-red-400">{errors.contactMethod.message.toString()}</p>
          )}
        </div>

        <InputField
          label="Edad (Ej: 15, 18+)"
          name="age"
          defaultValue={data?.age}
          register={register}
          error={errors?.age}
        />
      </div>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Fecha de Captación"
          name="leadDate"
          type="date"
          register={register}
          error={errors?.leadDate}
        />
        <InputField
          label="Fecha de Clase Muestra"
          name="sampleClassDate"
          type="date"
          register={register}
          error={errors?.sampleClassDate}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <label className="text-xs text-gray-500">Notas / Comentarios</label>
        <textarea
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full h-24"
          {...register("notes")}
          defaultValue={data?.notes}
        />
        {errors.notes?.message && (
          <p className="text-xs text-red-400">{errors.notes.message.toString()}</p>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
      )}

      <button
        disabled={loading}
        className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white p-2 rounded-md transition-all duration-200"
      >
        {loading ? "Guardando..." : type === "create" ? "Registrar" : "Guardar Cambios"}
      </button>
    </form>
  );
};

export default LeadForm;
