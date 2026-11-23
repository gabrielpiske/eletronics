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
    const recentTargetIds: string[] = Array.isArray(body?.recentTargetIds)
      ? body.recentTargetIds.map(String)
      : [];
    const apiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Se houver chave da API Gemini configurada no ambiente, gera pistas técnicas inéditas via IA
    if (apiKey && type === "detective") {
      const candidatePool = ELECTRONIC_COMPONENTS.filter(
        (c) => !recentTargetIds.includes(c.id)
      );
      const sourcePool =
        candidatePool.length > 0 ? candidatePool : ELECTRONIC_COMPONENTS;
      const randomTarget =
        sourcePool[Math.floor(Math.random() * sourcePool.length)];

      const prompt = `Você é um professor de Eletrônica Industrial do SENAI. Gere 3 pistas técnicas curtas, progressivas e inéditas em português sobre o componente "${randomTarget.name}" (Designador: ${randomTarget.boardLetter}, Função: ${randomTarget.basicFunction}) SEM citar o nome explícito do componente em nenhuma das 3 pistas. Responda APENAS em JSON válido no formato: {"clues": ["pista 1", "pista 2", "pista 3"]}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3200);

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
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
              const sameCategory = ELECTRONIC_COMPONENTS.filter(
                (c) =>
                  c.id !== randomTarget.id &&
                  c.category === randomTarget.category
              ).sort(() => Math.random() - 0.5);
              const otherCategory = ELECTRONIC_COMPONENTS.filter(
                (c) =>
                  c.id !== randomTarget.id &&
                  c.category !== randomTarget.category
              ).sort(() => Math.random() - 0.5);
              const distractors = [
                ...sameCategory.slice(0, 3),
                ...otherCategory.slice(0, 2),
              ].slice(0, 5);

              const aiCase = {
                target: randomTarget,
                candidates: [randomTarget, ...distractors].sort(
                  () => Math.random() - 0.5
                ),
                clues: [
                  String(parsed.clues[0]),
                  String(parsed.clues[1]),
                  String(parsed.clues[2]),
                ] as [string, string, string],
                isAiGenerated: true,
                source: "ai" as const,
                contextHeader:
                  "Laudo Gerado por IA (Gemini): Identifique o componente",
                fallbackUsed: false,
              };
              return NextResponse.json({
                ...aiCase,
                caseData: aiCase,
              });
            }
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    if (type === "resistor") {
      return NextResponse.json(generateProceduralResistorOrder());
    }

    const fallbackCase = generateProceduralDetectiveCase(recentTargetIds);
    return NextResponse.json({
      ...fallbackCase,
      caseData: fallbackCase,
    });
  } catch {
    const fallbackCase = generateProceduralDetectiveCase();
    return NextResponse.json({
      ...fallbackCase,
      caseData: fallbackCase,
    });
  }
}
