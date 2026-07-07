"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { 
  deleteTeacher, 
  deleteStudent, 
  deletePayment, 
  deleteLead,
  deleteTeacherPayment,
  deleteTransaction,
  deleteClass,
  deleteReportCard,
  deleteLesson,
  deleteAnnouncement
} from "@/lib/actions";

// USE LAZY LOADING

const TeacherForm = dynamic(() => import("./forms/TeacherForm"), {
  loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./forms/StudentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const PaymentForm = dynamic(() => import("./forms/PaymentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LeadForm = dynamic(() => import("./forms/LeadForm"), {
  loading: () => <h1>Loading...</h1>,
});
const TeacherPaymentForm = dynamic(() => import("./forms/TeacherPaymentForm"), {
  loading: () => <h1>Loading...</h1>,
});
const TransactionForm = dynamic(() => import("./forms/TransactionForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
  loading: () => <h1>Loading...</h1>,
});
const ReportCardForm = dynamic(() => import("./forms/ReportCardForm"), {
  loading: () => <h1>Loading...</h1>,
});
const LessonForm = dynamic(() => import("./forms/LessonForm"), {
  loading: () => <h1>Loading...</h1>,
});
const AnnouncementForm = dynamic(() => import("./forms/AnnouncementForm"), {
  loading: () => <h1>Loading...</h1>,
});

const forms: {
  [key: string]: (type: "create" | "update", data?: any, onClose?: () => void) => JSX.Element;
} = {
  teacher: (type, data, onClose) => <TeacherForm type={type} data={data} onClose={onClose} />,
  student: (type, data, onClose) => <StudentForm type={type} data={data} onClose={onClose} />,
  payment: (type, data, onClose) => <PaymentForm type={type} data={data} onClose={onClose} />,
  lead: (type, data, onClose) => <LeadForm type={type} data={data} onClose={onClose} />,
  teacherPayment: (type, data, onClose) => <TeacherPaymentForm type={type} data={data} onClose={onClose} />,
  transaction: (type, data, onClose) => <TransactionForm type={type} data={data} onClose={onClose} />,
  class: (type, data, onClose) => <ClassForm type={type} data={data} onClose={onClose} />,
  reportCard: (type, data, onClose) => (
    <ReportCardForm
      type={type}
      data={data?.reportCard || data}
      students={data?.students || []}
      setOpen={onClose as any}
    />
  ),
  lesson: (type, data, onClose) => <LessonForm type={type} data={data} onClose={onClose} />,
  announcement: (type, data, onClose) => <AnnouncementForm type={type} data={data} onClose={onClose} />,
};

const tableNamesEsp: { [key: string]: string } = {
  teacher: "Profesores",
  student: "Alumnos",
  parent: "Tutores",
  subject: "Materias",
  class: "Grupos",
  lesson: "Cursos",
  exam: "Evaluaciones",
  assignment: "Tareas",
  result: "Calificaciones",
  attendance: "Asistencia",
  event: "Eventos",
  announcement: "Anuncios",
  payment: "Cobros",
  teacherPayment: "Pagos a Profesores",
  lead: "Prospectos",
  transaction: "Movimientos Contables",
  reportCard: "Boletines",
};

const FormModal = ({
  table,
  type,
  data,
  id,
}: {
  table:
    | "teacher"
    | "student"
    | "parent"
    | "subject"
    | "class"
    | "lesson"
    | "exam"
    | "assignment"
    | "result"
    | "attendance"
    | "event"
    | "announcement"
    | "payment"
    | "teacherPayment"
    | "lead"
    | "transaction"
    | "reportCard";
  type: "create" | "update" | "delete";
  data?: any;
  id?: number | string;
}) => {
  const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
  
  const btnStyles = {
    create: "bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white border border-yellow-100",
    update: "bg-blue-50 text-vocaliBlue hover:bg-vocaliBlue hover:text-white border border-blue-100",
    delete: "bg-orange-50 text-vocaliOrange hover:bg-vocaliOrange hover:text-white border border-orange-100",
  };

  const currentStyle = btnStyles[type] || "bg-gray-50 text-gray-600 hover:bg-gray-200";

  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setDeleting(true);
    setDeleteError("");

    let res: { success: boolean; error?: string } = { success: false, error: "" };
    if (table === "teacher") {
      res = await deleteTeacher(id.toString());
    } else if (table === "student") {
      res = await deleteStudent(id.toString());
    } else if (table === "payment") {
      res = await deletePayment(id);
    } else if (table === "lead") {
      res = await deleteLead(id);
    } else if (table === "teacherPayment") {
      res = await deleteTeacherPayment(id);
    } else if (table === "transaction") {
      res = await deleteTransaction(id);
    } else if (table === "class") {
      res = await deleteClass(id.toString());
    } else if (table === "reportCard") {
      res = await deleteReportCard(Number(id));
    } else if (table === "lesson") {
      res = await deleteLesson(id);
    } else if (table === "announcement") {
      res = await deleteAnnouncement(id);
    } else {
      res = { success: false, error: "El borrado para esta tabla aún no está implementado." };
    }

    setDeleting(false);
    if (res.success) {
      setOpen(false);
    } else {
      setDeleteError(res.error || "Error al eliminar el registro.");
    }
  };

  const Form = () => {
    return type === "delete" && id ? (
      <form onSubmit={handleDelete} className="p-4 flex flex-col gap-4">
        <span className="text-center font-medium">
          ¿Estás seguro de que deseas eliminar este registro de {tableNamesEsp[table] || table}? Todos los datos se perderán de forma permanente.
        </span>
        {deleteError && (
          <p className="text-xs text-red-500 text-center font-medium">{deleteError}</p>
        )}
        <button 
          disabled={deleting}
          className="bg-red-700 hover:bg-red-800 disabled:bg-red-400 text-white py-2 px-4 rounded-md border-none w-max self-center transition-all duration-200"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </form>
    ) : type === "create" || type === "update" ? (
      forms[table] ? (
        forms[table](type, data, () => setOpen(false))
      ) : (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Formulario en Desarrollo</h2>
          <p className="text-sm text-gray-500">
            El formulario para administrar {tableNamesEsp[table] || table} aún no está disponible en la base de datos dinámica.
          </p>
        </div>
      )
    ) : (
      "Formulario no encontrado"
    );
  };

  return (
    <>
      <button
        className={`${size} flex items-center justify-center rounded-full transition-all duration-200 shadow-sm ${currentStyle}`}
        onClick={() => setOpen(true)}
      >
        {type === "create" && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        )}
        {type === "update" && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        )}
        {type === "delete" && (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        )}
      </button>
      {open && (
        <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
            <Form />
            <div
              className="absolute top-4 right-4 cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <Image src="/close.png" alt="" width={14} height={14} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FormModal;
