import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { redirect } from "next/navigation";
import EditProfileModal from "@/components/EditProfileModal";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { role, teacherId } = await getSession();

  if (role === "guest") {
    redirect("/sign-in");
  }

  let displayName = "";
  let roleLabel = "";
  let emailText = "";
  let phoneText = "";
  let addressText = "";
  let photoText = "";
  let additionalDetails: { label: string; value: string }[] = [];

  try {
    if (role === "admin") {
      displayName = "Ade Administrador";
      roleLabel = "Administrador General";
      emailText = "admin@vocali.edu.mx";
      phoneText = "55-1234-5678";
      photoText = "/avatar.png";
      addressText = "Campus Central Vocali";

      // Load from local file if exists
      const fs = await import("fs");
      const path = await import("path");
      const adminPath = path.join(process.cwd(), "adminProfile.json");
      if (fs.existsSync(adminPath)) {
        try {
          const raw = fs.readFileSync(adminPath, "utf-8");
          const adminData = JSON.parse(raw);
          displayName = adminData.name || displayName;
          emailText = adminData.email || emailText;
          phoneText = adminData.phone || phoneText;
          photoText = adminData.photo || photoText;
        } catch (e) {
          console.error("Error reading admin profile data:", e);
        }
      }

      const [studentCount, teacherCount, classCount] = await Promise.all([
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.class.count(),
      ]);

      additionalDetails = [
        { label: "Alumnos Inscritos", value: `${studentCount} alumnos` },
        { label: "Profesores Activos", value: `${teacherCount} profesores` },
        { label: "Grupos Supervisados", value: `${classCount} grupos` },
        { label: "Soporte Técnico", value: "sistemas@vocali.edu.mx" },
      ];
    } else if (role === "teacher" && teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        include: { subjects: true },
      });

      if (teacher) {
        displayName = teacher.name;
        roleLabel = `Profesor (${teacher.id})`;
        emailText = teacher.email || "";
        phoneText = teacher.phone || "";
        addressText = teacher.address || "";
        photoText = teacher.photo || "/avatar.png";

        additionalDetails = [
          { label: "Materias/Cursos", value: teacher.subjects.map((s) => s.name).join(", ") || "Ninguna" },
          { label: "Dirección Registrada", value: teacher.address || "No especificada" },
          { label: "Fecha de Ingreso", value: "Ciclo Escolar Activo" },
        ];
      }
    } else if (role === "student" && teacherId) {
      // For students, teacherId cookie holds their student ID
      const student = await prisma.student.findUnique({
        where: { id: teacherId },
        include: { class: true },
      });

      if (student) {
        displayName = student.name;
        roleLabel = `Alumno (${student.id})`;
        emailText = student.email || "";
        phoneText = student.phone || "";
        addressText = student.address || "";
        photoText = student.photo || "/avatar.png";

        additionalDetails = [
          { label: "Grupo Asignado", value: student.class?.name || "Sin grupo asignado" },
          { label: "Nivel Escolar (Grado)", value: `Nivel ${student.grade || 1}` },
          { label: "Dirección Registrada", value: student.address || "No especificada" },
        ];
      }
    } else if (role === "parent" && teacherId) {
      // For parents, teacherId cookie holds their student's ID
      const student = await prisma.student.findUnique({
        where: { id: teacherId },
        include: { class: true },
      });

      if (student) {
        displayName = `Tutor de ${student.name}`;
        roleLabel = "Tutor / Padre de Familia";
        phoneText = student.phone || "";
        emailText = student.email || "";
        addressText = student.address || "";
        photoText = student.photo || "/avatar.png";

        additionalDetails = [
          { label: "Alumno a Cargo", value: student.name },
          { label: "Grupo del Alumno", value: student.class?.name || "Sin grupo asignado" },
          { label: "Matrícula del Alumno", value: student.id },
          { label: "Dirección del Alumno", value: student.address || "No especificada" },
        ];
      }
    }
  } catch (error) {
    console.error("Error loading profile:", error);
  }

  return (
    <div className="p-6 bg-[#F7F8FA] min-h-screen flex flex-col items-center justify-start">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        
        {/* Profile Header Background */}
        <div className="h-32 bg-gradient-to-r from-[#2E4068] to-[#1872D9] relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-200 overflow-hidden relative shadow-md flex items-center justify-center">
              <Image 
                src={photoText || "/avatar.png"} 
                alt="Profile Avatar" 
                width={80} 
                height={80} 
                className="object-cover w-full h-full" 
              />
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-16 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6 mb-6">
            {/* Left side: Name & Role Badge */}
            <div className="flex-1">
              <h1 className="text-2xl font-black text-[#2E4068] tracking-tight leading-tight">{displayName || "Usuario Vocali"}</h1>
              <span className="inline-block mt-1.5 px-3 py-1 bg-blue-50 text-[#1872D9] text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                {roleLabel}
              </span>
            </div>
            
            {/* Right side: Contact info & Edit Profile Button */}
            <div className="flex flex-col items-start md:items-end gap-4 text-sm min-w-[220px]">
              <div className="text-slate-600 text-xs flex flex-col gap-1 w-full md:text-right">
                <p className="flex items-center md:justify-end gap-1.5">
                  <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Correo:</span>
                  <span className="font-bold text-slate-700">{emailText || "No especificado"}</span>
                </p>
                <p className="flex items-center md:justify-end gap-1.5">
                  <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Teléfono:</span>
                  <span className="font-bold text-slate-700">{phoneText || "No especificado"}</span>
                </p>
              </div>
              <EditProfileModal 
                role={role} 
                id={role === "admin" ? null : teacherId} 
                initialData={{ name: displayName, email: emailText, phone: phoneText, address: addressText, photo: photoText }} 
              />
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Información Detallada</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalDetails.map((detail, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col gap-1 hover:bg-slate-100 transition-colors"
              >
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  {detail.label}
                </span>
                <span className="text-sm font-bold text-slate-700">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
