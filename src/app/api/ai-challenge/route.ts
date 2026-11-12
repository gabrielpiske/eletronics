import { NextRequest, NextResponse } from "next/server";
import { ELECTRONIC_COMPONENTS } from "@/data/electronicsData";
import {
  generateProceduralDetectiveCase,
  generateProceduralResistorOrder,
} from "@/lib/challengeGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type || "detective";
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Se houver chave da API Gemini configurada no ambiente, gera pistas técnicas inéditas via IA
    if (apiKey && type === "detective") {
      const randomTarget =
        ELECTRONIC_COMPONENTS[
          Math.floor(Math.random() * ELECTRONIC_COMPONENTS.length)
        ];

      const prompt = `Você é um professor de Eletrônica Industrial do SENAI. Gere 3 pistas técnicas curtas, progressivas e inéditas em português sobre o componente "${randomTarget.name}" (Designador: ${randomTarget.boardLetter}, Função: ${randomTarget.basicFunction}) SEM citar o nome explícito do componente nas 2 primeiras pistas. Responda APENAS em JSON válido no formato: {"clues": ["pista 1", "pista 2", "pista 3"]}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.85,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.clues) && parsed.clues.length >= 3) {
            const baseCase = generateProceduralDetectiveCase();
            const distractors = ELECTRONIC_COMPONENTS.filter(
              (c) => c.id !== randomTarget.id
            )
              .sort(() => Math.random() - 0.5)
              .slice(0, 5);
            const aiCase = {
              target: randomTarget,
              candidates: [randomTarget, ...distractors].sort(
                () => Math.random() - 0.5
              ),
              clues: [parsed.clues[0], parsed.clues[1], parsed.clues[2]] as [
                string,
                string,
                string
              ],
              isAiGenerated: true,
              source: "ai" as const,
              contextHeader:
                "Laudo Gerado por IA (Gemini): Identifique o componente",
              fallbackUsed: false,
              _meta: baseCase.target.id,
            };
            return NextResponse.json({
              ...aiCase,
              caseData: aiCase,
            });
          }
        }
      }
    }

    if (type === "resistor") {
      return NextResponse.json(generateProceduralResistorOrder());
    }

    return NextResponse.json(generateProceduralDetectiveCase());
  } catch {
    return NextResponse.json(generateProceduralDetectiveCase());
  }
}
