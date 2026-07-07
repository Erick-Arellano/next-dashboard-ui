export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import MessagesClient from "@/components/MessagesClient";
import { getSession } from "@/lib/session";

export default async function MessagesPage() {
  // Fetch classes with supervisor and students count
  const classes = await prisma.class.findMany({
    include: {
      supervisor: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch students with class and payments
  const students = await prisma.student.findMany({
    include: {
      class: {
        select: {
          name: true,
        },
      },
      payments: {
        select: {
          amount: true,
          dueDate: true,
          status: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch teachers with their assigned classes
  const teachers = await prisma.teacher.findMany({
    include: {
      classes: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Serialize models to plain JSON-compatible objects
  const serializedClasses = classes.map((c) => ({
    id: c.id,
    name: c.name,
    whatsappLink: c.whatsappLink,
    supervisor: c.supervisor,
    supervisorId: c.supervisorId,
    minCapacity: c.minCapacity,
    maxCapacity: c.maxCapacity,
    grade: c.grade,
    _count: c._count,
  }));

  const serializedStudents = students.map((s) => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    class: s.class,
    payments: s.payments.map((p) => ({
      amount: p.amount,
      dueDate: p.dueDate,
      status: p.status,
    })),
  }));

  const serializedTeachers = teachers.map((t) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    classes: t.classes.map((c) => ({ name: c.name })),
  }));

  const { role } = await getSession();

  return (
    <MessagesClient
      role={role}
      classes={serializedClasses}
      students={serializedStudents}
      teachers={serializedTeachers}
    />
  );
}
