import { PrismaClient } from "../src/generated/client/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Comenzando la siembra contable y real de base de datos...");

  // 1. Limpieza de datos existentes
  await prisma.transaction.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.reportCard.deleteMany();
  await prisma.result.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.teacherPayment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();

  console.log("Limpieza de base de datos completada.");

  // Helper to load JSON files
  const loadJSON = (filename: string) => {
    const raw = fs.readFileSync(path.join(__dirname, "../migration-data", filename), "utf-8");
    return JSON.parse(raw);
  };

  const subjects = loadJSON("subjects.json");
  const teachers = loadJSON("teachers.json");
  const groups = loadJSON("groups.json");
  const students = loadJSON("students.json");
  const payments = loadJSON("payments.json");
  const leads = loadJSON("leads.json");

  // 2. Sembrar Cursos/Idiomas (Subject)
  for (const s of subjects) {
    await prisma.subject.create({
      data: {
        id: s.id,
        name: s.name,
      },
    });
  }
  console.log(`Sembrados ${subjects.length} cursos/idiomas.`);

  // 3. Sembrar Profesores (Teacher)
  // We link every teacher to their native subject if we can match it
  for (const t of teachers) {
    // Determine default subject
    let subjectConnect = {};
    if (t.name === "ADELA") {
      subjectConnect = { connect: [{ name: "Inglés" }, { name: "Chino" }] };
    } else {
      // link to a default subject
      subjectConnect = { connect: [{ name: "Inglés" }] };
    }

    await prisma.teacher.create({
      data: {
        id: t.id,
        name: t.name,
        email: `${t.name.toLowerCase().replace(" ", "")}@vocali.com`,
        phone: "2221112233",
        address: "Calle 25 Norte, San Matías, Pue.",
        photo: "/avatar.png",
        subjects: subjectConnect,
      },
    });
  }
  console.log(`Sembrados ${teachers.length} profesores.`);

  // 4. Sembrar Grupos (Class)
  const groupIds = new Set<string>();
  for (const g of groups) {
    groupIds.add(g.id);
    await prisma.class.create({
      data: {
        id: g.id,
        name: g.name,
        capacity: g.capacity,
        minCapacity: 3,
        maxCapacity: 8,
        grade: g.grade,
        supervisorId: g.supervisorId,
      },
    });
  }
  console.log(`Sembrados ${groups.length} grupos.`);

  // 5. Sembrar Alumnos (Student)
  const studentIds = new Set<string>();
  for (const s of students) {
    studentIds.add(s.id);
    const hasValidClass = groupIds.has(s.classId);
    await prisma.student.create({
      data: {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: s.address,
        grade: s.grade,
        classId: hasValidClass ? s.classId : null,
      },
    });
  }
  console.log(`Sembrados ${students.length} alumnos.`);

  // 6. Sembrar Cobros (Payment)
  let paymentCount = 0;
  for (const p of payments) {
    if (studentIds.has(p.studentId)) {
      paymentCount++;
      await prisma.payment.create({
        data: {
          studentId: p.studentId,
          amount: p.amount,
          hours: p.hours,
          type: p.type,
          status: p.status,
          dueDate: new Date(p.dueDate),
          paymentDate: p.paymentDate ? new Date(p.paymentDate) : null,
          method: p.method,
        },
      });
    }
  }
  console.log(`Sembrados ${paymentCount} cobros/mensualidades.`);

  // 7. Sembrar Prospectos (Lead)
  for (const l of leads) {
    await prisma.lead.create({
      data: {
        matricula: l.matricula,
        name: l.name,
        language: l.language,
        level: l.level,
        age: l.age,
        phone: l.phone,
        contactMethod: l.contactMethod,
        leadDate: l.leadDate ? new Date(l.leadDate) : null,
        sampleClassDate: l.sampleClassDate ? new Date(l.sampleClassDate) : null,
        status: l.status,
        notes: l.notes,
      },
    });
  }
  console.log(`Sembrados ${leads.length} prospectos/leads.`);

  // 8. Sembrar Egresos/Nómina Ficticia Base
  // Seeding some dummy teacher payments to make the financial ledger interesting
  const dbTeachers = await prisma.teacher.findMany();
  for (const t of dbTeachers) {
    await prisma.teacherPayment.create({
      data: {
        teacherId: t.id,
        amount: 3200.0,
        type: "Pago por Horas",
        hours: 16,
        status: "Pagado",
        paymentDate: new Date(),
        method: "Transferencia",
      },
    });
  }
  console.log("Egresos ficticios base creados para profesores.");

  // 9. Sembrar Lecciones y Anuncios de prueba
  const dbSubjects = await prisma.subject.findMany();
  const dbClasses = await prisma.class.findMany();
  
  if (dbSubjects.length > 0 && dbTeachers.length > 0 && dbClasses.length > 0) {
    // Create lessons with schedules
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const timeSlots = [
      { start: "08:00", end: "08:45" },
      { start: "09:00", end: "09:45" },
      { start: "10:00", end: "10:45" },
      { start: "11:00", end: "11:45" },
      { start: "14:00", end: "14:45" },
      { start: "15:00", end: "15:45" },
      { start: "16:00", end: "16:45" },
    ];

    let lessonIndex = 0;
    for (const tea of dbTeachers) {
      const teaWithSubjects = await prisma.teacher.findUnique({
        where: { id: tea.id },
        include: { subjects: true }
      });
      const subj = teaWithSubjects?.subjects[0] || dbSubjects[0];
      
      for (let j = 0; j < 5; j++) {
        const cls = dbClasses[(lessonIndex + j) % dbClasses.length];
        const day = days[(lessonIndex + j) % days.length];
        const slot = timeSlots[j % timeSlots.length];
        
        await prisma.lesson.create({
          data: {
            subjectId: subj.id,
            classId: cls.id,
            teacherId: tea.id,
            dayOfWeek: day,
            startTime: slot.start,
            endTime: slot.end,
          },
        });
      }
      lessonIndex += 5;
    }
    console.log("Lecciones programadas creadas.");
    
    // Create announcements
    await prisma.announcement.create({
      data: {
        title: "Inicio del ciclo de inscripciones de verano",
        date: new Date(),
      },
    });
    await prisma.announcement.create({
      data: {
        title: "Taller grupal de conversación sabatino",
        date: new Date(),
      },
    });

    // Create Events (Relative dates)
    const today = new Date();
    const addDays = (date: Date, daysCount: number) => {
      const result = new Date(date);
      result.setDate(result.getDate() + daysCount);
      return result;
    };

    await prisma.event.create({
      data: {
        title: "Club de Conversación de Inglés",
        date: addDays(today, 1), // Mañana
        startTime: "16:00",
        endTime: "17:00",
      }
    });

    await prisma.event.create({
      data: {
        title: "Taller de Cultura Francesa",
        date: addDays(today, 3), // En 3 días
        startTime: "15:00",
        endTime: "16:30",
      }
    });

    await prisma.event.create({
      data: {
        title: "Junta General de Profesores",
        date: addDays(today, 5), // En 5 días
        startTime: "12:00",
        endTime: "13:00",
      }
    });

    // Create Exams (Relative dates)
    const firstClass = dbClasses[0];
    const firstSubject = dbSubjects[0];
    const firstTeacher = dbTeachers[0];

    if (firstClass && firstSubject && firstTeacher) {
      await prisma.exam.create({
        data: {
          subjectId: firstSubject.id,
          classId: firstClass.id,
          teacherId: firstTeacher.id,
          date: addDays(today, 2), // En 2 días
        }
      });
      console.log("Exámenes de prueba creados.");
    }
  }
  console.log("Lecciones, anuncios, eventos y exámenes base sembrados.");

  // 10. Ingesta de Transacciones Históricas (Libro Diario)
  console.log("Comenzando siembra del Libro Diario (Transacciones)...");
  
  // Obtener cobros pagados
  const paidPayments = await prisma.payment.findMany({
    where: { status: "Pagado" },
    include: { student: true }
  });
  
  for (const pay of paidPayments) {
    await prisma.transaction.create({
      data: {
        amount: pay.amount,
        type: "INCOME",
        category: pay.type === "Inscripción" ? "Inscripción" : "Mensualidad",
        date: pay.paymentDate || pay.dueDate, // Usar fecha de pago si existe, si no, fecha de vencimiento
        description: `Cobro liquidado - Alumno: ${pay.student?.name || "Desconocido"} (${pay.studentId})`,
        paymentId: pay.id,
      }
    });
  }
  
  // Obtener pagos a profesores pagados
  const paidTeacherPayments = await prisma.teacherPayment.findMany({
    where: { status: "Pagado" },
    include: { teacher: true }
  });
  
  for (const tpay of paidTeacherPayments) {
    await prisma.transaction.create({
      data: {
        amount: tpay.amount,
        type: "EXPENSE",
        category: "Nómina",
        date: tpay.paymentDate || new Date(),
        description: `Pago de Nómina - Profesor: ${tpay.teacher?.name || "Desconocido"} (${tpay.teacherId})`,
        teacherPaymentId: tpay.id,
      }
    });
  }

  // Seeding recurring expenses for 2025 and 2026 to enrich the financial chart
  console.log("Sembrando gastos mensuales recurrentes de prueba (Servicios, Materiales, Publicidad)...");
  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(2025, 0, 15);
    d.setMonth(d.getMonth() + i);
    return d;
  });

  let extraExpenseCount = 0;
  for (const date of months) {
    // Rent & Utilities expense
    await prisma.transaction.create({
      data: {
        amount: 2500.0,
        type: "EXPENSE",
        category: "Servicios",
        date: date,
        description: `Pago mensual de renta y servicios básicos (Internet, Luz, Agua)`,
      }
    });
    extraExpenseCount++;

    // Materials/Teaching equipment expense (every 2 months)
    if (date.getMonth() % 2 === 0) {
      await prisma.transaction.create({
        data: {
          amount: 1100.0,
          type: "EXPENSE",
          category: "Materiales",
          date: date,
          description: `Compra de papelería, copias y material didáctico`,
        }
      });
      extraExpenseCount++;
    }

    // Marketing/Advertising expense (Enero, Mayo, Agosto, Septiembre)
    if ([0, 4, 7, 8].includes(date.getMonth())) {
      await prisma.transaction.create({
        data: {
          amount: 1500.0,
          type: "EXPENSE",
          category: "Publicidad",
          date: date,
          description: `Campañas de marketing digital e inscripciones de ciclo`,
        }
      });
      extraExpenseCount++;
    }
  }

  console.log(`Sembradas ${paidPayments.length + paidTeacherPayments.length} transacciones directas + ${extraExpenseCount} gastos recurrentes en el Libro Diario.`);

  // 9. Sembrar Evaluaciones (Evaluation)
  const allClasses = await prisma.class.findMany();
  const allTeachers = await prisma.teacher.findMany();

  if (allClasses.length > 0 && allTeachers.length > 0) {
    let evalCount = 0;
    const likedOpinions = [
      "Me encanta la paciencia que tiene para explicar los conceptos complejos.",
      "Las clases son muy dinámicas y divertidas. Se me pasa el tiempo volando.",
      "Utiliza excelentes ejemplos prácticos de la vida diaria.",
      "Es muy puntual y siempre muestra interés en nuestro progreso.",
      "El material adicional que comparte es muy útil para estudiar en casa.",
    ];
    const improveOpinions = [
      "Me gustaría que habláramos un poco más de tiempo en clase.",
      "A veces va un poco rápido al explicar temas gramaticales avanzados.",
      "Sería genial tener más ejercicios escritos de tarea.",
      "Nada, es un excelente profesor y explica de manera fantástica.",
      "Tal vez incorporar más videos y material auditivo en las sesiones.",
    ];

    for (let i = 0; i < 20; i++) {
      const cls = allClasses[i % allClasses.length];
      const lesson = await prisma.lesson.findFirst({
        where: { classId: cls.id }
      });
      const teacherId = lesson ? lesson.teacherId : allTeachers[i % allTeachers.length].id;

      await prisma.evaluation.create({
        data: {
          classId: cls.id,
          teacherId: teacherId,
          q1_dinamica: 7 + (i % 4),
          q2_recursos: 8 - (i % 3),
          q3_claridad: 8 + (i % 3),
          q4_escuchado: 9 - (i % 2),
          q5_participa: 7 + (i % 4),
          q6_dudas: 8 + (i % 3),
          q7_puntual: 9 + (i % 2),
          q8_interes: 8 + (i % 3),
          q9_material: 7 + (i % 4),
          q10_relevante: 9 - (i % 3),
          q11_global: 8 + (i % 3),
          likedText: likedOpinions[i % likedOpinions.length],
          improveText: improveOpinions[i % improveOpinions.length],
          date: new Date(Date.now() - (20 - i) * 24 * 60 * 60 * 1000),
        }
      });
      evalCount++;
    }
    console.log(`Sembradas ${evalCount} evaluaciones de prueba.`);
  }

  // 10. Sembrar Boletines (ReportCard)
  const dbStudents = await prisma.student.findMany({
    include: {
      class: {
        include: {
          supervisor: true
        }
      }
    }
  });

  const studentsWithClassesAndSupervisors = dbStudents.filter(s => s.class && s.class.supervisor);

  if (studentsWithClassesAndSupervisors.length > 0) {
    let reportCardCount = 0;
    const comments = [
      "Alondra es una alumna muy aplicada, con excelente actitud y muy buena retención de los contenidos vistos durante el curso. Demuestra seguridad en la mayoría de las estructuras del nivel A1. En la evaluación, sus únicos errores se presentaron en el uso de los auxiliares do y does dentro del Present Simple, por lo que se recomienda un repaso puntual de este tema para reforzar la formación de preguntas.",
      "Demuestra gran fluidez al hablar y excelente comprensión auditiva. Se recomienda practicar la redacción de textos largos y repasar tiempos verbales del pasado (Past Simple vs Present Perfect) para perfeccionar su precisión escrita.",
      "Excelente desempeño y compromiso en todas las clases. Su pronunciación es muy natural. Puede continuar enriqueciendo su vocabulario en temas profesionales mediante lecturas y audios adicionales.",
      "Muestra buena disposición y participación. Su gramática y lectura son fuertes, pero se beneficiaría de mayor práctica conversacional interactiva para ganar fluidez y vencer la timidez al hablar."
    ];

    for (let i = 0; i < Math.min(5, studentsWithClassesAndSupervisors.length); i++) {
      const student = studentsWithClassesAndSupervisors[i];
      const classId = student.classId!;
      const teacherId = student.class!.supervisorId!;
      
      const reading = 85 + (i * 3) % 15;
      const grammar = 80 + (i * 4) % 20;
      const listening = 90 - (i * 2) % 10;
      const speaking = 85 + (i * 3) % 15;
      const total = Math.round((reading + grammar + listening + speaking) / 4);

      await prisma.reportCard.create({
        data: {
          studentId: student.id,
          classId: classId,
          teacherId: teacherId,
          dateText: "Dic 2025",
          reading,
          grammar,
          listening,
          speaking,
          total,
          observations: comments[i % comments.length],
        }
      });
      reportCardCount++;
    }
    console.log(`Sembrados ${reportCardCount} boletines de calificaciones.`);
  }

  console.log("¡Base de datos sembrada con datos reales con éxito!");
}

main()
  .catch((e) => {
    console.error("Error sembrando la base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
