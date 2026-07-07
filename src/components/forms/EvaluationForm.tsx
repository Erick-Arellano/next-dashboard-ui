"use client";

import { useState, useEffect } from "react";
import { createEvaluation } from "@/lib/actions";
import { useRouter } from "next/navigation";

type ClassItem = {
  id: string;
  name: string;
  supervisor: {
    id: string;
    name: string;
  } | null;
};

type EvaluationFormProps = {
  classes: ClassItem[];
  prefilledClassId?: string;
  prefilledTeacherId?: string;
  isPublic?: boolean;
};

const QUESTIONS = [
  { key: "q1_dinamica", label: "¿Qué tan dinámica y entretenida consideras que fue la clase?", scale: "1 = Muy aburrida - 10 = Muy entretenida" },
  { key: "q2_recursos", label: "¿El profesor utilizó diferentes actividades y recursos (juegos, videos, ejemplos prácticos, etc.)?", scale: "1 = Nada variado - 10 = Muy variado" },
  { key: "q3_claridad", label: "¿La explicación de los temas fue clara y fácil de entender?", scale: "1 = Muy confusa - 10 = Muy clara" },
  { key: "q4_escuchado", label: "¿Qué tan escuchado(a) y tomado(a) en cuenta te sentiste durante la clase?", scale: "1 = Nada escuchado - 10 = Muy escuchado" },
  { key: "q5_participa", label: "¿El profesor fomentó la participación de todos los estudiantes?", scale: "1 = Nada fomentada - 10 = Muy fomentada" },
  { key: "q6_dudas", label: "¿Se resolvieron todas tus dudas de forma clara y completa?", scale: "1 = No se resolvieron - 10 = Se resolvieron completamente" },
  { key: "q7_puntual", label: "¿El profesor llegó puntual y aprovechó bien el tiempo de clase?", scale: "1 = Muy impuntual - 10 = Muy puntual y eficiente" },
  { key: "q8_interes", label: "¿El profesor mostró interés en tu avance y aprendizaje?", scale: "1 = Nada interesado - 10 = Muy interesado" },
  { key: "q9_material", label: "¿El material utilizado (libros, presentaciones, audios, etc.) fue útil para tu aprendizaje?", scale: "1 = Nada útil - 10 = Muy útil" },
  { key: "q10_relevante", label: "¿El contenido de la clase fue relevante para tu nivel e intereses?", scale: "1 = Nada relevante - 10 = Muy relevante" },
  { key: "q11_global", label: "En general, ¿Qué tan satisfecho(a) estás con el profesor? (Calificación global)", scale: "1 = Nada satisfecho - 10 = Muy satisfecho" },
];

export default function EvaluationForm({
  classes,
  prefilledClassId = "",
  prefilledTeacherId = "",
  isPublic = false,
}: EvaluationFormProps) {
  const router = useRouter();

  // State
  const [selectedClassId, setSelectedClassId] = useState(prefilledClassId);
  const [teacherName, setTeacherName] = useState("");
  const [teacherId, setTeacherId] = useState(prefilledTeacherId);
  
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [likedText, setLikedText] = useState("");
  const [improveText, setImproveText] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Update teacher when class changes
  useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find((c) => c.id === selectedClassId);
      if (cls && cls.supervisor) {
        setTeacherName(cls.supervisor.name);
        setTeacherId(cls.supervisor.id);
      } else {
        setTeacherName("Sin profesor asignado");
        setTeacherId("");
      }
    } else {
      setTeacherName("");
      setTeacherId("");
    }
  }, [selectedClassId, classes]);

  // Handle rating selection
  const handleRate = (key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!selectedClassId) {
      setError("Por favor, selecciona un grupo/materia.");
      return;
    }
    if (!teacherId) {
      setError("El grupo seleccionado no tiene un profesor asignado.");
      return;
    }

    // Check if all questions are answered
    const unanswered = QUESTIONS.filter((q) => !ratings[q.key]);
    if (unanswered.length > 0) {
      setError("Por favor responde todas las preguntas del cuestionario.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createEvaluation({
        classId: selectedClassId,
        teacherId: teacherId,
        q1_dinamica: ratings.q1_dinamica,
        q2_recursos: ratings.q2_recursos,
        q3_claridad: ratings.q3_claridad,
        q4_escuchado: ratings.q4_escuchado,
        q5_participa: ratings.q5_participa,
        q6_dudas: ratings.q6_dudas,
        q7_puntual: ratings.q7_puntual,
        q8_interes: ratings.q8_interes,
        q9_material: ratings.q9_material,
        q10_relevante: ratings.q10_relevante,
        q11_global: ratings.q11_global,
        likedText: likedText,
        improveText: improveText,
      });

      if (result.success) {
        setIsSuccess(true);
        if (!isPublic) {
          setTimeout(() => {
            router.push("/student");
            router.refresh();
          }, 3000);
        }
      } else {
        setError(result.error || "Ocurrió un error al enviar tu evaluación.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de red o servidor al enviar la evaluación.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-xl mx-auto text-center flex flex-col items-center gap-5 my-8">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">¡Evaluación Enviada!</h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            Tu opinión es muy importante para nosotros y nos ayuda a mantener la máxima calidad en nuestras clases. Agradecemos enormemente tu tiempo.
          </p>
          {!isPublic && (
            <p className="text-xs text-gray-400 mt-4">Redirigiéndote al panel principal...</p>
          )}
        </div>
        {isPublic && (
          <button
            onClick={() => {
              setRatings({});
              setLikedText("");
              setImproveText("");
              setIsSuccess(false);
            }}
            className="mt-2 bg-vocaliBlue text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-600 transition shadow-sm"
          >
            Enviar otra evaluación
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-150 max-w-3xl mx-auto flex flex-col gap-6 my-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Evaluación de Clase y Profesor</h1>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          Tu opinión es confidencial y muy valiosa. Por favor responde las siguientes preguntas de forma sincera para ayudarnos a mejorar.
        </p>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-4 py-3 rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {/* CONTEXT SELECTORS */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Idioma / Grupo a Evaluar</label>
          {prefilledClassId ? (
            <div className="bg-white border border-gray-200 rounded-lg p-2.5 font-semibold text-gray-700 text-sm shadow-inner">
              {classes.find((c) => c.id === prefilledClassId)?.name || prefilledClassId}
            </div>
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 font-semibold text-gray-700 text-sm outline-none focus:border-vocaliBlue focus:ring-1 focus:ring-vocaliBlue transition shadow-sm"
              required
            >
              <option value="">-- Selecciona tu Grupo --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Profesor Asignado</label>
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 font-semibold text-gray-700 text-sm shadow-inner flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-vocaliBlue"></div>
            {teacherName || "Selecciona un grupo para cargar el profesor"}
          </div>
        </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="flex flex-col gap-6 divide-y divide-gray-100">
        {QUESTIONS.map((q, idx) => (
          <div key={q.key} className={`${idx > 0 ? "pt-6" : ""} flex flex-col gap-3.5`}>
            <div>
              <span className="text-xs font-bold text-vocaliBlue block mb-0.5">PREGUNTA {idx + 1} DE {QUESTIONS.length}</span>
              <label className="text-sm font-bold text-gray-800 block leading-snug">{q.label}</label>
              <span className="text-[11px] text-gray-400 font-medium font-mono">{q.scale}</span>
            </div>

            {/* CIRCULAR RATINGS BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                const isSelected = ratings[q.key] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleRate(q.key, val)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all border ${
                      isSelected
                        ? "bg-vocaliBlue text-white border-vocaliBlue shadow-md scale-110"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-slate-50"
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* TEXT FEEDBACK */}
        <div className="pt-6 flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-gray-800 block leading-snug">¿Qué fue lo que más te gustó de la clase y del profesor?</label>
            <textarea
              value={likedText}
              onChange={(e) => setLikedText(e.target.value)}
              rows={3}
              placeholder="Ej. Su método práctico de conversación, paciencia, recursos interactivos..."
              className="w-full mt-2 bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 outline-none focus:border-vocaliBlue focus:ring-1 focus:ring-vocaliBlue transition shadow-sm resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-800 block leading-snug">¿Qué crees que podría mejorar el profesor para hacer la clase más efectiva?</label>
            <textarea
              value={improveText}
              onChange={(e) => setImproveText(e.target.value)}
              rows={3}
              placeholder="Ej. Dejar más tiempo para hablar, ir más despacio en la gramática, etc..."
              className="w-full mt-2 bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 outline-none focus:border-vocaliBlue focus:ring-1 focus:ring-vocaliBlue transition shadow-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-vocaliBlue hover:bg-blue-600 text-white font-bold py-3.5 rounded-lg text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enviando Respuestas...
          </>
        ) : (
          "Enviar Cuestionario (Evaluación Anónima)"
        )}
      </button>
    </form>
  );
}
