"use client";

import { useState } from "react";

type CopyMagicLinkButtonProps = {
  teacherId: string;
};

export default function CopyMagicLinkButton({ teacherId }: CopyMagicLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const origin = window.location.origin;
    const url = `${origin}/api/auth/magic-link?teacherId=${teacherId}&authCode=vocali${teacherId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 shadow-sm border cursor-pointer ${
        copied 
          ? "bg-green-50 border-green-200 text-green-600" 
          : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-500 hover:text-white"
      }`}
      title={copied ? "¡Enlace de acceso copiado!" : "Copiar enlace de acceso directo (Magic Link para WhatsApp)"}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
        </svg>
      )}
    </button>
  );
}
