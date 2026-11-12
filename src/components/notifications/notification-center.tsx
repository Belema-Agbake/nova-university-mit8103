"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FeedItem = { id: string; title: string; message: string; isRead: boolean };

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<FeedItem[]>([]);
  const [activity, setActivity] = useState<FeedItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [busy, setBusy] = useState(true);

  useEffect(() => onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) return;
    const headers = { authorization: `Bearer ${await user.getIdToken()}` };
    const [notificationResponse, activityResponse] = await Promise.all([
      fetch("/api/v1/notifications?pageSize=5", { headers }),
      fetch("/api/v1/activity?pageSize=5", { headers }),
    ]);
    if (notificationResponse.ok) {
      const data = await notificationResponse.json() as { items: FeedItem[]; unreadCount: number };
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    }
    if (activityResponse.ok) setActivity((await activityResponse.json() as { items: FeedItem[] }).items);
    setBusy(false);
  }), []);

  async function markRead(id: string) {
    const user = firebaseAuth.currentUser;
    if (!user) return;
    await fetch(`/api/v1/notifications/${id}`, { method: "PATCH", headers: { authorization: `Bearer ${await user.getIdToken()}` } });
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  }

  if (busy) return null;
  return <div className="mt-8 grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Notifications</CardTitle>{unreadCount > 0 && <Badge>{unreadCount} unread</Badge>}</CardHeader>
      <CardContent className="space-y-3">{notifications.length === 0 && <p className="text-sm text-muted-foreground">No notifications yet.</p>}{notifications.map((item) => <div key={item.id} className={`rounded-lg border p-3 ${item.isRead ? "opacity-70" : "bg-blue-50"}`}><div className="flex items-start justify-between gap-3"><p className="font-medium">{item.title}</p>{!item.isRead && <button className="text-xs font-semibold text-primary hover:underline" onClick={() => markRead(item.id)}>Mark read</button>}</div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p></div>)}</CardContent>
    </Card>
    <Card><CardHeader><CardTitle>Activity feed</CardTitle></CardHeader><CardContent className="space-y-3">{activity.length === 0 && <p className="text-sm text-muted-foreground">No academic activity yet.</p>}{activity.map((item) => <div key={item.id} className="rounded-lg border p-3"><p className="font-medium">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p></div>)}</CardContent></Card>
  </div>;
}
