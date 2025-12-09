"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";
const MIN_PASSWORD_LENGTH = 8;

export default function LoginClient() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const nameValid = mode === "login" || name.trim().length >= 1;

  const canSubmit = !loading && emailValid && passwordValid && nameValid;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!canSubmit) {
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data.error || "Impossible de créer le compte");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || "Identifiants incorrects");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrorMsg("Erreur inattendue, réessaie dans un instant.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
        {/* header */}
        <div className="mb-4 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Calyfit
          </p>
          <h1 className="mt-1 text-xl font-semibold">
            {mode === "login"
              ? "Connexion à ton espace"
              : "Créer un compte"}
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Accède à ton planning, ton historique et tes stats, synchronisés
            sur ce compte.
          </p>
        </div>

        {/* switch login / register */}
        <div className="mb-4 flex rounded-full bg-slate-900 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
            }}
            className={
              "flex-1 rounded-full px-3 py-1 transition " +
              (mode === "login"
                ? "bg-sky-500 text-slate-50 shadow-sm"
                : "text-slate-400")
            }
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setErrorMsg(null);
            }}
            className={
              "flex-1 rounded-full px-3 py-1 transition " +
              (mode === "register"
                ? "bg-sky-500 text-slate-50 shadow-sm"
                : "text-slate-400")
            }
          >
            Créer un compte
          </button>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                Prénom / pseudo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
                placeholder="Paul"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={
                "w-full rounded-xl border bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500 " +
                (touched.email && !emailValid
                  ? "border-red-500"
                  : "border-slate-700")
              }
              placeholder="toi@example.com"
            />
            {touched.email && !emailValid && (
              <p className="text-[10px] text-red-300">
                Entre une adresse email valide.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">
              Mot de passe
            </label>
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              className={
                "w-full rounded-xl border bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500 " +
                (touched.password && !passwordValid
                  ? "border-red-500"
                  : "border-slate-700")
              }
              placeholder="Au moins 8 caractères"
            />
            {touched.password && !passwordValid && (
              <p className="text-[10px] text-red-300">
                Le mot de passe doit contenir au moins {MIN_PASSWORD_LENGTH}{" "}
                caractères.
              </p>
            )}
          </div>

          {errorMsg && (
            <p className="text-[11px] text-red-300">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 w-full rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Patiente…"
              : mode === "login"
              ? "Se connecter"
              : "Créer mon compte"}
          </button>

          <p className="mt-2 text-[10px] text-slate-500 text-center">
            Ton mot de passe est hashé et stocké de façon sécurisée. Il
            n&apos;est jamais envoyé en clair ni partagé.
          </p>
        </form>
      </div>
    </main>
  );
}
