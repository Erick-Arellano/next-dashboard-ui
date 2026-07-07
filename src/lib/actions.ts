"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";

export async function createTeacher(data: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  photo?: string;
  subject: string;
  classId: string;
}) {
  try {
    // Generate a unique ID (T followed by count + 1)
    const count = await prisma.teacher.count();
    const id = `T${String(count + 1).padStart(3, "0")}`;

    await prisma.teacher.create({
      data: {
        id,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        photo: data.photo || "/avatar.png",
        subjects: {
          connect: { name: data.subject },
        },
        classes: {
          connect: { id: data.classId },
        },
      },
    });

    revalidatePath("/list/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    // Handle unique constraint on email
    if (error.code === "P2002") {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }
    return { success: false, error: "Error al crear el profesor en la base de datos." };
  }
}

export async function createStudent(data: {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  photo?: string;
  classId: string;
  grade: number;
}) {
  try {
    // Validate class capacity limit
    if (data.classId) {
      const targetClass = await prisma.class.findUnique({
        where: { id: data.classId },
        include: {
          _count: {
            select: { students: true },
          },
        },
      });

      if (targetClass && targetClass._count.students >= targetClass.maxCapacity) {
        return {
          success: false,
          error: `El grupo "${targetClass.name}" ha alcanzado su capacidad máxima permitida de ${targetClass.maxCapacity} alumnos.`,
        };
      }
    }

    // Generate a unique ID (S followed by count + 1)
    const count = await prisma.student.count();
    const id = `S${String(count + 1).padStart(3, "0")}`;

    await prisma.student.create({
      data: {
        id,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        grade: Number(data.grade),
        classId: data.classId,
        photo: data.photo || "/avatar.png",
      },
    });

    revalidatePath("/list/students");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating student:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }
    return { success: false, error: "Error al crear el alumno en la base de datos." };
  }
}

export async function deleteTeacher(id: string) {
  try {
    // 1. Set supervisorId to null in Class table
    await prisma.class.updateMany({
      where: { supervisorId: id },
      data: { supervisorId: null },
    });

    // 2. Delete dependent records
    await prisma.result.deleteMany({ where: { teacherId: id } });
    await prisma.assignment.deleteMany({ where: { teacherId: id } });
    await prisma.exam.deleteMany({ where: { teacherId: id } });
    await prisma.lesson.deleteMany({ where: { teacherId: id } });
    await prisma.teacherPayment.deleteMany({ where: { teacherId: id } });

    // 3. Delete the teacher
    await prisma.teacher.delete({
      where: { id },
    });

    revalidatePath("/list/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting teacher:", error);
    return { success: false, error: "Error al eliminar el profesor de la base de datos." };
  }
}

export async function deleteStudent(id: string) {
  try {
    // Delete dependent records
    await prisma.payment.deleteMany({ where: { studentId: id } });
    await prisma.result.deleteMany({ where: { studentId: id } });

    // Delete the student
    await prisma.student.delete({
      where: { id },
    });

    revalidatePath("/list/students");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return { success: false, error: "Error al eliminar el alumno de la base de datos." };
  }
}

export async function getStudentsList() {
  try {
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        classId: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return students;
  } catch (error) {
    console.error("Error fetching students list:", error);
    return [];
  }
}

export async function createPayment(data: {
  studentId: string;
  amount: number;
  hours: number;
  type: string;
  status: string;
  dueDate: Date;
  paymentDate?: Date | null;
  method?: string | null;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        amount: data.amount,
        hours: data.hours,
        type: data.type,
        status: data.status,
        dueDate: data.dueDate,
        paymentDate: data.paymentDate || null,
        method: data.method || null,
      },
      include: { student: true }
    });

    // Sincronizar Libro Diario si está Pagado
    if (payment.status === "Pagado") {
      await prisma.transaction.create({
        data: {
          amount: payment.amount,
          type: "INCOME",
          category: payment.type === "Inscripción" ? "Inscripción" : "Mensualidad",
          date: payment.paymentDate || new Date(),
          description: `Cobro liquidado - Alumno: ${payment.student?.name || "Desconocido"} (${payment.studentId})`,
          paymentId: payment.id,
        }
      });
    }

    revalidatePath("/list/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return { success: false, error: "Error al registrar el cobro en la base de datos." };
  }
}

export async function updatePayment(
  id: number,
  data: {
    studentId: string;
    amount: number;
    hours: number;
    type: string;
    status: string;
    dueDate: Date;
    paymentDate?: Date | null;
    method?: string | null;
  }
) {
  try {
    const oldPayment = await prisma.payment.findUnique({
      where: { id },
      include: { transaction: true }
    });

    if (!oldPayment) {
      return { success: false, error: "El cobro no existe." };
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: {
        amount: data.amount,
        hours: data.hours,
        type: data.type,
        status: data.status,
        dueDate: data.dueDate,
        paymentDate: data.paymentDate || null,
        method: data.method || null,
      },
      include: { student: true, transaction: true }
    });

    // Sincronizar Libro Diario
    if (updatedPayment.status === "Pagado") {
      if (updatedPayment.transaction) {
        await prisma.transaction.update({
          where: { id: updatedPayment.transaction.id },
          data: {
            amount: updatedPayment.amount,
            category: updatedPayment.type === "Inscripción" ? "Inscripción" : "Mensualidad",
            date: updatedPayment.paymentDate || new Date(),
            description: `Cobro liquidado - Alumno: ${updatedPayment.student?.name || "Desconocido"} (${updatedPayment.studentId})`,
          }
        });
      } else {
        await prisma.transaction.create({
          data: {
            amount: updatedPayment.amount,
            type: "INCOME",
            category: updatedPayment.type === "Inscripción" ? "Inscripción" : "Mensualidad",
            date: updatedPayment.paymentDate || new Date(),
            description: `Cobro liquidado - Alumno: ${updatedPayment.student?.name || "Desconocido"} (${updatedPayment.studentId})`,
            paymentId: updatedPayment.id,
          }
        });
      }
    } else {
      if (updatedPayment.transaction) {
        await prisma.transaction.delete({
          where: { id: updatedPayment.transaction.id }
        });
      }
    }

    revalidatePath("/list/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return { success: false, error: "Error al actualizar el cobro en la base de datos." };
  }
}

export async function deletePayment(id: string | number) {
  try {
    const paymentId = Number(id);
    await prisma.transaction.deleteMany({
      where: { paymentId }
    });

    await prisma.payment.delete({
      where: { id: paymentId },
    });

    revalidatePath("/list/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Error al eliminar el cobro de la base de datos." };
  }
}

export async function createLead(data: {
  matricula?: string | null;
  name: string;
  language?: string | null;
  level?: string | null;
  age?: string | null;
  phone?: string | null;
  contactMethod?: string | null;
  leadDate?: Date | null;
  sampleClassDate?: Date | null;
  status: string;
  notes?: string | null;
}) {
  try {
    await prisma.lead.create({
      data: {
        matricula: data.matricula || null,
        name: data.name,
        language: data.language || null,
        level: data.level || null,
        age: data.age || null,
        phone: data.phone || null,
        contactMethod: data.contactMethod || null,
        leadDate: data.leadDate ? new Date(data.leadDate) : null,
        sampleClassDate: data.sampleClassDate ? new Date(data.sampleClassDate) : null,
        status: data.status,
        notes: data.notes || null,
      },
    });

    revalidatePath("/list/prospects");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return { success: false, error: "Error al crear el prospecto en la base de datos." };
  }
}

export async function updateLead(
  id: number,
  data: {
    matricula?: string | null;
    name: string;
    language?: string | null;
    level?: string | null;
    age?: string | null;
    phone?: string | null;
    contactMethod?: string | null;
    leadDate?: Date | null;
    sampleClassDate?: Date | null;
    status: string;
    notes?: string | null;
  }
) {
  try {
    await prisma.lead.update({
      where: { id: Number(id) },
      data: {
        matricula: data.matricula || null,
        name: data.name,
        language: data.language || null,
        level: data.level || null,
        age: data.age || null,
        phone: data.phone || null,
        contactMethod: data.contactMethod || null,
        leadDate: data.leadDate ? new Date(data.leadDate) : null,
        sampleClassDate: data.sampleClassDate ? new Date(data.sampleClassDate) : null,
        status: data.status,
        notes: data.notes || null,
      },
    });

    revalidatePath("/list/prospects");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating lead:", error);
    return { success: false, error: "Error al actualizar el prospecto en la base de datos." };
  }
}

export async function deleteLead(id: string | number) {
  try {
    await prisma.lead.delete({
      where: { id: Number(id) },
    });

    revalidatePath("/list/prospects");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return { success: false, error: "Error al eliminar el prospecto de la base de datos." };
  }
}

export async function getTeachersList() {
  try {
    const teachers = await prisma.teacher.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return teachers;
  } catch (error) {
    console.error("Error fetching teachers list:", error);
    return [];
  }
}

export async function createTeacherPayment(data: {
  teacherId: string;
  amount: number;
  type: string;
  hours: number;
  status: string;
  paymentDate?: Date | null;
  method?: string | null;
}) {
  try {
    const teacherPayment = await prisma.teacherPayment.create({
      data: {
        teacherId: data.teacherId,
        amount: data.amount,
        type: data.type,
        hours: data.hours,
        status: data.status,
        paymentDate: data.paymentDate || null,
        method: data.method || null,
      },
      include: { teacher: true }
    });

    if (teacherPayment.status === "Pagado") {
      await prisma.transaction.create({
        data: {
          amount: teacherPayment.amount,
          type: "EXPENSE",
          category: "Nómina",
          date: teacherPayment.paymentDate || new Date(),
          description: `Pago de Nómina - Profesor: ${teacherPayment.teacher?.name || "Desconocido"} (${teacherPayment.teacherId})`,
          teacherPaymentId: teacherPayment.id,
        }
      });
    }

    revalidatePath("/list/teacher-payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating teacher payment:", error);
    return { success: false, error: "Error al registrar el pago al profesor." };
  }
}

export async function updateTeacherPayment(
  id: number,
  data: {
    teacherId: string;
    amount: number;
    type: string;
    hours: number;
    status: string;
    paymentDate?: Date | null;
    method?: string | null;
  }
) {
  try {
    const oldTeacherPayment = await prisma.teacherPayment.findUnique({
      where: { id },
      include: { transaction: true }
    });

    if (!oldTeacherPayment) {
      return { success: false, error: "El pago no existe." };
    }

    const updated = await prisma.teacherPayment.update({
      where: { id },
      data: {
        amount: data.amount,
        type: data.type,
        hours: data.hours,
        status: data.status,
        paymentDate: data.paymentDate || null,
        method: data.method || null,
      },
      include: { teacher: true, transaction: true }
    });

    if (updated.status === "Pagado") {
      if (updated.transaction) {
        await prisma.transaction.update({
          where: { id: updated.transaction.id },
          data: {
            amount: updated.amount,
            date: updated.paymentDate || new Date(),
            description: `Pago de Nómina - Profesor: ${updated.teacher?.name || "Desconocido"} (${updated.teacherId})`,
          }
        });
      } else {
        await prisma.transaction.create({
          data: {
            amount: updated.amount,
            type: "EXPENSE",
            category: "Nómina",
            date: updated.paymentDate || new Date(),
            description: `Pago de Nómina - Profesor: ${updated.teacher?.name || "Desconocido"} (${updated.teacherId})`,
            teacherPaymentId: updated.id,
          }
        });
      }
    } else {
      if (updated.transaction) {
        await prisma.transaction.delete({
          where: { id: updated.transaction.id }
        });
      }
    }

    revalidatePath("/list/teacher-payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating teacher payment:", error);
    return { success: false, error: "Error al actualizar el pago del profesor." };
  }
}

export async function deleteTeacherPayment(id: string | number) {
  try {
    const paymentId = Number(id);
    await prisma.transaction.deleteMany({
      where: { teacherPaymentId: paymentId }
    });

    await prisma.teacherPayment.delete({
      where: { id: paymentId },
    });

    revalidatePath("/list/teacher-payments");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting teacher payment:", error);
    return { success: false, error: "Error al eliminar el pago del profesor." };
  }
}

export async function createTransaction(data: {
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: Date;
  description: string;
}) {
  try {
    await prisma.transaction.create({
      data: {
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: new Date(data.date),
        description: data.description,
      },
    });

    revalidatePath("/list/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return { success: false, error: "Error al crear la transacción en la base de datos." };
  }
}

export async function deleteTransaction(id: string | number) {
  try {
    await prisma.transaction.delete({
      where: { id: Number(id) },
    });

    revalidatePath("/list/transactions");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    return { success: false, error: "Error al eliminar la transacción de la base de datos." };
  }
}

export async function updateTeacher(data: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  photo?: string;
  subject: string;
  classId: string;
}) {
  try {
    await prisma.teacher.update({
      where: { id: data.id },
      data: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        ...(data.photo ? { photo: data.photo } : {}),
        subjects: {
          set: [],
          connect: { name: data.subject },
        },
        classes: {
          set: [],
          connect: { id: data.classId },
        },
      },
    });

    revalidatePath("/list/teachers");
    revalidatePath(`/list/teachers/${data.id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating teacher:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }
    return { success: false, error: "Error al actualizar el profesor en la base de datos." };
  }
}

export async function updateStudent(data: {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  photo?: string;
  classId: string;
  grade: number;
}) {
  try {
    // Validate class capacity limit if class changed
    if (data.classId) {
      const student = await prisma.student.findUnique({
        where: { id: data.id },
        select: { classId: true },
      });

      if (student && student.classId !== data.classId) {
        const targetClass = await prisma.class.findUnique({
          where: { id: data.classId },
          include: {
            _count: {
              select: { students: true },
            },
          },
        });

        if (targetClass && targetClass._count.students >= targetClass.maxCapacity) {
          return {
            success: false,
            error: `El grupo "${targetClass.name}" ha alcanzado su capacidad máxima permitida de ${targetClass.maxCapacity} alumnos.`,
          };
        }
      }
    }

    await prisma.student.update({
      where: { id: data.id },
      data: {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        grade: Number(data.grade),
        classId: data.classId,
        ...(data.photo ? { photo: data.photo } : {}),
      },
    });

    revalidatePath("/list/students");
    revalidatePath(`/list/students/${data.id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating student:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El correo electrónico ya está en uso." };
    }
    return { success: false, error: "Error al actualizar el alumno en la base de datos." };
  }
}

export async function createClass(data: {
  id: string;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  grade: number;
  supervisorId?: string | null;
  whatsappLink?: string | null;
}) {
  try {
    const existing = await prisma.class.findUnique({
      where: { id: data.id },
    });
    if (existing) {
      return { success: false, error: "Ya existe un grupo con este código/identificador." };
    }

    await prisma.class.create({
      data: {
        id: data.id,
        name: data.name,
        capacity: Number(data.maxCapacity),
        minCapacity: Number(data.minCapacity),
        maxCapacity: Number(data.maxCapacity),
        grade: Number(data.grade),
        supervisorId: data.supervisorId || null,
        whatsappLink: data.whatsappLink || null,
      },
    });

    revalidatePath("/list/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating class:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El nombre del grupo ya está en uso." };
    }
    return { success: false, error: "Error al crear el grupo en la base de datos." };
  }
}

export async function updateClass(
  id: string,
  data: {
    name: string;
    minCapacity: number;
    maxCapacity: number;
    grade: number;
    supervisorId?: string | null;
    whatsappLink?: string | null;
  }
) {
  try {
    await prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        capacity: Number(data.maxCapacity),
        minCapacity: Number(data.minCapacity),
        maxCapacity: Number(data.maxCapacity),
        grade: Number(data.grade),
        supervisorId: data.supervisorId || null,
        whatsappLink: data.whatsappLink || null,
      },
    });

    revalidatePath("/list/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating class:", error);
    if (error.code === "P2002") {
      return { success: false, error: "El nombre del grupo ya está en uso." };
    }
    return { success: false, error: "Error al actualizar el grupo en la base de datos." };
  }
}

export async function deleteClass(id: string) {
  try {
    // 1. Remove class reference from students
    await prisma.student.updateMany({
      where: { classId: id },
      data: { classId: null },
    });

    // 2. Delete assignments, exams, lessons linked to this class
    await prisma.assignment.deleteMany({ where: { classId: id } });
    await prisma.exam.deleteMany({ where: { classId: id } });
    await prisma.lesson.deleteMany({ where: { classId: id } });

    // 3. Delete the class
    await prisma.class.delete({
      where: { id },
    });

    revalidatePath("/list/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting class:", error);
    return { success: false, error: "Error al eliminar el grupo de la base de datos." };
  }
}

export async function createEvaluation(data: {
  classId: string;
  teacherId: string;
  q1_dinamica: number;
  q2_recursos: number;
  q3_claridad: number;
  q4_escuchado: number;
  q5_participa: number;
  q6_dudas: number;
  q7_puntual: number;
  q8_interes: number;
  q9_material: number;
  q10_relevante: number;
  q11_global: number;
  likedText?: string;
  improveText?: string;
}) {
  try {
    const metrics = [
      data.q1_dinamica, data.q2_recursos, data.q3_claridad, data.q4_escuchado,
      data.q5_participa, data.q6_dudas, data.q7_puntual, data.q8_interes,
      data.q9_material, data.q10_relevante, data.q11_global
    ];

    for (const val of metrics) {
      if (typeof val !== "number" || val < 1 || val > 10) {
        return { success: false, error: "Todas las calificaciones numéricas deben ser del 1 al 10." };
      }
    }

    if (!data.classId || !data.teacherId) {
      return { success: false, error: "Faltan datos obligatorios (Grupo o Profesor)." };
    }

    await prisma.evaluation.create({
      data: {
        classId: data.classId,
        teacherId: data.teacherId,
        q1_dinamica: Number(data.q1_dinamica),
        q2_recursos: Number(data.q2_recursos),
        q3_claridad: Number(data.q3_claridad),
        q4_escuchado: Number(data.q4_escuchado),
        q5_participa: Number(data.q5_participa),
        q6_dudas: Number(data.q6_dudas),
        q7_puntual: Number(data.q7_puntual),
        q8_interes: Number(data.q8_interes),
        q9_material: Number(data.q9_material),
        q10_relevante: Number(data.q10_relevante),
        q11_global: Number(data.q11_global),
        likedText: data.likedText || "",
        improveText: data.improveText || "",
      },
    });

    revalidatePath("/list/evaluations");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating evaluation:", error);
    return { success: false, error: "Error al registrar la evaluación en la base de datos." };
  }
}

export async function createReportCard(data: {
  studentId: string;
  classId: string;
  teacherId: string;
  dateText: string;
  reading: number;
  grammar: number;
  listening: number;
  speaking: number;
  observations: string;
}) {
  try {
    const total = Math.round((Number(data.reading) + Number(data.grammar) + Number(data.listening) + Number(data.speaking)) / 4);

    await prisma.reportCard.create({
      data: {
        studentId: data.studentId,
        classId: data.classId,
        teacherId: data.teacherId,
        dateText: data.dateText,
        reading: Number(data.reading),
        grammar: Number(data.grammar),
        listening: Number(data.listening),
        speaking: Number(data.speaking),
        total,
        observations: data.observations || "",
      },
    });

    revalidatePath("/list/report-cards");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating report card:", error);
    return { success: false, error: "Error al crear el boletín en la base de datos." };
  }
}

export async function updateReportCard(
  id: number,
  data: {
    studentId: string;
    classId: string;
    teacherId: string;
    dateText: string;
    reading: number;
    grammar: number;
    listening: number;
    speaking: number;
    observations: string;
  }
) {
  try {
    const total = Math.round((Number(data.reading) + Number(data.grammar) + Number(data.listening) + Number(data.speaking)) / 4);

    await prisma.reportCard.update({
      where: { id },
      data: {
        studentId: data.studentId,
        classId: data.classId,
        teacherId: data.teacherId,
        dateText: data.dateText,
        reading: Number(data.reading),
        grammar: Number(data.grammar),
        listening: Number(data.listening),
        speaking: Number(data.speaking),
        total,
        observations: data.observations || "",
      },
    });

    revalidatePath("/list/report-cards");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating report card:", error);
    return { success: false, error: "Error al actualizar el boletín en la base de datos." };
  }
}

export async function deleteReportCard(id: number) {
  try {
    await prisma.reportCard.delete({
      where: { id },
    });

    revalidatePath("/list/report-cards");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting report card:", error);
    return { success: false, error: "Error al eliminar el boletín de la base de datos." };
  }
}

export async function createLesson(data: {
  subjectId: number;
  classId: string;
  teacherId: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
}) {
  try {
    await prisma.lesson.create({
      data: {
        subjectId: Number(data.subjectId),
        classId: data.classId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating lesson:", error);
    return { success: false, error: "Error al crear el curso en la base de datos." };
  }
}

export async function updateLesson(
  id: number,
  data: {
    subjectId: number;
    classId: string;
    teacherId: string;
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
  }
) {
  try {
    await prisma.lesson.update({
      where: { id: Number(id) },
      data: {
        subjectId: Number(data.subjectId),
        classId: data.classId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek || null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
      },
    });

    revalidatePath("/list/lessons");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating lesson:", error);
    return { success: false, error: "Error al actualizar el curso en la base de datos." };
  }
}

export async function deleteLesson(id: number | string) {
  try {
    await prisma.lesson.delete({
      where: { id: Number(id) },
    });

    revalidatePath("/list/lessons");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting lesson:", error);
    return { success: false, error: "Error al eliminar el curso de la base de datos." };
  }
}

export async function getClassesList() {
  try {
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return classes;
  } catch (error) {
    console.error("Error fetching classes list:", error);
    return [];
  }
}

export async function getSubjectsList() {
  try {
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return subjects;
  } catch (error) {
    console.error("Error fetching subjects list:", error);
    return [];
  }
}

export async function loginTeacherAction(teacherId: string, accessCode: string) {
  // Basic validation
  if (!teacherId || !accessCode) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }
  
  // Find teacher in database
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId }
  });
  
  if (!teacher) {
    return { success: false, error: "Código de profesor no encontrado o inactivo." };
  }
  
  // Access code validation
  if (accessCode !== "vocali2026" && accessCode !== `vocali${teacherId}`) {
    return { success: false, error: "Código de acceso escolar incorrecto." };
  }
  
  const { setSession } = await import("@/lib/session");
  await setSession("teacher", teacherId);
  return { success: true };
}

export async function saveReportCardEvaluation(data: {
  studentId: string;
  classId: string;
  teacherId: string;
  dateText: string;
  reading: number;
  grammar: number;
  listening: number;
  speaking: number;
  total: number;
  observations: string;
}) {
  try {
    // 1. Find or create the ReportCard
    let reportCard = await prisma.reportCard.findFirst({
      where: {
        studentId: data.studentId,
        classId: data.classId,
        dateText: data.dateText,
      },
    });

    if (reportCard) {
      reportCard = await prisma.reportCard.update({
        where: { id: reportCard.id },
        data: {
          reading: Number(data.reading),
          grammar: Number(data.grammar),
          listening: Number(data.listening),
          speaking: Number(data.speaking),
          total: Number(data.total),
          observations: data.observations,
          teacherId: data.teacherId,
        },
      });
    } else {
      reportCard = await prisma.reportCard.create({
        data: {
          studentId: data.studentId,
          classId: data.classId,
          teacherId: data.teacherId,
          dateText: data.dateText,
          reading: Number(data.reading),
          grammar: Number(data.grammar),
          listening: Number(data.listening),
          speaking: Number(data.speaking),
          total: Number(data.total),
          observations: data.observations,
        },
      });
    }

    // 2. Unify with Exam and Result tables
    // First: find the subject taught by this teacher to this class
    const lesson = await prisma.lesson.findFirst({
      where: {
        classId: data.classId,
        teacherId: data.teacherId,
      },
    });

    let subjectId = lesson?.subjectId;
    if (!subjectId) {
      const teacherObj = await prisma.teacher.findUnique({
        where: { id: data.teacherId },
        include: { subjects: { select: { id: true } } },
      });
      subjectId = teacherObj?.subjects[0]?.id || 1; // Fallback to subject ID 1
    }

    // Second: find or create Exam for today
    const examDate = new Date();
    examDate.setHours(0, 0, 0, 0);

    let exam = await prisma.exam.findFirst({
      where: {
        classId: data.classId,
        subjectId: subjectId,
        teacherId: data.teacherId,
        date: {
          gte: examDate,
          lt: new Date(examDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!exam) {
      exam = await prisma.exam.create({
        data: {
          classId: data.classId,
          subjectId: subjectId,
          teacherId: data.teacherId,
          date: new Date(),
        },
      });
    }

    // Third: upsert Result for this student/exam
    let result = await prisma.result.findFirst({
      where: {
        studentId: data.studentId,
        examId: exam.id,
      },
    });

    if (result) {
      await prisma.result.update({
        where: { id: result.id },
        data: {
          score: Number(data.total),
          date: new Date(),
        },
      });
    } else {
      await prisma.result.create({
        data: {
          studentId: data.studentId,
          examId: exam.id,
          score: Number(data.total),
          classId: data.classId,
          subjectId: subjectId,
          teacherId: data.teacherId,
          date: new Date(),
        },
      });
    }

    revalidatePath("/list/report-cards");
    revalidatePath("/list/results");
    revalidatePath("/list/exams");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving report card evaluation:", error);
    return { success: false, error: "Error al guardar la evaluación en la base de datos." };
  }
}

export async function createAnnouncement(data: {
  title: string;
  description: string;
  classId?: string | null;
  date: Date;
}) {
  try {
    await prisma.announcement.create({
      data: {
        title: data.title,
        description: data.description,
        classId: data.classId || null,
        date: new Date(data.date),
      },
    });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    return { success: false, error: "Error al crear el anuncio en la base de datos." };
  }
}

export async function updateAnnouncement(
  id: number,
  data: {
    title: string;
    description: string;
    classId?: string | null;
    date: Date;
  }
) {
  try {
    await prisma.announcement.update({
      where: { id: Number(id) },
      data: {
        title: data.title,
        description: data.description,
        classId: data.classId || null,
        date: new Date(data.date),
      },
    });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating announcement:", error);
    return { success: false, error: "Error al actualizar el anuncio en la base de datos." };
  }
}

export async function deleteAnnouncement(id: string | number) {
  try {
    await prisma.announcement.delete({
      where: { id: Number(id) },
    });
    revalidatePath("/list/announcements");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: "Error al eliminar el anuncio de la base de datos." };
  }
}

export async function loginGeneralAction(identifier: string, accessCode: string) {
  if (!identifier || !accessCode) {
    return { success: false, error: "Todos los campos son obligatorios." };
  }

  const cleanId = identifier.trim();
  const cleanCode = accessCode.trim();

  try {
    // 1. Admin Auth
    if (cleanId.toLowerCase() === "admin" || cleanId.toLowerCase() === "admin@vocali.edu.mx") {
      if (cleanCode === "vocaliadmin" || cleanCode === "admin2026") {
        const { setSession } = await import("@/lib/session");
        await setSession("admin", null);
        return { success: true, role: "admin" };
      } else {
        return { success: false, error: "Contraseña de administrador incorrecta." };
      }
    }

    // 2. Teacher Auth (ID starts with 'T')
    if (cleanId.toUpperCase().startsWith("T")) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: cleanId }
      });
      if (teacher) {
        if (cleanCode === "vocali2026" || cleanCode === `vocali${cleanId}`) {
          const { setSession } = await import("@/lib/session");
          await setSession("teacher", cleanId);
          return { success: true, role: "teacher" };
        } else {
          return { success: false, error: "Código de acceso incorrecto para profesor." };
        }
      }
    }

    // 3. Student Auth (ID starts with 'S')
    if (cleanId.toUpperCase().startsWith("S")) {
      const student = await prisma.student.findUnique({
        where: { id: cleanId }
      });
      if (student) {
        if (cleanCode === "vocali2026" || cleanCode === `vocali${cleanId}`) {
          const { setSession } = await import("@/lib/session");
          await setSession("student", cleanId);
          return { success: true, role: "student" };
        } else {
          return { success: false, error: "Código de acceso incorrecto para alumno." };
        }
      }
    }

    // 4. Parent Auth (Parent ID starts with 'P' + student ID, e.g. PS001)
    if (cleanId.toUpperCase().startsWith("P")) {
      const studentId = cleanId.toUpperCase().substring(1);
      const student = await prisma.student.findUnique({
        where: { id: studentId }
      });
      if (student) {
        if (cleanCode === "vocali2026" || cleanCode === `vocali${cleanId}`) {
          const { setSession } = await import("@/lib/session");
          await setSession("parent", student.id); // set parent session associated with this student
          return { success: true, role: "parent" };
        } else {
          return { success: false, error: "Código de acceso incorrecto para tutor." };
        }
      }
    }

    return { success: false, error: "Identificador no reconocido (verifica tu código o usuario)." };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Ocurrió un error en el servidor al iniciar sesión." };
  }
}

export async function updateProfileAction(
  role: string,
  id: string | null,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    photo?: string;
  }
) {
  try {
    if (role === "admin") {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const adminPath = path.join(process.cwd(), "adminProfile.json");
        fs.writeFileSync(
          adminPath,
          JSON.stringify(
            {
              name: data.name,
              email: data.email,
              phone: data.phone,
              photo: data.photo,
            },
            null,
            2
          )
        );
      } catch (writeErr) {
        console.warn("Unable to write adminProfile.json (read-only filesystem on Vercel):", writeErr);
      }
      revalidatePath("/profile");
      return { success: true };
    }

    if (role === "teacher" && id) {
      await prisma.teacher.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          photo: data.photo,
        },
      });
      revalidatePath("/profile");
      return { success: true };
    }

    if (role === "student" && id) {
      await prisma.student.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          photo: data.photo,
        },
      });
      revalidatePath("/profile");
      return { success: true };
    }

    if (role === "parent" && id) {
      // Parent updates student info
      await prisma.student.update({
        where: { id },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          photo: data.photo,
        },
      });
      revalidatePath("/profile");
      return { success: true };
    }

    return { success: false, error: "Rol o identificador inválido." };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Error al actualizar los datos en la base de datos." };
  }
}


