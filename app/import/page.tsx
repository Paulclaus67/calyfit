"use client";

import { useState } from "react";
import { parseProgramText, exampleProgramText } from "@/lib/program-import";

export default function ImportPage() {
  const [input, setInput] = useState(exampleProgramText.trim());
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleParse() {
    try {
      setError(null);
      const result = parseProgramText(input);
      setOutput(JSON.stringify(result, null, 2));
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Erreur inconnue pendant le parsing");
      setOutput("");
    }
  }

  return (
    <main className="min-h-screen p-4 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold mb-1">Import de programme</h1>
        <p className="text-sm text-slate-400">
          Colle un programme au format texte, puis clique sur &quot;Parser&quot;
          pour le convertir en <code>WeekPlan</code> + <code>Session[]</code>.
        </p>
      </header>

      <section className="space-y-2">
        <label className="block text-sm font-medium text-slate-200 mb-1">
          Texte du programme
        </label>
        <textarea
          className="w-full h-64 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm font-mono text-slate-100 resize-y"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleParse}
          className="mt-2 inline-flex items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-50 hover:bg-slate-700 active:scale-[0.99]"
        >
          Parser le programme
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-400">
            Erreur pendant le parsing : {error}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Résultat</h2>
        {output ? (
          <pre className="max-h-[50vh] overflow-auto rounded-xl bg-slate-950/80 p-3 text-xs text-slate-100">
{output}
          </pre>
        ) : (
          <p className="text-sm text-slate-400">
            Clique sur &quot;Parser le programme&quot; pour voir le résultat ici.
          </p>
        )}
      </section>
    </main>
  );
}
