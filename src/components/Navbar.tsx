import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Image from "next/image";
import NavbarGreeting from "./NavbarGreeting";

const Navbar = async () => {
  const { role, teacherId } = await getSession();
  
  let name = "Usuario Vocali";
  let displayRole = "Invitado";
  let photo = "/avatar.png";

  try {
    if (role === "admin") {
      name = "Ade";
      displayRole = "Administrador";
      photo = "/avatar.png";

      // Load admin avatar from local configuration file if it exists
      const fs = await import("fs");
      const path = await import("path");
      const adminPath = path.join(process.cwd(), "adminProfile.json");
      if (fs.existsSync(adminPath)) {
        try {
          const raw = fs.readFileSync(adminPath, "utf-8");
          const adminData = JSON.parse(raw);
          if (adminData.name) {
            name = adminData.name.split(" ")[0]; // Get first name for friendly greeting
          }
          if (adminData.photo) {
            photo = adminData.photo;
          }
        } catch (e) {
          console.error("Error reading admin profile in Navbar:", e);
        }
      }
    } else if (role === "teacher" && teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { name: true, photo: true }
      });
      if (teacher) {
        name = teacher.name.split(" ")[0];
        displayRole = "Profesor";
        if (teacher.photo) {
          photo = teacher.photo;
        }
      }
    } else if (role === "student" && teacherId) {
      const student = await prisma.student.findUnique({
        where: { id: teacherId },
        select: { name: true, photo: true }
      });
      if (student) {
        name = student.name.split(" ")[0];
        displayRole = "Alumno";
        if (student.photo) {
          photo = student.photo;
        }
      }
    } else if (role === "parent" && teacherId) {
      const student = await prisma.student.findUnique({
        where: { id: teacherId },
        select: { name: true, photo: true }
      });
      if (student) {
        name = `Tutor de ${student.name.split(" ")[0]}`;
        displayRole = "Tutor";
        if (student.photo) {
          photo = student.photo;
        }
      }
    }
  } catch (err) {
    console.error("Error fetching navbar details:", err);
  }

  return (
    <div className='flex items-center justify-end p-4 gap-4 print:hidden'>
      {/* USER INFO */}
      <div className='flex flex-col text-right select-none'>
        <NavbarGreeting name={name} />
        <span className="text-[9px] font-extrabold text-slate-400 mt-1 uppercase tracking-wider">{displayRole}</span>
      </div>
      <div className="w-9 h-9 rounded-full overflow-hidden relative border border-slate-100 shadow-sm flex items-center justify-center bg-slate-100">
        <Image 
          src={photo} 
          alt="Avatar" 
          width={36} 
          height={36} 
          className="object-cover w-full h-full"
        />
      </div>
    </div>
  );
};

export default Navbar;