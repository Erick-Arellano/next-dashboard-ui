"use server";

import prisma from "./prisma";
import { revalidatePath } from "next/cache";
import { read, utils } from "xlsx";

// Helper to parse dates in different formats (Excel numbers, strings, dates)
function parseExcelDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel base date is Dec 30, 1899
    return new Date((val - 25569) * 86400 * 1000);
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed === "-") return null;
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return new Date(parsed);

    // Try dd/mm/yyyy
    const parts = trimmed.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  return null;
}

// Helper to find column key based on aliases
function findField(row: any, aliases: string[]): any {
  for (const alias of aliases) {
    // Exact match, case-insensitive, trimmed
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
             alias.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    if (key !== undefined) {
      return row[key];
    }
  }
  return undefined;
}

// 1. Action to parse uploaded Excel file and return metadata + preview rows
export async function parseExcelFileForPreview(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No se subió ningún archivo." };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = read(buffer, { type: "buffer" });

    const sheetsInfo: { name: string; preview: any[]; totalRows: number }[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = utils.sheet_to_json(sheet);
      sheetsInfo.push({
        name: sheetName,
        preview: rows.slice(0, 5),
        totalRows: rows.length,
      });
    }

    return { success: true, sheets: sheetsInfo };
  } catch (error: any) {
    console.error("Error parsing excel for preview:", error);
    return { success: false, error: "Error al leer el archivo Excel: " + error.message };
  }
}

// 2. Action to execute synchronization based on the selected type
export async function syncData(sheetType: "students" | "leads" | "payments", rows: any[]) {
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    if (sheetType === "students") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Row number in Excel for helpful error logs

        // Aliases mapping
        const matricula = findField(row, ["matricula", "id", "id alumno", "alumno id", "student id", "codigo"]);
        const name = findField(row, ["nombre", "nombre completo", "alumno", "estudiante", "name"]);
        const email = findField(row, ["correo", "email", "correo electronico", "correo electrónico", "mail"]);
        const phone = findField(row, ["telefono", "teléfono", "celular", "contacto", "phone"]);
        const address = findField(row, ["direccion", "dirección", "domicilio", "address"]);
        const gradeVal = findField(row, ["nivel", "nivel escolar", "grado", "grade"]);
        const classVal = findField(row, ["grupo", "clase", "aula", "class", "grupo id", "classid"]);

        if (!matricula) {
          errors.push(`Fila ${rowNum}: Falta la matrícula (ID).`);
          continue;
        }
        if (!name) {
          errors.push(`Fila ${rowNum}: Falta el nombre del alumno.`);
          continue;
        }

        const idClean = String(matricula).trim().toUpperCase();
        const nameClean = String(name).trim();
        const emailClean = email ? String(email).trim().toLowerCase() : null;
        const phoneClean = phone ? String(phone).trim() : null;
        const addressClean = address ? String(address).trim() : null;
        const gradeClean = gradeVal ? parseInt(String(gradeVal), 10) : 1;
        const classClean = classVal ? String(classVal).trim().toUpperCase() : null;

        // Verify or create the Group/Class if specified to avoid FK violation
        if (classClean) {
          const classExists = await prisma.class.findUnique({
            where: { id: classClean },
          });
          if (!classExists) {
            await prisma.class.create({
              data: {
                id: classClean,
                name: classClean,
                capacity: 30,
                grade: gradeClean,
              },
            });
          }
        }

        // Upsert student
        const existingStudent = await prisma.student.findUnique({
          where: { id: idClean },
        });

        if (existingStudent) {
          await prisma.student.update({
            where: { id: idClean },
            data: {
              name: nameClean,
              email: emailClean,
              phone: phoneClean,
              address: addressClean,
              grade: gradeClean,
              classId: classClean,
            },
          });
          updated++;
        } else {
          await prisma.student.create({
            data: {
              id: idClean,
              name: nameClean,
              email: emailClean,
              phone: phoneClean,
              address: addressClean,
              grade: gradeClean,
              classId: classClean,
              photo: "/avatar.png",
            },
          });
          created++;
        }
      }
      revalidatePath("/list/students");
      revalidatePath("/admin");
    } 
    
    else if (sheetType === "leads") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const name = findField(row, ["nombre", "nombre completo", "prospecto", "interesado", "name"]);
        const phone = findField(row, ["telefono", "teléfono", "celular", "contacto", "phone"]);
        const language = findField(row, ["idioma", "curso", "idioma de interes", "idioma de interés", "lenguaje", "language"]);
        const level = findField(row, ["nivel", "nivel de interes", "nivel de interés", "level"]);
        const age = findField(row, ["edad", "age"]);
        const contactMethod = findField(row, ["canal", "canal de contacto", "medio", "medio de contacto", "contactmethod"]);
        const leadDateVal = findField(row, ["fecha", "fecha de captacion", "fecha de captación", "leaddate"]);
        const sampleDateVal = findField(row, ["clase muestra", "fecha clase muestra", "fecha de clase muestra", "sampleclassdate"]);
        const statusVal = findField(row, ["estatus", "estado", "status"]);
        const notes = findField(row, ["notas", "comentarios", "razon", "observaciones", "notes"]);

        if (!name) {
          errors.push(`Fila ${rowNum}: Falta el nombre del prospecto.`);
          continue;
        }

        const nameClean = String(name).trim();
        const phoneClean = phone ? String(phone).trim() : null;
        const languageClean = language ? String(language).trim() : null;
        const levelClean = level ? String(level).trim() : null;
        const ageClean = age ? String(age).trim() : null;
        const contactClean = contactMethod ? String(contactMethod).trim() : null;
        const leadDate = parseExcelDate(leadDateVal);
        const sampleDate = parseExcelDate(sampleDateVal);
        const statusClean = statusVal ? String(statusVal).trim().toUpperCase() : "NUEVO";
        const notesClean = notes ? String(notes).trim() : null;

        // Upsert Lead: Match by Name and Phone, or Name if Phone is empty
        let existingLead = null;
        if (phoneClean) {
          existingLead = await prisma.lead.findFirst({
            where: {
              name: nameClean,
              phone: phoneClean,
            },
          });
        } else {
          existingLead = await prisma.lead.findFirst({
            where: {
              name: nameClean,
            },
          });
        }

        if (existingLead) {
          await prisma.lead.update({
            where: { id: existingLead.id },
            data: {
              language: languageClean,
              level: levelClean,
              age: ageClean,
              phone: phoneClean,
              contactMethod: contactClean,
              leadDate: leadDate,
              sampleClassDate: sampleDate,
              status: statusClean,
              notes: notesClean,
            },
          });
          updated++;
        } else {
          await prisma.lead.create({
            data: {
              name: nameClean,
              language: languageClean,
              level: levelClean,
              age: ageClean,
              phone: phoneClean,
              contactMethod: contactClean,
              leadDate: leadDate,
              sampleClassDate: sampleDate,
              status: statusClean,
              notes: notesClean,
            },
          });
          created++;
        }
      }
      revalidatePath("/list/prospects");
    } 
    
    else if (sheetType === "payments") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;

        const studentId = findField(row, ["matricula", "id", "id alumno", "alumno id", "matrícula", "student id"]);
        const amountVal = findField(row, ["monto", "cantidad", "importe", "total", "amount"]);
        const hoursVal = findField(row, ["horas", "horas pagadas", "hours"]);
        const typeVal = findField(row, ["tipo", "tipo de cobro", "tipo de pago", "type"]);
        const statusVal = findField(row, ["estatus", "estado", "status"]);
        const dueDateVal = findField(row, ["proximo pago", "vencimiento", "fecha de vencimiento", "due date", "fecha vencimiento", "duedate"]);
        const payDateVal = findField(row, ["fecha pago", "fecha de pago", "payment date", "paymentdate"]);
        const methodVal = findField(row, ["metodo", "método", "metodo de pago", "método de pago", "method"]);

        if (!studentId) {
          errors.push(`Fila ${rowNum}: Falta la matrícula del alumno.`);
          continue;
        }
        if (!dueDateVal) {
          errors.push(`Fila ${rowNum}: Falta la fecha de vencimiento.`);
          continue;
        }
        if (amountVal === undefined || amountVal === null || isNaN(Number(amountVal))) {
          errors.push(`Fila ${rowNum}: El monto no es un número válido.`);
          continue;
        }

        const studentIdClean = String(studentId).trim().toUpperCase();
        const amountClean = Number(amountVal);
        const hoursClean = hoursVal ? parseInt(String(hoursVal), 10) : 0;
        const typeClean = typeVal ? String(typeVal).trim() : "Mensual";
        const statusClean = statusVal ? String(statusVal).trim() : "Pendiente";
        const dueDate = parseExcelDate(dueDateVal);
        const paymentDate = parseExcelDate(payDateVal);
        const methodClean = methodVal ? String(methodVal).trim() : null;

        if (!dueDate) {
          errors.push(`Fila ${rowNum}: Fecha de vencimiento inválida.`);
          continue;
        }

        // Verify that the student exists in the database before creating a payment
        const studentExists = await prisma.student.findUnique({
          where: { id: studentIdClean },
        });
        if (!studentExists) {
          errors.push(`Fila ${rowNum}: El alumno con matrícula "${studentIdClean}" no existe en la base de datos.`);
          continue;
        }

        // Upsert Payment: Match by studentId and dueDate (representing the billing cycle/item)
        // Make dates cover the entire day to prevent minor time-zone shifts from breaking matches
        const dateStart = new Date(dueDate);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(dueDate);
        dateEnd.setHours(23, 59, 59, 999);

        const existingPayment = await prisma.payment.findFirst({
          where: {
            studentId: studentIdClean,
            dueDate: {
              gte: dateStart,
              lte: dateEnd,
            },
          },
          include: { transaction: true },
        });

        let savedPayment;
        if (existingPayment) {
          savedPayment = await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              amount: amountClean,
              hours: hoursClean,
              type: typeClean,
              status: statusClean,
              paymentDate: paymentDate,
              method: methodClean,
            },
            include: { student: true, transaction: true },
          });
          updated++;
        } else {
          savedPayment = await prisma.payment.create({
            data: {
              studentId: studentIdClean,
              amount: amountClean,
              hours: hoursClean,
              type: typeClean,
              status: statusClean,
              dueDate: dueDate,
              paymentDate: paymentDate,
              method: methodClean,
            },
            include: { student: true },
          });
          created++;
        }

        // Sync to Libro Diario (Transaction)
        if (savedPayment.status === "Pagado") {
          const transDescription = `Cobro liquidado (Excel Sync) - Alumno: ${savedPayment.student?.name || "Desconocido"} (${savedPayment.studentId})`;
          const categoryClean = savedPayment.type === "Inscripción" ? "Inscripción" : "Mensualidad";
          
          if ("transaction" in savedPayment && savedPayment.transaction) {
            await prisma.transaction.update({
              where: { id: (savedPayment as any).transaction.id },
              data: {
                amount: savedPayment.amount,
                category: categoryClean,
                date: savedPayment.paymentDate || new Date(),
                description: transDescription,
              },
            });
          } else {
            await prisma.transaction.create({
              data: {
                amount: savedPayment.amount,
                type: "INCOME",
                category: categoryClean,
                date: savedPayment.paymentDate || new Date(),
                description: transDescription,
                paymentId: savedPayment.id,
              },
            });
          }
        } else {
          // If status changed to Pending/Overdue, delete corresponding Transaction if it exists
          if ("transaction" in savedPayment && (savedPayment as any).transaction) {
            await prisma.transaction.delete({
              where: { id: (savedPayment as any).transaction.id },
            });
          }
        }
      }
      revalidatePath("/list/payments");
      revalidatePath("/list/transactions");
      revalidatePath("/admin");
    }

    return {
      success: true,
      processed: rows.length,
      created,
      updated,
      errors,
    };
  } catch (error: any) {
    console.error("Error during synchronization process:", error);
    return {
      success: false,
      processed: 0,
      created,
      updated,
      error: error.message,
      errors: [...errors, "Error catastrófico: " + error.message],
    };
  }
}
