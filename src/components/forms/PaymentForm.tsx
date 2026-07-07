"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState, useEffect } from "react";
import { createPayment, updatePayment, getStudentsList } from "@/lib/actions";

const schema = z.object({
  studentId: z.string().min(1, { message: "¡El alumno es obligatorio!" }),
  amount: z.coerce.number().min(0, { message: "¡El monto debe ser un número positivo!" }),
  hours: z.coerce.number().min(0, { message: "¡Las horas deben ser un número positivo!" }),
  type: z.enum(["Mensual", "Por horas", "Curso completo"], { message: "¡El tipo de cobro es obligatorio!" }),
  status: z.enum(["Pagado", "Pendiente", "Atrasado"], { message: "¡El estado es obligatorio!" }),
  dueDate: z.preprocess((val) => val === "" ? undefined : val, z.coerce.date({ message: "¡La fecha del próximo pago es obligatoria!" })),
  paymentDate: z.preprocess((val) => val === "" ? null : val, z.coerce.date().nullable().optional()),
  method: z.string().optional(),
});

type Inputs = z.infer<typeof schema>;

const formatDateString = (date: any) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PaymentForm = ({
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
      amount: data?.amount || 0,
      hours: data?.hours || 0,
      type: data?.type || "Mensual",
      status: data?.status || "Pendiente",
      method: data?.method || "",
      dueDate: (data?.dueDate ? formatDateString(data.dueDate) : undefined) as any,
      paymentDate: (data?.paymentDate ? formatDateString(data.paymentDate) : "") as any,
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [students, setStudents] = useState<{ id: string; name: string; classId: string | null }[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; classId: string | null } | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      const list = await getStudentsList();
      setStudents(list);
      
      // If updating, find selected student
      if (data?.studentId) {
        const student = list.find(s => s.id === data.studentId);
        if (student) {
          setSelectedStudent(student);
          setValue("studentId", student.id);
        }
      }
    };
    fetchStudents();
  }, [data, setValue]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const student = students.find((s) => s.id === id);
    setSelectedStudent(student || null);
    setValue("studentId", id);
  };

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    let result;
    if (type === "create") {
      result = await createPayment({
        studentId: values.studentId,
        amount: values.amount,
        hours: values.hours,
        type: values.type,
        status: values.status,
        dueDate: values.dueDate,
        paymentDate: values.paymentDate,
        method: values.method || null,
      });
    } else {
      result = await updatePayment(Number(data.id), {
        studentId: values.studentId,
        amount: values.amount,
        hours: values.hours,
        type: values.type,
        status: values.status,
        dueDate: values.dueDate,
        paymentDate: values.paymentDate,
        method: values.method || null,
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
        {type === "create" ? "Registrar un nuevo cobro" : "Actualizar información del cobro"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Información del Alumno
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/3">
          <label className="text-xs text-gray-500">Alumno</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("studentId")}
            onChange={handleStudentChange}
            disabled={type === "update"}
          >
            <option value="">Selecciona un alumno...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.id})
              </option>
            ))}
          </select>
          {errors.studentId?.message && (
            <p className="text-xs text-red-400">
              {errors.studentId.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4 justify-center bg-slate-50 p-2 rounded-md border border-slate-100">
          <span className="text-xs text-gray-400">Matrícula</span>
          <span className="text-sm font-semibold text-gray-700">
            {selectedStudent?.id || "-"}
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4 justify-center bg-slate-50 p-2 rounded-md border border-slate-100">
          <span className="text-xs text-gray-400">Grupo</span>
          <span className="text-sm font-semibold text-gray-700">
            {selectedStudent?.classId || "-"}
          </span>
        </div>
      </div>

      <span className="text-xs text-gray-400 font-medium">
        Detalle del Cobro
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Tipo de Cobro</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
          >
            <option value="Mensual">Mensual</option>
            <option value="Por horas">Por horas</option>
            <option value="Curso completo">Curso completo</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">
              {errors.type.message.toString()}
            </p>
          )}
        </div>

        <InputField
          label="Monto ($)"
          name="amount"
          type="number"
          defaultValue={data?.amount}
          register={register}
          error={errors.amount}
        />

        <InputField
          label="Horas Pagadas"
          name="hours"
          type="number"
          defaultValue={data?.hours}
          register={register}
          error={errors.hours}
          inputProps={{ step: "any" }}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Estado</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("status")}
          >
            <option value="Pagado">Pagado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Atrasado">Atrasado</option>
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">
              {errors.status.message.toString()}
            </p>
          )}
        </div>

        <InputField
          label="Próximo Pago (Vencimiento)"
          name="dueDate"
          type="date"
          register={register}
          error={errors.dueDate}
        />

        <InputField
          label="Fecha de Pago"
          name="paymentDate"
          type="date"
          register={register}
          error={errors.paymentDate}
        />

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Método de Pago</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("method")}
          >
            <option value="">Ninguno / Pendiente</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Tarjeta">Tarjeta</option>
            <option value="Efectivo">Efectivo</option>
          </select>
          {errors.method?.message && (
            <p className="text-xs text-red-400">
              {errors.method.message.toString()}
            </p>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
      )}
      
      <button
        disabled={loading}
        className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white p-2 rounded-md transition-all duration-200 mt-2"
      >
        {loading ? "Registrando..." : type === "create" ? "Crear" : "Guardar Cambios"}
      </button>
    </form>
  );
};

export default PaymentForm;
