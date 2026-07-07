"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import Image from "next/image";
import { useState } from "react";
import { createTeacher, updateTeacher } from "@/lib/actions";

const schema = z.object({
  username: z.string().optional().or(z.literal("")),
  email: z.string().email({ message: "¡Dirección de correo electrónico inválida!" }),
  password: z.string().optional().or(z.literal("")),
  firstName: z.string().min(1, { message: "¡El nombre es obligatorio!" }),
  lastName: z.string().min(1, { message: "¡El apellido es obligatorio!" }),
  phone: z.string().min(1, { message: "¡El teléfono es obligatorio!" }),
  address: z.string().optional(),
  subject: z.string().min(1, { message: "¡El curso es obligatorio!" }),
  classId: z.string().min(1, { message: "¡El grupo es obligatorio!" }),
  birthday: z.coerce.date().optional(),
  sex: z.enum(["male", "female"]).optional(),
  img: z.any(),
});

type Inputs = z.infer<typeof schema>;

const TeacherForm = ({
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
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Split name into first and last names if it comes merged as a single name string
  const parsedData = { ...data };
  if (data && data.name && !data.firstName) {
    const parts = data.name.trim().split(/\s+/);
    parsedData.firstName = parts[0] || "";
    parsedData.lastName = parts.slice(1).join(" ") || "";
  }

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setErrorMsg("");
    try {
      // 1. Upload photo if selected
      let photoUrl = data?.img || "/avatar.png";
      if (values.img && values.img[0]) {
        const formData = new FormData();
        formData.append("file", values.img[0]);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.success) {
            photoUrl = uploadData.url;
          } else {
            setErrorMsg(uploadData.error || "Error al subir la fotografía.");
            setLoading(false);
            return;
          }
        } else {
          setErrorMsg("Error de red al subir la fotografía.");
          setLoading(false);
          return;
        }
      }

      // 2. Execute Action
      const { username, email, firstName, lastName, phone, address, subject, classId } = values;

      if (type === "create") {
        const result = await createTeacher({
          username: username || "",
          email,
          firstName,
          lastName,
          phone,
          address,
          photo: photoUrl,
          subject,
          classId,
        });
        if (result.success) {
          onClose?.();
        } else {
          setErrorMsg(result.error || "Algo salió mal al registrar al profesor.");
        }
      } else {
        const result = await updateTeacher({
          id: data.id,
          username: username || "",
          email,
          firstName,
          lastName,
          phone,
          address,
          photo: photoUrl,
          subject,
          classId,
        });
        if (result.success) {
          onClose?.();
        } else {
          setErrorMsg(result.error || "Algo salió mal al actualizar al profesor.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Crear un nuevo profesor" : "Actualizar información del profesor"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Información de Autenticación
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nombre de usuario"
          name="username"
          defaultValue={parsedData?.username}
          register={register}
          error={errors?.username}
        />
        <InputField
          label="Correo electrónico"
          name="email"
          defaultValue={parsedData?.email}
          register={register}
          error={errors?.email}
        />
        <InputField
          label="Contraseña"
          name="password"
          type="password"
          defaultValue={parsedData?.password}
          register={register}
          error={errors?.password}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Información Personal
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Nombre"
          name="firstName"
          defaultValue={parsedData?.firstName}
          register={register}
          error={errors.firstName}
        />
        <InputField
          label="Apellido"
          name="lastName"
          defaultValue={parsedData?.lastName}
          register={register}
          error={errors.lastName}
        />
        <InputField
          label="Teléfono"
          name="phone"
          defaultValue={parsedData?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Dirección (Opcional)"
          name="address"
          defaultValue={parsedData?.address}
          register={register}
          error={errors.address}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Curso</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subject")}
            defaultValue={parsedData?.subjects?.[0]?.name}
          >
            <option value="Inglés">Inglés</option>
            <option value="Español">Español</option>
            <option value="Chino">Chino</option>
            <option value="Francés">Francés</option>
            <option value="Alemán">Alemán</option>
          </select>
          {errors.subject?.message && (
            <p className="text-xs text-red-400">
              {errors.subject.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Grupo</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("classId")}
            defaultValue={parsedData?.classes?.[0]?.id}
          >
            <option value="1A">1A</option>
            <option value="2B">2B</option>
            <option value="3C">3C</option>
            <option value="4B">4B</option>
            <option value="5A">5A</option>
            <option value="5B">5B</option>
            <option value="6B">6B</option>
            <option value="6C">6C</option>
            <option value="6D">6D</option>
            <option value="7A">7A</option>
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message.toString()}
            </p>
          )}
        </div>
        <InputField
          label="Fecha de nacimiento"
          name="birthday"
          defaultValue={parsedData?.birthday}
          register={register}
          error={errors.birthday}
          type="date"
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Sexo</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={parsedData?.sex}
          >
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message.toString()}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4 justify-center">
          <label
            className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
            htmlFor="img"
          >
            <Image src="/upload.png" alt="" width={28} height={28} />
            <span>Subir una foto</span>
          </label>
          <input type="file" id="img" {...register("img")} className="hidden" />
          {errors.img?.message && (
            <p className="text-xs text-red-400">
              {errors.img.message.toString()}
            </p>
          )}
        </div>
      </div>
      {errorMsg && (
        <p className="text-xs text-red-500 font-medium text-center">{errorMsg}</p>
      )}
      <button 
        disabled={loading} 
        className="bg-blue-400 hover:bg-blue-500 disabled:bg-blue-300 text-white p-2 rounded-md transition-all duration-200"
      >
        {loading ? (type === "create" ? "Creando..." : "Guardando...") : (type === "create" ? "Crear" : "Guardar Cambios")}
      </button>
    </form>
  );
};

export default TeacherForm;
