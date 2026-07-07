import prisma from "@/lib/prisma";
import EvaluationForm from "@/components/forms/EvaluationForm";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function PublicEvaluationPage({
  searchParams,
}: {
  searchParams: { classId?: string; teacherId?: string };
}) {
  const classId = searchParams.classId || "";
  const teacherId = searchParams.teacherId || "";

  // Load all classes with supervisor teachers
  const classes = await prisma.class.findMany({
    include: {
      supervisor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA] py-8 px-4 flex flex-col gap-6 items-center justify-center">
      {/* LOGO */}
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="logo" width={40} height={40} />
        <span className="font-bold text-xl text-gray-800 tracking-tight">Vocali</span>
      </div>

      <div className="w-full max-w-3xl">
        <EvaluationForm
          classes={classes}
          prefilledClassId={classId}
          prefilledTeacherId={teacherId}
          isPublic={true}
        />
      </div>
    </div>
  );
}
