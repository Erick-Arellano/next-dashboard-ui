"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState, useEffect } from "react";
import { 
  createLesson, 
  updateLesson, 
  getTeachersList, 
  getClassesList, 
  getSubjectsList 
} from "@/lib/actions";

const schema = z.object({
  subjectId: z.coerce.number().min(1, { message: "¡El curso/materia es obligatorio!" }),
  classId: z.string().min(1, { message: "¡El grupo es obligatorio!" }),
  teacherId: z.string().min(1, { message: "¡El profesor es obligatorio!" }),
  dayOfWeek: z.string().min(1, { message: "¡El día de la semana es obligatorio!" }),
  startTime: z.string().min(1, { message: "¡La hora de inicio es obligatoria!" }),
  endTime: z.string().min(1, { message: "¡La hora de fin es obligatoria!" }),
});

type Inputs = z.infer<typeof schema>;

const LessonForm = ({
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
      subjectId: data?.subjectId ? Number(data.subjectId) : undefined,
      classId: data?.classId || "",
      teacherId: data?.teacherId || "",
      dayOfWeek: data?.dayOfWeek || "Lunes",
      startTime: data?.startTime || "08:00",
      endTime: data?.endTime || "08:45",
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [teachersList, classesList, subjectsList] = await Promise.all([
        getTeachersList(),
        getClassesList(),
        getSubjectsList()
      ]);
      setTeachers(teachersList);
      setClasses(classesList);
      setSubjects(subjectsList);
      
      if (data) {
        if (data.subjectId) setValue("subjectId", Number(data.subjectId));
        if (data.classId) setValue("classId", data.classId);
        if (data.teacherId) setValue("teacherId", data.teacherId);
        if (data.dayOfWeek) setValue("dayOfWeek", data.dayOfWeek);
        if (data.startTime) setValue("startTime", data.startTime);
        if (data.endTime) setValue("endTime", data.endTime);
      }
    };
    fetchData();
  }, [data, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    let result;
    if (type === "create") {
      result = await createLesson({
        subjectId: values.subjectId,
        classId: values.classId,
        teacherId: values.teacherId,
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
      });
    } else {
      result = await updateLesson(data.id, {
        subjectId: values.subjectId,
        classId: values.classId,
        teacherId: values.teacherId,
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
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
        {type === "create" ? "Asignar Nuevo Horario de Curso" : "Actualizar Horario del Curso"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Información del Curso y Horario
      </span>
      
      <div className="flex justify-between flex-wrap gap-4">
        {/* SUBJECT (CURSO) */}
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Curso / Materia</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            {...register("subjectId")}
          >
            <option value="">Selecciona Curso...</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {errors.subjectId?.message && (
            <p className="text-xs text-red-400">
              {errors.subjectId.message.toString()}
            </p>
          )}
        </div>

        {/* CLASS (GRUPO) */}
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Grupo</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            {...register("classId")}
          >
            <option value="">Selecciona Grupo...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>

        {/* TEACHER (PROFESOR) */}
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Profesor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            {...register("teacherId")}
          >
            <option value="">Selecciona Profesor...</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {errors.teacherId?.message && (
            <p className="text-xs text-red-400">
              {errors.teacherId.message.toString()}
            </p>
          )}
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Programación del Horario
      </span>
      
      <div className="flex justify-between flex-wrap gap-4">
        {/* DAY OF WEEK */}
        <div className="flex flex-col gap-2 w-full md:w-[30%]">
          <label className="text-xs text-gray-500">Día de la semana</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-white font-sans"
            {...register("dayOfWeek")}
          >
            {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          {errors.dayOfWeek?.message && (
            <p className="text-xs text-red-400">
              {errors.dayOfWeek.message.toString()}
            </p>
          )}
        </div>

        {/* START TIME */}
        <InputField
          label="Hora de Inicio"
          name="startTime"
          type="text"
          register={register}
          error={errors.startTime}
          inputProps={{ placeholder: "Ej. 08:00" }}
        />

        {/* END TIME */}
        <InputField
          label="Hora de Fin"
          name="endTime"
          type="text"
          register={register}
          error={errors.endTime}
          inputProps={{ placeholder: "Ej. 08:45" }}
        />
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
      )}
      
      <button
        disabled={loading}
        className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white p-2 rounded-md transition-all duration-200 mt-2 font-sans"
      >
        {loading ? "Procesando..." : type === "create" ? "Asignar Horario" : "Guardar Cambios"}
      </button>
    </form>
  );
};

export default LessonForm;
