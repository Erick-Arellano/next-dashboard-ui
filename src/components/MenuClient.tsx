"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type MenuItem = {
  icon: string;
  label: string;
  href: string;
  visible: string[];
};

type MenuCategory = {
  title: string;
  items: MenuItem[];
};

const menuItems: MenuCategory[] = [
  {
    title: "General",
    items: [
      {
        icon: "/home.png",
        label: "Inicio",
        href: "/",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Calendario",
        href: "/list/calendar",
        visible: ["admin"],
      },
    ],
  },
  {
    title: "Personas",
    items: [
      {
        icon: "/student.png",
        label: "Alumnos",
        href: "/list/students",
        visible: ["admin", "teacher"],
      },
      {
        icon: "/teacher.png",
        label: "Profesores",
        href: "/list/teachers",
        visible: ["admin"],
      },
      {
        icon: "/parent.png",
        label: "Prospectos",
        href: "/list/prospects",
        visible: ["admin"],
      },
    ],
  },
  {
    title: "Academia",
    items: [
      {
        icon: "/class.png",
        label: "Grupos",
        href: "/list/classes",
        visible: ["admin"],
      },
      {
        icon: "/subject.png",
        label: "Cursos",
        href: "/list/lessons",
        visible: ["admin"],
      },
      {
        icon: "/report.png",
        label: "Calificaciones",
        href: "/list/report-cards",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/evaluate.png",
        label: "Evaluación",
        href: "/list/evaluations",
        visible: ["admin"],
      },
      {
        icon: "/exam.png",
        label: "Evaluar Profesor",
        href: "/student/evaluations",
        visible: ["student"],
      },
    ],
  },
  {
    title: "Finanzas",
    items: [
      {
        icon: "/income.png",
        label: "Cobros",
        href: "/list/payments",
        visible: ["admin"],
      },
      {
        icon: "/finance.png",
        label: "Pagos",
        href: "/list/teacher-payments",
        visible: ["admin"],
      },
      {
        icon: "/book.png",
        label: "Bitácora",
        href: "/list/transactions",
        visible: ["admin"],
      },
    ],
  },
  {
    title: "Comunicación",
    items: [
      {
        icon: "/announcement.png",
        label: "Anuncios",
        href: "/list/announcements",
        visible: ["admin", "student", "parent"],
      },
      {
        icon: "/message.png",
        label: "Mensajes",
        href: "/list/messages",
        visible: ["admin", "student", "parent"],
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        icon: "/upload.png",
        label: "Sincronizar",
        href: "/admin/sync",
        visible: ["admin"],
      },
      {
        icon: "/profile.png",
        label: "Perfil",
        href: "/profile",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Configuración",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/logout.png",
        label: "Cerrar Sesión",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
      },
    ],
  },
];

type MenuClientProps = {
  role: string;
};

export default function MenuClient({ role }: MenuClientProps) {
  const pathname = usePathname();

  return (
    <div className="mt-4 text-sm flex flex-col gap-4">
      {menuItems.map((category) => {
        const visibleItems = category.items.filter((item) => item.visible.includes(role));
        if (visibleItems.length === 0) return null;

        return (
          <div className="flex flex-col gap-1.5" key={category.title}>
            <span className="hidden lg:block text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-1 px-2 select-none opacity-80">
              {category.title}
            </span>
            {visibleItems.map((item) => {
              const targetHref = item.label === "Inicio" && role === "teacher" ? "/teacher" : item.href;
              
              // Check if currently active
              const isActive = pathname === targetHref || (targetHref !== "/" && pathname.startsWith(targetHref));

              const linkClasses = isActive
                ? "flex items-center justify-center lg:justify-start gap-4 text-vocaliBlue font-bold py-2 md:px-2 rounded-md bg-blue-50 border-l-4 border-vocaliBlue transition-all duration-150"
                : "flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight transition-colors duration-150 border-l-4 border-transparent";

              if (item.label === "Cerrar Sesión") {
                return (
                  <a
                    href={targetHref}
                    key={item.label}
                    className="flex items-center justify-center lg:justify-start gap-4 text-gray-500 py-2 md:px-2 rounded-md hover:bg-lamaSkyLight cursor-pointer transition-colors duration-150 border-l-4 border-transparent"
                  >
                    <Image src={item.icon} alt="" width={20} height={20} />
                    <span className="hidden lg:block">{item.label}</span>
                  </a>
                );
              }
              return (
                <Link href={targetHref} key={item.label} className={linkClasses}>
                  <Image
                    src={item.icon}
                    alt=""
                    width={20}
                    height={20}
                    className={isActive ? "brightness-95 contrast-125" : ""}
                  />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
