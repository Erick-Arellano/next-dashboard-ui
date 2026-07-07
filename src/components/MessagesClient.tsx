"use client";

import { useState } from "react";
import Image from "next/image";
import FormModal from "./FormModal";

type ClassItem = {
  id: string;
  name: string;
  whatsappLink: string | null;
  supervisor: { name: string } | null;
  supervisorId: string | null;
  minCapacity: number;
  maxCapacity: number;
  grade: number;
  _count: { students: number };
};

type StudentItem = {
  id: string;
  name: string;
  phone: string | null;
  class: { name: string } | null;
  payments: {
    amount: number;
    dueDate: Date;
    status: string;
  }[];
};

type TeacherItem = {
  id: string;
  name: string;
  phone: string | null;
  classes: { name: string }[];
};

type MessagesClientProps = {
  role: string;
  classes: ClassItem[];
  students: StudentItem[];
  teachers: TeacherItem[];
};

export default function MessagesClient({
  role,
  classes,
  students,
  teachers,
}: MessagesClientProps) {
  const [activeTab, setActiveTab] = useState<"groups" | "students" | "teachers">("groups");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // General School WhatsApp link (e.g. Vocali General Announcement Group)
  const generalGroupLink = "https://chat.whatsapp.com/J4Q7aF8Y9Wc4X9Z8Y7Q6W"; // Placeholder to be edited

  // Format phone number to E.164 (Mexican prefix 52)
  const formatPhoneForWa = (phone: string | null) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `52${digits}`;
    }
    return digits;
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Generate customized WhatsApp message URLs
  const getWaUrl = (phone: string, text: string) => {
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // Filtering lists
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50 flex-1 p-6 flex flex-col gap-6">
      
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-[#2E4068]">Control de WhatsApp y Mensajería</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Centraliza los accesos a los grupos de WhatsApp y envía recordatorios individuales con plantillas rápidas.
          </p>
        </div>
        
        {/* GENERAL GROUP ACCENT */}
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 p-3 rounded-xl">
          <Image src="/logo.png" alt="general" width={28} height={28} className="object-contain" />
          <div className="flex flex-col">
            <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Grupo General Vocali</span>
            <div className="flex items-center gap-2 mt-0.5">
              <a 
                href={generalGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-green-800 hover:underline"
              >
                Abrir Grupo General
              </a>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => handleCopyLink(generalGroupLink, "general")}
                className="text-[10px] font-bold text-green-700 hover:text-green-900 cursor-pointer"
              >
                {copiedId === "general" ? "¡Copiado!" : "Copiar Enlace"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => { setActiveTab("groups"); setSearchTerm(""); }}
          className={`pb-3 px-1 transition-all duration-200 cursor-pointer ${
            activeTab === "groups"
              ? "border-b-2 border-[#F04F23] text-[#2E4068] font-black"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Grupos de WhatsApp
        </button>
        <button
          onClick={() => { setActiveTab("students"); setSearchTerm(""); }}
          className={`pb-3 px-1 transition-all duration-200 cursor-pointer ${
            activeTab === "students"
              ? "border-b-2 border-[#F04F23] text-[#2E4068] font-black"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Directorio de Alumnos
        </button>
        <button
          onClick={() => { setActiveTab("teachers"); setSearchTerm(""); }}
          className={`pb-3 px-1 transition-all duration-200 cursor-pointer ${
            activeTab === "teachers"
              ? "border-b-2 border-[#F04F23] text-[#2E4068] font-black"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          Directorio de Profesores
        </button>
      </div>

      {/* FILTER SEARCH BAR (for students and teachers) */}
      {activeTab !== "groups" && (
        <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <input
            type="text"
            placeholder={activeTab === "students" ? "Buscar por alumno o matrícula..." : "Buscar profesor..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm focus:outline-none bg-white font-sans"
          />
          <div className="absolute left-3 top-3.5 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
          </div>
        </div>
      )}

      {/* TAB CONTENT: GROUPS */}
      {activeTab === "groups" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Grupo</th>
                <th className="p-4">Profesor</th>
                <th className="p-4">Alumnos</th>
                <th className="p-4">Enlace de WhatsApp</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#2E4068]">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.id}</span>
                    </div>
                  </td>
                  <td className="p-4 font-semibold text-slate-600">
                    {item.supervisor?.name || "Sin asignar"}
                  </td>
                  <td className="p-4 font-bold text-slate-500">
                    {item._count.students} alumnos
                  </td>
                  <td className="p-4 text-xs font-semibold">
                    {item.whatsappLink ? (
                      <span className="text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full truncate max-w-[200px] block">
                        {item.whatsappLink}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No registrado</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      {item.whatsappLink && (
                        <>
                          <a
                            href={item.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.76 4.21 2.06 5.85L3 22l4.3-1.07C8.85 21.57 10.39 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm.08 15.65c-2.45 0-4.7-1.3-5.95-3.4-.2-.35-.1-.8.25-1l.7-.42c.3-.2.7-.1.9.2.82 1.34 2.25 2.12 3.8 2.12 1.55 0 2.98-.78 3.8-2.12.2-.3.6-.4.9-.2l.7.42c.35.2.45.65.25 1-1.25 2.1-3.5 3.4-5.95 3.4z"/>
                            </svg>
                            Abrir Grupo
                          </a>
                          <button
                            onClick={() => handleCopyLink(item.whatsappLink!, item.id)}
                            className="bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
                          >
                            {copiedId === item.id ? "¡Copiado!" : "Copiar Enlace"}
                          </button>
                        </>
                      )}
                      {role === "admin" && (
                        <FormModal table="class" type="update" data={item} />
                      )}
                      {!item.whatsappLink && role !== "admin" && (
                        <span className="text-xs text-slate-400 italic">
                          Sin enlace registrado
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: STUDENTS */}
      {activeTab === "students" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Matrícula</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Grupo</th>
                <th className="p-4">Celular</th>
                <th className="p-4 text-center">Acciones WhatsApp (Plantillas)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((item) => {
                const waPhone = formatPhoneForWa(item.phone);
                // Find next unpaid payment
                const pendingPayment = item.payments.find(p => p.status !== "Pagado");
                
                // Construct Messages
                const freeMsg = `Hola ${item.name}, te contactamos de Vocali Lenguas Extranjeras. Espero te encuentres muy bien...`;
                
                const paymentMsg = pendingPayment 
                  ? `Hola ${item.name}, te recordamos amigablemente de Vocali que tu mensualidad de $${pendingPayment.amount.toLocaleString("es-MX")} vence el ${new Date(pendingPayment.dueDate).toLocaleDateString("es-MX")}. ¡Muchas gracias!`
                  : `Hola ${item.name}, te contactamos de Vocali para coordinar el pago de tu colegiatura mensual. Quedamos a tus órdenes para cualquier duda. ¡Muchas gracias!`;
                
                const reportCardMsg = `Hola ${item.name}, te avisamos con gusto que tu boletín de calificaciones de Vocali ya está disponible en la plataforma escolar. ¡Felicidades por tu esfuerzo constante y dedicación!`;
                
                const absenceMsg = `Hola ${item.name}, notamos que no pudiste asistir a tu clase del día de hoy. Esperamos que todo esté excelente y te deseamos una linda semana. ¡Nos vemos en la siguiente sesión!`;

                return (
                  <tr key={item.id} className="border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">{item.id}</td>
                    <td className="p-4 font-bold text-[#2E4068]">{item.name}</td>
                    <td className="p-4 text-slate-600">{item.class?.name || "Sin asignar"}</td>
                    <td className="p-4 font-mono font-semibold text-slate-500">{item.phone || "-"}</td>
                    <td className="p-4">
                      {waPhone ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {/* CHAT LIBRE */}
                          <a
                            href={getWaUrl(waPhone, freeMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-50 border border-blue-200 text-[#2E4068] hover:bg-[#2E4068] hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                            title="Abrir chat libre"
                          >
                            Chat Libre
                          </a>
                          {/* RECORDATORIO DE PAGO */}
                          <a
                            href={getWaUrl(waPhone, paymentMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                            title="Enviar cobranza"
                          >
                            Cobro
                          </a>
                          {/* BOLETÍN */}
                          <a
                            href={getWaUrl(waPhone, reportCardMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                            title="Aviso de boletín"
                          >
                            Aviso Boletín
                          </a>
                          {/* INASISTENCIA */}
                          <a
                            href={getWaUrl(waPhone, absenceMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-600 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                            title="Preguntar por falta"
                          >
                            Falta
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic block text-center">
                          Sin celular registrado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB CONTENT: TEACHERS */}
      {activeTab === "teachers" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Grupos que Imparte</th>
                <th className="p-4">Celular</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((item) => {
                const waPhone = formatPhoneForWa(item.phone);
                const coordMsg = `Hola profesor(a) ${item.name}, te escribo de la administración de Vocali Lenguas Extranjeras para coordinar algunos temas académicos...`;

                return (
                  <tr key={item.id} className="border-b border-slate-100 text-sm hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-400">{item.id}</td>
                    <td className="p-4 font-bold text-[#2E4068]">{item.name}</td>
                    <td className="p-4 text-slate-600">
                      {item.classes.map((c) => c.name).join(", ") || "Sin grupos"}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-500">{item.phone || "-"}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        {waPhone ? (
                          <a
                            href={getWaUrl(waPhone, coordMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M12 2C6.48 2 2 6.48 2 12c0 2.17.76 4.21 2.06 5.85L3 22l4.3-1.07C8.85 21.57 10.39 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm.08 15.65c-2.45 0-4.7-1.3-5.95-3.4-.2-.35-.1-.8.25-1l.7-.42c.3-.2.7-.1.9.2.82 1.34 2.25 2.12 3.8 2.12 1.55 0 2.98-.78 3.8-2.12.2-.3.6-.4.9-.2l.7.42c.35.2.45.65.25 1-1.25 2.1-3.5 3.4-5.95 3.4z"/>
                            </svg>
                            Enviar Mensaje (Coordinación)
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Sin celular registrado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
