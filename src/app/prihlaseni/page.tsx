"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, Wrench } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PrihlaseniPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordAuth(mode: "login" | "register") {
    if (!configured) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Zadejte prosím platnou e-mailovou adresu.");
      setMessage(null);
      return;
    }
    if (!password || password.length < 6) {
      setError("Zadejte prosím heslo o délce alespoň 6 znaků.");
      setMessage(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (authError) throw authError;
        router.push("/");
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }
        setMessage(
          "Účet byl vytvořen. Potvrďte prosím odkaz ve své e-mailové schránce a poté se přihlaste."
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Nepodařilo se přihlásit.";
      setError(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (otpError) throw otpError;
      setMessage(
        "Přihlašovací odkaz byl odeslán na váš e-mail. Otevřete jej na tomto zařízení."
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Odeslání odkazu se nezdařilo.";
      setError(translateAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#09090b] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#111113] text-blue-400">
            <BrandLogo className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AutoGaráž
          </h1>
          <p className="text-sm text-zinc-400">
            Elektronická servisní knížka &amp; evidence nákladů
          </p>
        </div>

        {!configured ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-300">
                <Wrench className="h-4 w-4" />
                Supabase není zatím připojen
              </CardTitle>
              <CardDescription className="text-zinc-300">
                Doplňte klíče do <code className="text-sky-300">.env.local</code>{" "}
                podle šablony <code className="text-sky-300">.env.example</code>{" "}
                a spusťte migraci <code className="text-sky-300">supabase/schema.sql</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/")}>
                Otevřít aplikaci v lokálním režimu náhledu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Přihlášení do garáže</CardTitle>
              <CardDescription>
                Přistupujte ke své servisní knížce bezpečně z počítače i mobilu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="password" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">Heslem</TabsTrigger>
                  <TabsTrigger value="magic">Odkazem na e-mail</TabsTrigger>
                </TabsList>

                <TabsContent value="password">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handlePasswordAuth("login");
                    }}
                    className="space-y-4 pt-2"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="email-pw">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                          id="email-pw"
                          type="email"
                          required
                          placeholder="vas@email.cz"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password">Heslo</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                          id="password"
                          type="password"
                          required
                          minLength={6}
                          placeholder="Minimálně 6 znaků"
                          className="pl-9"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                        {message}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Pracuji..." : "Přihlásit se"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={() => handlePasswordAuth("register")}
                      >
                        Registrovat
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="magic">
                  <form onSubmit={handleMagicLink} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email-magic">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                          id="email-magic"
                          type="email"
                          required
                          placeholder="vas@email.cz"
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                        {message}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                      <Sparkles className="h-4 w-4" />
                      {loading ? "Odesílám..." : "Odeslat přihlašovací odkaz"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function translateAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("anonymous sign-ins are disabled")) {
    return "Nejprve vyplňte svůj e-mail a heslo.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Nesprávný e-mail nebo heslo.";
  }
  if (lower.includes("email not confirmed")) {
    return "E-mail zatím nebyl potvrzen. Zkontrolujte prosím svou schránku.";
  }
  if (lower.includes("user already registered")) {
    return "Uživatel s tímto e-mailem již existuje.";
  }
  if (lower.includes("unable to validate email address") || lower.includes("invalid email")) {
    return "Zadejte prosím platnou e-mailovou adresu.";
  }
  if (lower.includes("password should be at least") || lower.includes("valid password")) {
    return "Heslo musí mít alespoň 6 znaků.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Příliš mnoho pokusů za krátkou dobu. Zkuste to prosím za chvíli.";
  }
  return message;
}
