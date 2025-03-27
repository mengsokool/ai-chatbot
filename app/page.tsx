"use client";

import type React from "react";
import { useRef, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Loader2, ArrowUp, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import Textarea from "react-textarea-autosize";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { MemoizedReactMarkdown } from "@/components/markdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChatbotUI() {
  const [model, setModel] = useState("search");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    onFinish: () => {
      textareaRef.current?.focus();
    },
    body: { selectedModel: model },
  });

  // ส่งข้อมูลเมื่อฟอร์มถูก submit
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      handleSubmit(e);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // กำหนด keydown สำหรับ submit แบบ shortcut (กด Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  // Scroll ลงไปที่ข้อความล่าสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="absolute right-0 top-0 h-72 w-72 md:h-96 md:w-96 bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 md:h-96 md:w-96 bg-purple-500/15 blur-3xl" />
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 max-w-4xl w-full mx-auto overflow-y-auto pt-8 pb-36">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-muted-foreground">
            <Ghost className="mb-2 h-10 w-10" />
            <p className="text-center text-lg">เริ่มการสนทนาของคุณเลย!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3 mb-4",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-5 py-4 max-w-[80%] shadow-md",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-gray-200"
                )}
              >
                {message.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div
                        className={cn(
                          message.role === "user" && "prose-invert",
                          "prose prose-neutral"
                        )}
                        key={i}
                      >
                        <MemoizedReactMarkdown>
                          {part.text}
                        </MemoizedReactMarkdown>
                      </div>
                    );
                  }
                  if (part.type === "reasoning") {
                    return (
                      <pre key={i}>
                        {part.details.map((detail) =>
                          detail.type === "text" ? detail.text : "<redacted>"
                        )}
                      </pre>
                    );
                  }
                  return null;
                })}
                {message.parts
                  .filter((part) => part.type === "source")
                  .map((part) => (
                    <a
                      key={`source-${part.source.id}`}
                      href={part.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3 rounded-lg border border-gray-300 bg-gray-50 p-3 hover:bg-gray-100 transition-all shadow-sm items-center gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-medium text-blue-600 truncate">
                          {part.source.title ??
                            new URL(part.source.url).hostname}
                        </span>
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          ))
        )}
        {status === "streaming" && (
          <div className="flex items-start gap-3 mb-4">
            <div className="rounded-xl px-5 py-4 max-w-[80%] bg-muted shadow-md">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Area */}
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="fixed bottom-0 left-0 right-0 max-w-4xl w-full mx-auto"
      >
        <div className="relative bg-background border-t border-gray-200 rounded-t-2xl shadow-lg">
          <Textarea
            autoFocus
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์ข้อความ..."
            className="min-h-[60px] resize-none pr-16 py-3 w-full px-5 focus:outline-none text-base"
            maxRows={5}
            disabled={status === "submitted"}
          />
          <div className="absolute right-3 top-3">
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || status === "submitted"}
              className="p-2"
            >
              {status === "submitted" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2 pl-5 py-2">
            <Select value={model} onValueChange={(value) => setModel(value)}>
              <SelectTrigger className="w-fit font-semibold">
                <SelectValue placeholder="เลือกโหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="reasoning">Reasoning</SelectItem>
                <SelectItem value="search">Web Search</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </div>
  );
}
