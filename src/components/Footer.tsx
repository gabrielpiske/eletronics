import React from "react";
import { ExternalLink, FileText } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/70 py-4 px-4 text-center text-xs text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <p className="text-slate-500">
            SENAI — Aprendizagem Industrial de Eletrônico de Manutenção
            Industrial • UC: Técnicas de Manutenção Eletrônica
          </p>
          <a
            href="/intencionalidade-pedagogica.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-sky-400 underline inline-flex items-center gap-1 font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Intencionalidade Pedagógica (HTML/PDF)
          </a>
        </div>

        <p className="font-medium text-slate-300 flex items-center gap-1">
          Desenvolvido por{" "}
          <a
            href="https://piske.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-sky-400 hover:text-amber-300 underline decoration-sky-500/50 hover:decoration-amber-400 transition-colors inline-flex items-center gap-1"
          >
            Gabriel Piske
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </footer>
  );
};
