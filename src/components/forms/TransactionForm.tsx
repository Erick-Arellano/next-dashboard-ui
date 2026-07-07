"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState } from "react";
import { createTransaction } from "@/lib/actions";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], { message: "¡El tipo de transacción es obligatorio!" }),
  category: z.string().min(1, { message: "¡La categoría es obligatoria!" }),
  amount: z.coerce.number().min(0.01, { message: "¡El monto debe ser mayor a 0!" }),
  date: z.preprocess((val) => val === "" ? undefined : val, z.coerce.date({ message: "¡La fecha es obligatoria!" })),
  description: z.string().min(3, { message: "¡La descripción debe tener al menos 3 caracteres!" }),
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

const TransactionForm = ({
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
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: data?.type || "EXPENSE",
      category: data?.category || "Servicios",
      amount: data?.amount || 0,
      date: (data?.date ? formatDateString(data.date) : formatDateString(new Date())) as any,
      description: data?.description || "",
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const selectedType = watch("type");

  const categories = selectedType === "INCOME" 
    ? ["Mensualidad", "Inscripción", "Venta de Materiales", "Otro Ingreso"]
    : ["Nómina", "Servicios", "Renta", "Papelería/Materiales", "Mantenimiento", "Publicidad", "Otros"];

  const onSubmit = handleSubmit(async (values) => {
    if (type !== "create") {
      setErrorMsg("La edición directa de transacciones del libro diario no está permitida por seguridad contable.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    const result = await createTransaction({
      amount: values.amount,
      type: values.type,
      category: values.category,
      date: values.date,
      description: values.description,
    });
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
        {type === "create" ? "Registrar Movimiento Manual (Libro Diario)" : "Detalle de Transacción"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Detalle del Movimiento Contable
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Tipo de Flujo</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("type")}
            disabled={type === "update"}
          >
            <option value="EXPENSE">Egreso (Gasto/Salida)</option>
            <option value="INCOME">Ingreso (Entrada)</option>
          </select>
          {errors.type?.message && (
            <p className="text-xs text-red-400">
              {errors.type.message.toString()}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Categoría</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("category")}
            disabled={type === "update"}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category?.message && (
            <p className="text-xs text-red-400">
              {errors.category.message.toString()}
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
          inputProps={{ disabled: type === "update" }}
        />

        <InputField
          label="Fecha Contable"
          name="date"
          type="date"
          register={register}
          error={errors.date}
          inputProps={{ disabled: type === "update" }}
        />

        <div className="flex flex-col gap-2 w-full">
          <InputField
            label="Descripción / Concepto detallado"
            name="description"
            type="text"
            defaultValue={data?.description}
            register={register}
            error={errors.description}
            inputProps={{ disabled: type === "update" }}
          />
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
      )}
      
      {type === "create" && (
        <button
          disabled={loading}
          className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white p-2 rounded-md transition-all duration-200 mt-2"
        >
          {loading ? "Registrando..." : "Registrar Movimiento"}
        </button>
      )}
    </form>
  );
};

export default TransactionForm;
