import Announcements from "@/components/Announcements";
import AttendanceChart from "@/components/AttendanceChart";
import CountChart from "@/components/CountChart";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import PaymentAlerts from "@/components/PaymentAlerts";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AdminPage = async () => {
  const [
    studentCount,
    teacherCount,
    subjectCount,
    paymentCount,
    paymentStatusGroup,
    leadStatusGroup,
    transactions,
    announcements,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.subject.count(),
    prisma.payment.count(),
    prisma.payment.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.transaction.findMany({
      orderBy: {
        date: "desc",
      },
    }),
    prisma.announcement.findMany({
      take: 3,
      orderBy: { date: "desc" },
    }),
  ]);

  // Extract payment status counts
  const paymentsByStatus = {
    pagado: paymentStatusGroup.find((p) => p.status === "Pagado")?._count._all || 0,
    pendiente: paymentStatusGroup.find((p) => p.status === "Pendiente")?._count._all || 0,
    atrasado: paymentStatusGroup.find((p) => p.status === "Atrasado")?._count._all || 0,
  };

  // Extract lead status counts
  const leadsByStatus = {
    nuevo: leadStatusGroup.find((l) => l.status === "NUEVO")?._count._all || 0,
    contactado: leadStatusGroup.find((l) => l.status === "CONTACTADO")?._count._all || 0,
    claseMuestra: leadStatusGroup.find((l) => l.status === "CLASE_MUESTRA")?._count._all || 0,
    listaEspera: leadStatusGroup.find((l) => l.status === "LISTA_ESPERA")?._count._all || 0,
    inscrito: leadStatusGroup.find((l) => l.status === "INSCRITO")?._count._all || 0,
    noInteresado: leadStatusGroup.find((l) => l.status === "NO_INTERESADO")?._count._all || 0,
  };

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <UserCard type="student" count={studentCount} />
          <UserCard type="teacher" count={teacherCount} />
          <UserCard type="subject" count={subjectCount} />
          <UserCard type="payment" count={paymentCount} />
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChart
              pagado={paymentsByStatus.pagado}
              pendiente={paymentsByStatus.pendiente}
              atrasado={paymentsByStatus.atrasado}
            />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart
              nuevo={leadsByStatus.nuevo}
              contactado={leadsByStatus.contactado}
              claseMuestra={leadsByStatus.claseMuestra}
              listaEspera={leadsByStatus.listaEspera}
              inscrito={leadsByStatus.inscrito}
              noInteresado={leadsByStatus.noInteresado}
            />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[500px]">
          <FinanceChart transactions={transactions} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-8">
        <PaymentAlerts />
        <Announcements data={announcements as any} />
      </div>
    </div>
  );
};

export default AdminPage;
