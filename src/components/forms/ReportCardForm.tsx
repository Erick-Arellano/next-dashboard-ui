"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { createReportCard, updateReportCard } from "@/lib/actions";
import { useRouter } from "next/navigation";

const schema = z.object({
  studentId: z.string().min(1, { message: "El alumno es obligatorio." }),
  dateText: z.string().min(1, { message: "La fecha del ciclo es obligatoria." }),
  reading: z.coerce.number().min(0).max(100, { message: "Calificación debe ser entre 0 y 100." }),
  grammar: z.coerce.number().min(0).max(100, { message: "Calificación debe ser entre 0 y 100." }),
  listening: z.coerce.number().min(0).max(100, { message: "Calificación debe ser entre 0 y 100." }),
  speaking: z.coerce.number().min(0).max(100, { message: "Calificación debe ser entre 0 y 100." }),
  observations: z.string().min(5, { message: "Las observaciones deben tener al menos 5 caracteres." }),
});

type ReportCardFormSchema = z.infer<typeof schema>;

type StudentItem = {
  id: string;
  name: string;
  classId: string | null;
  className: string;
  teacherId: string;
  teacherName: string;
};

type ReportCardFormProps = {
  type: "create" | "update";
  data?: any;
  students: StudentItem[];
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ReportCardForm({
  type,
  data,
  students,
  setOpen,
}: ReportCardFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // States to keep track of auto-filled student details
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportCardFormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: data?.studentId || "",
      dateText: data?.dateText || "Junio 2026",
      reading: data?.reading || 0,
      grammar: data?.grammar || 0,
      listening: data?.listening || 0,
      speaking: data?.speaking || 0,
      observations: data?.observations || "",
    },
  });

  const watchStudentId = watch("studentId");
  const watchReading = watch("reading") || 0;
  const watchGrammar = watch("grammar") || 0;
  const watchListening = watch("listening") || 0;
  const watchSpeaking = watch("speaking") || 0;

  // Auto-calculate total average
  const totalAverage = Math.round((Number(watchReading) + Number(watchGrammar) + Number(watchListening) + Number(watchSpeaking)) / 4);

  // Prefill details on edit or student select
  useEffect(() => {
    if (watchStudentId) {
      const student = students.find((s) => s.id === watchStudentId);
      if (student) {
        setSelectedStudent(student);
      } else {
        setSelectedStudent(null);
      }
    } else {
      setSelectedStudent(null);
    }
  }, [watchStudentId, students]);

  const onSubmit = handleSubmit(async (values) => {
    setError("");
    setIsLoading(true);

    if (!selectedStudent || !selectedStudent.classId || !selectedStudent.teacherId) {
      setError("El alumno seleccionado debe tener un grupo y profesor asignado.");
      setIsLoading(false);
      return;
    }

    try {
      let res;
      if (type === "create") {
        res = await createReportCard({
          studentId: values.studentId,
          classId: selectedStudent.classId,
          teacherId: selectedStudent.teacherId,
          dateText: values.dateText,
          reading: values.reading,
          grammar: values.grammar,
          listening: values.listening,
          speaking: values.speaking,
          observations: values.observations,
        });
      } else {
        res = await updateReportCard(data.id, {
          studentId: values.studentId,
          classId: selectedStudent.classId,
          teacherId: selectedStudent.teacherId,
          dateText: values.dateText,
          reading: values.reading,
          grammar: values.grammar,
          listening: values.listening,
          speaking: values.speaking,
          observations: values.observations,
        });
      }

      if (res.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error || "Ocurrió un error al procesar el boletín.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de servidor al guardar el boletín.");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 p-4 bg-white rounded-lg">
      <h1 className="text-xl font-bold text-gray-800">
        {type === "create" ? "Generar Nuevo Boletín" : "Editar Boletín de Calificaciones"}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* STUDENT SELECT */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-gray-500 block">Seleccionar Alumno</label>
        {type === "update" ? (
          <div className="bg-slate-50 border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-700">
            {students.find((s) => s.id === data?.studentId)?.name || data?.studentId}
          </div>
        ) : (
          <select
            {...register("studentId")}
            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-vocaliBlue transition"
          >
            <option value="">-- Elige un alumno --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        )}
        {errors.studentId && (
          <p className="text-[10px] text-red-500 font-semibold">{errors.studentId.message}</p>
        )}
      </div>

      {/* AUTO-FILLED INFO */}
      {selectedStudent && (
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 font-medium block">Grupo / Curso</span>
            <span className="font-bold text-gray-700 mt-0.5 block">{selectedStudent.className || "Sin grupo"}</span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">Profesor Asignado</span>
            <span className="font-bold text-gray-700 mt-0.5 block">{selectedStudent.teacherName || "Sin profesor"}</span>
          </div>
        </div>
      )}

      {/* RATING INPUTS & DATE */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Lectura</label>
          <input
            type="number"
            {...register("reading")}
            placeholder="0-100"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-vocaliBlue"
          />
          {errors.reading && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.reading.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Gramática</label>
          <input
            type="number"
            {...register("grammar")}
            placeholder="0-100"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-vocaliBlue"
          />
          {errors.grammar && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.grammar.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Escucha Comprensiva</label>
          <input
            type="number"
            {...register("listening")}
            placeholder="0-100"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-vocaliBlue"
          />
          {errors.listening && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.listening.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Expresión Oral</label>
          <input
            type="number"
            {...register("speaking")}
            placeholder="0-100"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-vocaliBlue"
          />
          {errors.speaking && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.speaking.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500">Fecha Ciclo</label>
          <input
            type="text"
            {...register("dateText")}
            placeholder="e.g. Dic 2025"
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-vocaliBlue"
          />
          {errors.dateText && (
            <p className="text-[10px] text-red-500 font-semibold">{errors.dateText.message}</p>
          )}
        </div>

        {/* DYNAMIC TOTAL PREVIEW */}
        <div className="bg-slate-50 border border-dashed border-gray-300 rounded-lg p-2.5 flex flex-col justify-center items-center">
          <span className="text-[10px] text-gray-400 font-semibold uppercase">Promedio Total</span>
          <span className={`text-xl font-black mt-0.5 ${totalAverage >= 90 ? "text-green-600" : totalAverage >= 70 ? "text-blue-600" : "text-red-500"}`}>
            {totalAverage || 0}
          </span>
        </div>
      </div>

      {/* OBSERVATIONS TEXTAREA */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-500">Observaciones y Recomendaciones</label>
        <textarea
          {...register("observations")}
          rows={4}
          placeholder="Escribe comentarios de retroalimentación detallados..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-700 outline-none focus:border-vocaliBlue transition resize-none"
        />
        {errors.observations && (
          <p className="text-[10px] text-red-500 font-semibold">{errors.observations.message}</p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-vocaliBlue hover:bg-blue-600 text-white font-bold py-3.5 rounded-lg text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        {isLoading ? "Procesando..." : type === "create" ? "Guardar y Crear Boletín" : "Actualizar Boletín"}
      </button>
    </form>
  );
}
