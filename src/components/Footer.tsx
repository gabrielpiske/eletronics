import React from "react";
import { ExternalLink } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/70 py-4 px-4 text-center text-xs text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-slate-500">
          SENAI — Aprendizagem Industrial de Eletrônico de Manutenção Industrial
          • UC: Técnicas de Manutenção Eletrônica
        </p>
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
