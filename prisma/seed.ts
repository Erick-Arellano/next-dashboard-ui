import { PrismaClient } from "../src/generated/client/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import {
  teachersData,
  studentsData,
  subjectsData,
  classesData,
  lessonsData,
  examsData,
  assignmentsData,
  resultsData,
  eventsData,
  announcementsData,
  paymentsData,
  teacherPaymentsData,
} from "../src/lib/data";

const dbPath = path.join(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`,
});
const prisma = new PrismaClient({ adapter });

const SUBJECT_MAP: Record<string, string> = {
  "Geometry": "Español",
  "Spanish": "Español",
  "Math": "Español",
  "Science": "Inglés",
  "History": "Francés",
  "Physics": "Chino",
  "Chemistry": "Alemán",
  "Biology": "Inglés",
  "Geography": "Español",
  "Literature": "Español",
  "Art": "Español"
};

const VALID_SUBJECTS = ["Español", "Inglés", "Chino", "Francés", "Alemán"];

function getValidSubject(name: string): string {
  if (VALID_SUBJECTS.includes(name)) return name;
  return SUBJECT_MAP[name] || "Inglés";
}

async function main() {
  console.log("Comenzando la siembra de base de datos...");

  // 1. Clean existing data in reverse order of dependencies
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

  // 2. Seed Subjects
  const uniqueSubjectNames = new Set<string>();
  for (const s of subjectsData) {
    const validName = getValidSubject(s.name);
    if (!uniqueSubjectNames.has(validName)) {
      uniqueSubjectNames.add(validName);
      await prisma.subject.create({
        data: {
          name: validName,
        },
      });
    }
  }
  console.log("Cursos sembrados.");

  // 3. Seed Teachers
  for (const t of teachersData) {
    const validTeacherSubjects = Array.from(new Set(t.subjects.map(getValidSubject)));
    await prisma.teacher.create({
      data: {
        id: t.teacherId,
        name: t.name,
        email: t.email,
        phone: t.phone,
        address: t.address,
        photo: t.photo,
        subjects: {
          connect: validTeacherSubjects.map((sName) => ({ name: sName })),
        },
      },
    });
  }
  console.log("Profesores sembrados.");

  // 4. Seed Classes (Grupos)
  for (const c of classesData) {
    const supervisorTeacher = teachersData.find((t) => t.name === c.supervisor);
    await prisma.class.create({
      data: {
        id: c.name,
        name: c.name,
        capacity: c.capacity,
        grade: c.grade,
        supervisorId: supervisorTeacher ? supervisorTeacher.teacherId : null,
      },
    });
  }
  console.log("Grupos sembrados.");

  // 5. Seed Students
  for (const s of studentsData) {
    const classExists = classesData.some((c) => c.name === s.class);
    await prisma.student.create({
      data: {
        id: s.studentId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        address: s.address,
        grade: s.grade,
        classId: classExists ? s.class : null,
      },
    });
  }
  console.log("Alumnos sembrados.");

  // 6. Seed Payments
  for (const p of paymentsData) {
    const student = studentsData.find((s) => s.name === p.student);
    if (student) {
      await prisma.payment.create({
        data: {
          studentId: student.studentId,
          amount: p.amount,
          type: p.type,
          status: p.status,
          dueDate: new Date(p.dueDate),
          paymentDate: p.paymentDate ? new Date(p.paymentDate) : null,
          method: p.method || null,
        },
      });
    }
  }
  console.log("Cobros sembrados.");

  // 7. Seed Teacher Payments
  for (const tp of teacherPaymentsData) {
    const teacher = teachersData.find((t) => t.name === tp.teacher);
    if (teacher) {
      await prisma.teacherPayment.create({
        data: {
          teacherId: teacher.teacherId,
          amount: tp.amount,
          type: tp.type,
          hours: tp.hours,
          status: tp.status,
          paymentDate: tp.paymentDate ? new Date(tp.paymentDate) : null,
          method: tp.method || null,
        },
      });
    }
  }
  console.log("Pagos a profesores sembrados.");

  // 8. Seed Lessons
  for (const l of lessonsData) {
    const validSubj = getValidSubject(l.subject);
    const subject = await prisma.subject.findUnique({ where: { name: validSubj } });
    const teacher = teachersData.find((t) => t.name === l.teacher);
    const classExists = classesData.some((c) => c.name === l.class);
    if (subject && teacher && classExists) {
      await prisma.lesson.create({
        data: {
          subjectId: subject.id,
          classId: l.class,
          teacherId: teacher.teacherId,
        },
      });
    }
  }
  console.log("Lecciones sembradas.");

  // 9. Seed Exams
  for (const e of examsData) {
    const validSubj = getValidSubject(e.subject);
    const subject = await prisma.subject.findUnique({ where: { name: validSubj } });
    const teacher = teachersData.find((t) => t.name === e.teacher);
    const classExists = classesData.some((c) => c.name === e.class);
    if (subject && teacher && classExists) {
      await prisma.exam.create({
        data: {
          subjectId: subject.id,
          classId: e.class,
          teacherId: teacher.teacherId,
          date: new Date(e.date),
        },
      });
    }
  }
  console.log("Evaluaciones sembradas.");

  // 10. Seed Assignments
  for (const a of assignmentsData) {
    const validSubj = getValidSubject(a.subject);
    const subject = await prisma.subject.findUnique({ where: { name: validSubj } });
    const teacher = teachersData.find((t) => t.name === a.teacher);
    const classExists = classesData.some((c) => c.name === a.class);
    if (subject && teacher && classExists) {
      await prisma.assignment.create({
        data: {
          subjectId: subject.id,
          classId: a.class,
          teacherId: teacher.teacherId,
          dueDate: new Date(a.dueDate),
        },
      });
    }
  }
  console.log("Tareas sembradas.");

  // 11. Seed Results
  for (const r of resultsData) {
    const validSubj = getValidSubject(r.subject);
    const subject = await prisma.subject.findUnique({ where: { name: validSubj } });
    const student = studentsData.find((s) => s.name === r.student);
    const teacher = teachersData.find((t) => t.name === r.teacher);
    const classExists = classesData.some((c) => c.name === r.class);
    if (subject && student && teacher && classExists) {
      await prisma.result.create({
        data: {
          subjectId: subject.id,
          studentId: student.studentId,
          score: r.score,
          teacherId: teacher.teacherId,
          classId: r.class,
          date: new Date(r.date),
        },
      });
    }
  }
  console.log("Calificaciones sembradas.");

  // 12. Seed Events
  for (const ev of eventsData) {
    const classExists = classesData.some((c) => c.name === ev.class);
    await prisma.event.create({
      data: {
        title: ev.title,
        classId: classExists ? ev.class : null,
        date: new Date(ev.date),
        startTime: ev.startTime,
        endTime: ev.endTime,
      },
    });
  }
  console.log("Eventos sembrados.");

  // 13. Seed Announcements
  for (const an of announcementsData) {
    const classExists = classesData.some((c) => c.name === an.class);
    await prisma.announcement.create({
      data: {
        title: an.title,
        classId: classExists ? an.class : null,
        date: new Date(an.date),
      },
    });
  }
  console.log("Anuncios sembrados.");

  console.log("¡Base de datos sembrada con éxito!");
}

main()
  .catch((e) => {
    console.error("Error sembrando la base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
