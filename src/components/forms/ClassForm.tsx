"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState, useEffect } from "react";
import { createClass, updateClass, getTeachersList } from "@/lib/actions";

const schema = z.object({
  id: z.string().min(1, { message: "¡El código del grupo es obligatorio y debe ser único!" }),
  name: z.string().min(1, { message: "¡El nombre del grupo es obligatorio!" }),
  minCapacity: z.coerce.number().min(1, { message: "¡El cupo mínimo debe ser al menos 1 alumno!" }),
  maxCapacity: z.coerce.number().min(1, { message: "¡El cupo máximo debe ser al menos 1 alumno!" }),
  grade: z.coerce.number().min(1, { message: "¡El nivel escolar es obligatorio!" }),
  supervisorId: z.string().optional().nullable(),
  whatsappLink: z.string().url({ message: "¡Ingresa una URL válida de invitación a WhatsApp!" }).optional().or(z.literal("")),
}).refine((data) => data.maxCapacity >= data.minCapacity, {
  message: "El cupo máximo no puede ser menor al cupo mínimo.",
  path: ["maxCapacity"],
});

type Inputs = z.infer<typeof schema>;

const ClassForm = ({
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
    setValue,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: data?.id || "",
      name: data?.name || "",
      minCapacity: data?.minCapacity ?? 3,
      maxCapacity: data?.maxCapacity ?? 8,
      grade: data?.grade || 1,
      supervisorId: data?.supervisorId || "",
      whatsappLink: data?.whatsappLink || "",
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const list = await getTeachersList();
      setTeachers(list);
      
      if (data?.supervisorId) {
        setValue("supervisorId", data.supervisorId);
      }
    };
    fetchTeachers();
  }, [data, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    let result;
    if (type === "create") {
      result = await createClass({
        id: values.id,
        name: values.name,
        minCapacity: values.minCapacity,
        maxCapacity: values.maxCapacity,
        grade: values.grade,
        supervisorId: values.supervisorId || null,
        whatsappLink: values.whatsappLink || null,
      });
    } else {
      result = await updateClass(data.id, {
        name: values.name,
        minCapacity: values.minCapacity,
        maxCapacity: values.maxCapacity,
        grade: values.grade,
        supervisorId: values.supervisorId || null,
        whatsappLink: values.whatsappLink || null,
      });
    }
    setLoading(false);
    if (result.success) {
      onClose?.();
    } else {
      setErrorMsg(result.error || "Algo salió mal.");
    }
  });

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear Nuevo Grupo (Clase)" : "Actualizar Información del Grupo"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Información del Grupo
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Código / ID del Grupo"
          name="id"
          type="text"
          defaultValue={data?.id}
          register={register}
          error={errors.id}
          inputProps={{ disabled: type === "update", placeholder: "Ej. 1A, INGLÉS-1" }}
        />

        <InputField
          label="Nombre del Grupo"
          name="name"
          type="text"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
          inputProps={{ placeholder: "Ej. Inglés Básico Niños" }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Nivel Escolar</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            {...register("grade")}
            defaultValue={data?.grade || 1}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((g) => (
              <option key={g} value={g}>
                Nivel {g}
              </option>
            ))}
          </select>
          {errors.grade?.message && (
            <p className="text-xs text-red-400">
              {errors.grade.message.toString()}
            </p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Límites de Cupo y Personal
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Cupo Mínimo (Alumnos)"
          name="minCapacity"
          type="number"
          defaultValue={data?.minCapacity ?? 3}
          register={register}
          error={errors.minCapacity}
          inputProps={{ min: 1 }}
        />

        <InputField
          label="Cupo Máximo (Alumnos)"
          name="maxCapacity"
          type="number"
          defaultValue={data?.maxCapacity ?? 8}
          register={register}
          error={errors.maxCapacity}
          inputProps={{ min: 1 }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Profesor Supervisor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            {...register("supervisorId")}
          >
            <option value="">Ninguno / Sin asignar</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.id})
              </option>
            ))}
          </select>
          {errors.supervisorId?.message && (
            <p className="text-xs text-red-400">
              {errors.supervisorId.message.toString()}
            </p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Integración y Enlaces
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-[60%]">
          <label className="text-xs text-gray-500">Enlace del Grupo de WhatsApp</label>
          <input
            type="text"
            {...register("whatsappLink")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            placeholder="Ej. https://chat.whatsapp.com/..."
            defaultValue={data?.whatsappLink || ""}
          />
          {errors.whatsappLink?.message && (
            <p className="text-xs text-red-400">
              {errors.whatsappLink.message.toString()}
            </p>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
      )}
      
      <button
        disabled={loading}
        className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white p-2 rounded-md transition-all duration-200 mt-2 font-sans"
      >
        {loading ? "Procesando..." : type === "create" ? "Crear Grupo" : "Guardar Cambios"}
      </button>
    </form>
  );
};

export default ClassForm;
