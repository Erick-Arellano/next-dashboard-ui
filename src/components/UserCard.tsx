import Image from "next/image";

const labels: { [key: string]: string } = {
  student: "Alumnos",
  teacher: "Profesores",
  parent: "Tutores",
  staff: "Personal",
};

const cardStyles: { [key: string]: { bg: string; text: string; tagBg: string } } = {
  student: {
    bg: "bg-gradient-to-br from-[#1872D9] to-[#5CA4F5] shadow-md shadow-blue-100",
    text: "text-white",
    tagBg: "bg-white/20 text-white",
  },
  teacher: {
    bg: "bg-gradient-to-br from-[#F47A20] to-[#FFA266] shadow-md shadow-orange-100",
    text: "text-white",
    tagBg: "bg-white/20 text-white",
  },
  parent: {
    bg: "bg-gradient-to-br from-[#10B981] to-[#46E2A5] shadow-md shadow-emerald-100",
    text: "text-white",
    tagBg: "bg-white/20 text-white",
  },
  staff: {
    bg: "bg-gradient-to-br from-[#8B5CF6] to-[#B18CFF] shadow-md shadow-purple-100",
    text: "text-white",
    tagBg: "bg-white/20 text-white",
  },
};

const UserCard = ({ type, count }: { type: string; count?: number }) => {
  const style = cardStyles[type] || {
    bg: "bg-white border border-gray-100 shadow-sm",
    text: "text-gray-800",
    tagBg: "bg-gray-100 text-gray-600",
  };

  const displayCount = count !== undefined ? count.toLocaleString() : "1,234";

  return (
    <div className={`rounded-2xl p-4 flex-1 min-w-[130px] transition-all duration-300 hover:scale-[1.03] hover:shadow-lg ${style.bg}`}>
      <div className="flex justify-between items-center">
        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${style.tagBg}`}>
          2026/27
        </span>
        <Image src="/more.png" alt="" width={20} height={20} className="opacity-90 brightness-200" />
      </div>
      <h1 className={`text-2xl font-bold my-4 ${style.text}`}>{displayCount}</h1>
      <h2 className={`capitalize text-xs font-semibold ${style.text} opacity-90`}>{labels[type] || type}</h2>
    </div>
  );
};

export default UserCard;
