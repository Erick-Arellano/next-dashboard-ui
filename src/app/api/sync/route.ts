import { NextResponse } from "next/server";
import { read, utils } from "xlsx";
import { syncData } from "@/lib/syncActions";

export async function POST(req: Request) {
  try {
    const { fileBase64, sheetName, importType } = await req.json();
    
    if (!fileBase64 || !sheetName || !importType) {
      return NextResponse.json(
        { success: false, error: "Parámetros incompletos en la solicitud de sincronización." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const workbook = read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[sheetName];
    
    if (!sheet) {
      return NextResponse.json(
        { success: false, error: `La hoja "${sheetName}" no existe en el archivo.` },
        { status: 400 }
      );
    }

    const rows = utils.sheet_to_json(sheet);
    
    // Call the dynamic synchronization Server Action
    const result = await syncData(importType, rows);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in sync API endpoint:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Fallo catastrófico en la sincronización: " + error.message,
        errors: [error.message] 
      },
      { status: 500 }
    );
  }
}
