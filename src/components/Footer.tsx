import React from "react";
import { ExternalLink, FileText } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#242933] bg-[#0E1014] py-3.5 px-4 text-xs text-zinc-400">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="font-mono text-[11px] text-zinc-500">
            SENAI • Técnicas de Manutenção Eletrônica
          </span>
          <span className="text-zinc-700 hidden sm:inline">|</span>
          <a
            href="/intencionalidade-pedagogica.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-amber-400 inline-flex items-center gap-1 font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Documento Pedagógico
          </a>
        </div>

        <p className="text-zinc-400 flex items-center gap-1">
          Por{" "}
          <a
            href="https://piske.online/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-zinc-200 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
          >
            Gabriel Piske
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>
    </footer>
  );
};
