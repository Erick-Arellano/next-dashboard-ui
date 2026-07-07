"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState } from "react";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";

const schema = z.object({
  title: z.string().min(1, { message: "¡El título es obligatorio!" }),
  description: z.string().min(1, { message: "¡El contenido del anuncio es obligatorio!" }),
  classId: z.string().optional().nullable(),
  date: z.coerce.date().default(() => new Date()),
});

type Inputs = z.infer<typeof schema>;

const AnnouncementForm = ({
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
    defaultValues: (data
      ? {
          title: data.title,
          description: data.description || "",
          classId: data.classId || "",
          date: data.date ? new Date(data.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        }
      : {
          description: "",
          date: new Date().toISOString().split("T")[0],
        }) as any,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        title: values.title,
        description: values.description,
        classId: values.classId === "" ? null : values.classId,
        date: values.date,
      };

      let result;
      if (type === "create") {
        result = await createAnnouncement(payload as any);
      } else {
        result = await updateAnnouncement(data.id, payload as any);
      }

      if (result.success) {
        onClose?.();
      } else {
        setErrorMsg(result.error || "Algo salió mal al guardar el anuncio.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  });

  const classes = data?.classes || [];

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-black text-[#2E4068]">
        {type === "create" ? "Publicar Nuevo Anuncio" : "Actualizar Anuncio"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        {/* Title */}
        <InputField
          label="Título del Anuncio"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors?.title}
        />

        {/* Date */}
        <InputField
          label="Fecha de Publicación"
          name="date"
          type="date"
          register={register}
          error={errors?.date}
        />

        {/* Target Class Selector */}
        <div className="flex flex-col gap-2 w-full md:w-[48%]">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wide">
            Dirigido a (Grupo)
          </label>
          <select
            className="ring-[1.5px] ring-[#E4ECFA] p-3 rounded-xl text-sm w-full outline-none font-medium focus:ring-[#2E4068] transition-all bg-slate-50 focus:bg-white"
            {...register("classId")}
            defaultValue={data?.classId || ""}
          >
            <option value="">Todos los Alumnos y Tutores</option>
            {classes.map((cls: { id: string; name: string }) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-500 font-semibold mt-0.5">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

        {/* Description/Content */}
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-slate-500 font-bold uppercase tracking-wide">
            Contenido del Anuncio
          </label>
          <textarea
            rows={4}
            className="ring-[1.5px] ring-[#E4ECFA] p-3 rounded-xl text-sm w-full outline-none font-medium focus:ring-[#2E4068] transition-all bg-slate-50 focus:bg-white resize-none"
            {...register("description")}
            defaultValue={data?.description}
            placeholder="Escribe el mensaje del anuncio aquí..."
          />
          {errors.description?.message && (
            <p className="text-xs text-red-500 font-semibold mt-0.5">
              {errors.description.message.toString()}
            </p>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-semibold text-center mt-2">
          {errorMsg}
        </p>
      )}

      <button
        disabled={loading}
        className="bg-[#2E4068] hover:bg-opacity-95 text-white p-3.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all shadow-md mt-4 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {loading ? "Guardando..." : "Publicar Anuncio"}
      </button>
    </form>
  );
};

export default AnnouncementForm;
