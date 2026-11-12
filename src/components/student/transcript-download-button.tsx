"use client";
import { useState } from "react";
import { firebaseAuth } from "@/lib/firebase/client";

export function TranscriptDownloadButton({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/v1/student/transcript", { headers: { authorization: `Bearer ${await user.getIdToken()}` } });
      if (!response.ok) throw new Error("Transcript unavailable");
      const url = URL.createObjectURL(await response.blob());
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } finally { setLoading(false); }
  };
  return <button type="button" onClick={() => void download()} disabled={loading} className={className}>{loading ? "Preparing transcript…" : "Download official transcript"}</button>;
}
