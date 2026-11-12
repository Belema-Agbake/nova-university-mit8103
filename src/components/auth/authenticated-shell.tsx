"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/card";

export function AuthenticatedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "ready">("loading");
  useEffect(() => onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) { router.replace("/sign-in"); return; }
    const response = await fetch("/api/v1/auth/session", { headers: { authorization: `Bearer ${await user.getIdToken()}` } });
    if (!response.ok) { router.replace("/sign-in"); return; }
    setState("ready");
  }), [router]);
  if (state === "loading") return <main className="grid min-h-screen place-items-center bg-background"><Card><CardContent className="p-8 text-sm text-muted-foreground">Loading your secure Nova session…</CardContent></Card></main>;
  return children;
}
