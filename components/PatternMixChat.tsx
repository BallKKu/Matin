"use client";

import { useEffect, useRef, useState } from "react";
import type { Pattern } from "@/lib/silk-patterns";
import { composeMudmee } from "@/lib/mudmeeComposer";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  attachments?: Pattern[];
  image?: string;
  pending?: boolean;
  error?: boolean;
  source?: "gemini" | "demo";
};

type Props = {
  selected: Pattern[];
  onRemove: (id: string) => void;
  onClear: () => void;
};

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export default function PatternMixChat({ selected, onRemove, onClear }: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: "เลือกลายผ้าด้วยปุ่ม + บนการ์ด แล้วกดเจนภาพ ระบบจะผสมลายที่เลือกให้เป็นลายใหม่",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // เปิดแชทเองเมื่อมีลายถูกเลือกหรือมีผลลัพธ์แล้ว แต่ผู้ใช้กดย่อ/ขยายทับได้
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? (selected.length > 0 || messages.length > 1);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function handleGenerate() {
    if (busy || selected.length === 0) return;

    const attachments = [...selected];
    const note = input.trim();
    const pendingId = newId();

    setMessages((current) => [
      ...current,
      {
        id: newId(),
        role: "user",
        text: note || `ผสมลาย ${attachments.map((item) => item.name).join(" + ")}`,
        attachments,
      },
      { id: pendingId, role: "assistant", text: "กำลังเจนลายผสม...", pending: true },
    ]);
    setInput("");
    setBusy(true);

    const finish = (patch: Partial<Message>) =>
      setMessages((current) =>
        current.map((message) =>
          message.id === pendingId ? { ...message, pending: false, ...patch } : message
        )
      );

    // ร่างผังในเครื่องให้เห็นทันที ไม่ต้องรอ Gemini
    let drafted = false;
    try {
      const draft = composeMudmee(attachments);
      finish({
        text: `ร่างผังในเครื่อง — ${draft.recipe}
กำลังให้ Gemini ออกแบบผังให้ใหม่...`,
        image: draft.dataUrl,
        source: "demo",
        pending: true,
      });
      drafted = true;
    } catch {
      /* เบราว์เซอร์ไม่รองรับ canvas — ปล่อยให้รอผลจาก Gemini อย่างเดียว */
    }

    try {
      const response = await fetch("/api/mix-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternIds: attachments.map((item) => item.id), prompt: note }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.image) {
        // ภาพจริงจาก Stability AI
        finish({
          text: `ลายผสมจาก ${attachments.map((item) => item.name).join(" + ")} (Stability AI)`,
          image: data.image,
          source: "gemini",
        });
      } else if (response.ok && data.drawing) {
        // Gemini วาดลายมาให้ แล้วเราจัดวางลงโครงผ้า เรนเดอร์ด้วยตัวเดียวกับโหมดในเครื่อง
        const mix = composeMudmee(attachments, data.drawing);
        finish({
          text: `${mix.recipe} · ลายวาดโดย ${data.model}`,
          image: mix.dataUrl,
          source: "gemini",
        });
      } else if (drafted) {
        finish({
          text: `Gemini ไม่ว่าง ใช้ผังที่ประกอบในเครื่องแทน (ลองกดเจนอีกครั้งได้)`,
        });
      } else {
        finish({ text: data.error ?? "สร้างผังไม่สำเร็จ", error: true });
      }
    } catch {
      if (!drafted) finish({ text: "เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง", error: true });
      else finish({ text: "ใช้ผังที่ประกอบในเครื่อง (เชื่อมต่อ Gemini ไม่ได้)" });
    } finally {
      setBusy(false);
      onClear();
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-[26px] border border-stone-200 bg-white/95 shadow-[0_18px_60px_-28px_rgba(40,30,20,0.6)] backdrop-blur">
        <button
          type="button"
          onClick={() => setManualOpen(!open)}
          className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <span className="grid size-7 place-items-center rounded-full bg-orange-900 text-sm text-white">
              ✦
            </span>
            ผสมลายผ้าด้วย AI
            {selected.length > 0 && (
              <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-900">
                เลือกแล้ว {selected.length}
              </span>
            )}
          </span>
          <span className="text-xs text-stone-500">{open ? "ย่อลง ▾" : "เปิดแชท ▴"}</span>
        </button>

        {open && (
          <div
            ref={scrollRef}
            className="max-h-[46vh] space-y-4 overflow-y-auto border-t border-stone-100 px-5 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-orange-900 text-white"
                      : message.error
                        ? "bg-red-50 text-red-800"
                        : "bg-stone-100 text-stone-800"
                  }`}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.attachments.map((item) => (
                        <img
                          key={item.id}
                          src={item.image}
                          alt={item.name}
                          className="size-14 rounded-lg object-cover ring-2 ring-white/40"
                        />
                      ))}
                    </div>
                  )}
                  <p className={`whitespace-pre-line ${message.pending ? "animate-pulse" : ""}`}>{message.text}</p>
                  {message.image && (
                    <div className="mt-3">
                      <img
                        src={message.image}
                        alt="ลายผ้าที่เจนขึ้นใหม่"
                        className="w-full max-w-sm rounded-xl border border-stone-200"
                      />
                      <a
                        href={message.image}
                        download={`mudmee-mix-${message.id}.jpg`}
                        className="mt-2 inline-block text-xs font-semibold text-orange-900 underline"
                      >
                        ดาวน์โหลดภาพ
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-stone-100 px-4 py-3">
          {selected.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {selected.map((pattern) => (
                <span
                  key={pattern.id}
                  className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 py-1 pl-1 pr-2 text-xs"
                >
                  <img src={pattern.image} alt="" className="size-7 rounded-full object-cover" />
                  {pattern.name}
                  <button
                    type="button"
                    onClick={() => onRemove(pattern.id)}
                    aria-label={`นำ ${pattern.name} ออก`}
                    className="grid size-5 place-items-center rounded-full text-stone-500 hover:bg-stone-200"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-stone-500 underline hover:text-stone-700"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleGenerate();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleGenerate();
                }
              }}
              rows={1}
              placeholder={
                selected.length > 0
                  ? "อยากให้ลายผสมออกมาเป็นแบบไหน (ไม่ใส่ก็ได้)"
                  : "กดปุ่ม + บนการ์ดลายผ้าเพื่อเพิ่มลายเข้าแชท"
              }
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-stone-300 px-4 py-3 text-sm outline-none transition focus:border-orange-800 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              disabled={busy || selected.length === 0}
              className="h-11 shrink-0 rounded-2xl bg-orange-900 px-5 text-sm font-semibold text-white transition hover:bg-orange-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "กำลังเจน..." : "เจนภาพ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
