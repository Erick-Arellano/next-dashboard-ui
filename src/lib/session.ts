import { cookies } from "next/headers";

export type Session = {
  role: string;
  teacherId: string | null;
};

export async function getSession(): Promise<Session> {
  const cookieStore = cookies();
  const roleVal = cookieStore.get("vocali_role")?.value || "guest";
  const teacherIdVal = cookieStore.get("vocali_teacherId")?.value || null;

  return {
    role: roleVal,
    teacherId: teacherIdVal,
  };
}

export async function setSession(role: string, teacherId: string | null) {
  const cookieStore = cookies();
  
  // Set role cookie
  cookieStore.set("vocali_role", role, {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
  });
  
  // Set teacherId cookie
  if (teacherId) {
    cookieStore.set("vocali_teacherId", teacherId, {
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
  } else {
    cookieStore.delete("vocali_teacherId");
  }
}

export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete("vocali_role");
  cookieStore.delete("vocali_teacherId");
}
