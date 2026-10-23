"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn, formatTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface ChatPanelProps {
  rideId: string;
  meId: string;
  otherName: string;
  initialMessages: Message[];
  /** Sending is only possible while a driver is attached and the ride is live. */
  canSend: boolean;
  disabledReason?: string;
}

export function ChatPanel({ rideId, meId, otherName, initialMessages, canSend, disabledReason }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Realtime: new messages for this ride only. RLS ensures only participants receive them.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${rideId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `ride_id=eq.${rideId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    const { data, error } = await createClient()
      .from("messages")
      .insert({ ride_id: rideId, sender_id: meId, content })
      .select()
      .single();
    setSending(false);

    if (error) return toast.error("Message not sent. Please try again.");

    setText("");
    // Show it immediately; the realtime echo is de-duplicated by id.
    const saved = data as Message;
    setMessages((prev) => (prev.some((m) => m.id === saved.id) ? prev : [...prev, saved]));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <MessageCircle className="size-5 text-primary" aria-hidden />
        <CardTitle>Chat with {otherName}</CardTitle>
      </CardHeader>

      <div
        ref={scrollRef}
        className="mx-5 mb-3 flex h-64 flex-col gap-2 overflow-y-auto rounded-xl bg-muted p-3"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-muted-foreground">
            No messages yet. Say hello and share a landmark so your pickup is easy.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <p
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px]",
                  mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card",
                )}
              >
                {m.content}
              </p>
              <span className="mt-0.5 px-1 text-[11px] text-muted-foreground">{formatTime(m.created_at)}</span>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2 p-5 pt-0">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={canSend ? "Type a message" : (disabledReason ?? "Chat unavailable")}
          disabled={!canSend}
          maxLength={1000}
          aria-label="Message"
        />
        <Button type="submit" size="icon" disabled={!canSend || !text.trim()} loading={sending} aria-label="Send message">
          {!sending && <Send />}
        </Button>
      </form>
    </Card>
  );
}
