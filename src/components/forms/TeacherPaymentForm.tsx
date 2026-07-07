"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState, useEffect } from "react";
import { createTeacherPayment, updateTeacherPayment, getTeachersList } from "@/lib/actions";

const schema = z.object({
  teacherId: z.string().min(1, { message: "¡El profesor es obligatorio!" }),
  amount: z.coerce.number().min(0, { message: "¡El monto debe ser un número positivo!" }),
  hours: z.coerce.number().min(0, { message: "¡Las horas deben ser un número positivo!" }),
  type: z.enum(["Pago por Horas", "Sueldo Fijo"], { message: "¡El tipo de pago es obligatorio!" }),
  status: z.enum(["Pagado", "Pendiente"], { message: "¡El estado es obligatorio!" }),
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

const TeacherPaymentForm = ({
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
      type: data?.type || "Pago por Horas",
      status: data?.status || "Pendiente",
      method: data?.method || "",
      paymentDate: (data?.paymentDate ? formatDateString(data.paymentDate) : "") as any,
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const list = await getTeachersList();
      setTeachers(list);
      
      if (data?.teacherId) {
        setValue("teacherId", data.teacherId);
      }
    };
    fetchTeachers();
  }, [data, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    let result;
    if (type === "create") {
      result = await createTeacherPayment({
        teacherId: values.teacherId,
        amount: values.amount,
        hours: values.hours,
        type: values.type,
        status: values.status,
        paymentDate: values.paymentDate,
        method: values.method || null,
      });
    } else {
      result = await updateTeacherPayment(Number(data.id), {
        teacherId: values.teacherId,
        amount: values.amount,
        hours: values.hours,
        type: values.type,
        status: values.status,
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
        {type === "create" ? "Registrar pago a profesor (Egreso)" : "Actualizar información del pago"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Información del Profesor
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/2">
          <label className="text-xs text-gray-500">Profesor</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("teacherId")}
            disabled={type === "update"}
          >
            <option value="">Selecciona un profesor...</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.id})
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
        Detalle del Pago
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Concepto / Tipo</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
          >
            <option value="Pago por Horas">Pago por Horas</option>
            <option value="Sueldo Fijo">Sueldo Fijo</option>
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
          label="Horas Trabajadas"
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
          </select>
          {errors.status?.message && (
            <p className="text-xs text-red-400">
              {errors.status.message.toString()}
            </p>
          )}
        </div>

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
        {loading ? "Procesando..." : type === "create" ? "Registrar Pago" : "Guardar Cambios"}
      </button>
    </form>
  );
};

export default TeacherPaymentForm;
