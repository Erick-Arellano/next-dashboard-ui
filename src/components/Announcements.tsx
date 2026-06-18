const Announcements = () => {
  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Anuncios</h1>
        <span className="text-xs text-gray-400">Ver todo</span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <div className="bg-lamaSkyLight rounded-md p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Horarios del Ciclo 2026</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md px-2 py-1 shadow-sm font-medium">
              18/06/2026
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Ya están disponibles los nuevos horarios para los cursos grupales e intensivos de Francés y Chino.
          </p>
        </div>
        <div className="bg-lamaPurpleLight rounded-md p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Certificaciones Cambridge</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md px-2 py-1 shadow-sm font-medium">
              15/06/2026
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Las inscripciones para la ronda de exámenes de certificación FCE y CAE cierran este fin de mes.
          </p>
        </div>
        <div className="bg-lamaYellowLight rounded-md p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Descuento de Apertura</h2>
            <span className="text-xs text-gray-400 bg-white rounded-md px-2 py-1 shadow-sm font-medium">
              12/06/2026
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Aprovecha un 15% de descuento en la matrícula de inscripción temprana para el nuevo curso de Alemán.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
