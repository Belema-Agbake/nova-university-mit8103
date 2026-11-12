"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { ArrowRight, GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Mode = "sign-in" | "register" | "reset";
type Portal = "student" | "staff";

function message(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code.includes("email-already-in-use")) return "An account already exists for this email.";
  if (code.includes("invalid-credential")) return "The email address or password is incorrect.";
  if (code.includes("weak-password")) return "Use at least six characters.";
  if (code.includes("OFFICIAL_IDENTITY_LINK_REQUIRED")) return "Your official identity needs a separate trusted linking step. Your academic record remains protected.";
  return "We could not complete that request. Please try again.";
}

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [portal, setPortal] = useState<Portal>("student");
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suppliedId, setSuppliedId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(firebaseAuth, email);
        setMode("sign-in");
        return;
      }
      if (mode === "register") {
        const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const token = await credential.user.getIdToken();
        const response = await fetch("/api/v1/auth/onboard", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ firstName, lastName, suppliedId, role: portal === "student" ? "STUDENT" : "LECTURER" }) });
        if (!response.ok) throw new Error((await response.json()).error?.code ?? "onboarding-failed");
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      router.push("/");
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  if (user) return <main className="grid min-h-screen place-items-center bg-background p-6"><Card className="w-full max-w-lg"><CardHeader><CardTitle>You are signed in</CardTitle><CardDescription>{user.email}</CardDescription></CardHeader><CardContent className="space-y-3"><Button className="w-full" onClick={() => router.push("/")}>Open dashboard <ArrowRight /></Button><Button variant="outline" className="w-full" onClick={() => signOut(firebaseAuth)}>Sign out</Button></CardContent></Card></main>;

  return <main className="grid min-h-screen place-items-center bg-background p-4 sm:p-8"><div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-xl lg:grid-cols-[1.05fr_.95fr]"><section className="hidden bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-white text-primary"><GraduationCap className="size-6" /></div><div><p className="font-bold">Nova University</p><p className="text-xs text-blue-100">Result Management</p></div></div><div><p className="text-sm font-medium text-[#F5D78D]">Secure academic workspace</p><h1 className="mt-3 text-4xl font-bold leading-tight">Your academic journey, clearly organised.</h1><p className="mt-5 max-w-md text-sm leading-6 text-blue-100">Firebase protects your sign-in. PostgreSQL determines your academic permissions.</p></div><p className="flex items-center gap-2 text-sm text-blue-100"><ShieldCheck className="size-4 text-[#D5A748]" /> Secure Firebase Authentication</p></section><section className="p-6 sm:p-10"><p className="text-sm font-semibold text-[#236A72]">{mode === "reset" ? "Account recovery" : portal === "student" ? "Student portal" : "Staff portal"}</p><h2 className="mt-2 text-3xl font-bold tracking-tight">{mode === "reset" ? "Reset your password" : mode === "register" ? "Create your account" : "Welcome back"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Use Firebase email and password authentication.</p>{mode !== "reset" && <div className="mt-6 grid grid-cols-2 gap-2"><Button type="button" variant={portal === "student" ? "default" : "outline"} onClick={() => setPortal("student")}>Student</Button><Button type="button" variant={portal === "staff" ? "default" : "outline"} onClick={() => setPortal("staff")}>Staff</Button></div>}<form className="mt-6 space-y-4" onSubmit={submit}>{mode === "register" && <div className="grid gap-4 sm:grid-cols-2"><Input aria-label="First name" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required /><Input aria-label="Last name" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required /></div>}<div className="relative"><Mail className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Email address" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" required /></div>{mode === "register" && <Input aria-label={portal === "student" ? "Matriculation number" : "Staff ID"} placeholder={portal === "student" ? "Matriculation number" : "Staff ID"} value={suppliedId} onChange={e => setSuppliedId(e.target.value)} required />}{mode !== "reset" && <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Password" type="password" placeholder="Password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="pl-9" required /></div>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-destructive" role="alert">{error}</p>}<button type="submit" disabled={busy} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-50">{busy ? "Please wait…" : mode === "reset" ? "Send reset link" : mode === "register" ? "Create account" : "Sign in"}<ArrowRight className="size-4" /></button></form><div className="mt-6 flex justify-between text-sm text-muted-foreground"><button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setMode(mode === "register" ? "sign-in" : "register"); setError(null); }}>{mode === "register" ? "Sign in" : "Create account"}</button><button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setMode("reset"); setError(null); }}>Forgot password?</button></div></section></div></main>;
}
