import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No se proporcionó ningún archivo." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate unique name
    const ext = path.extname(file.name || "image.png");
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure upload folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);
    
    return NextResponse.json({
      success: true,
      url: `/uploads/${uniqueFilename}`,
    });
  } catch (error: any) {
    console.error("Error en la carga de archivos:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la carga de archivo." },
      { status: 500 }
    );
  }
}
