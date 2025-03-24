"use client";

import type React from "react";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect } from "react";
import { Loader2, ArrowUp, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";
import Textarea from "react-textarea-autosize";
import { cn } from "@/lib/utils";

export default function ChatbotUI() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, input, handleInputChange, handleSubmit, status } =
    useChat({
      onFinish: () => {
        textareaRef.current?.focus();
      },
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Handle form submission
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      handleSubmit(e);
      // Focus back on textarea after submission
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col w-full rounded-lg">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] md:h-[500px] md:w-[500px] bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] md:h-[500px] md:w-[500px] dark:bg-purple-500/10 bg-purple-500/15 blur-[100px]" />
      </div>
      <div className="flex-1 pr-4 mb-8 flex p-4 flex-col h-full max-w-4xl w-full mx-auto">
        <div className="space-y-6 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-muted-foreground">
              <Ghost className="mb-2 size-6" />
              <p className="text-center">
                No messages yet. Start a conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-3 max-w-[80%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border"
                  )}
                >
                  {message.parts.map((part, i) =>
                    part.type === "text" ? (
                      <div key={i} className="whitespace-pre-wrap">
                        {part.text}
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))
          )}
          {status === "streaming" && (
            <div className="flex items-start gap-3">
              <div className="rounded-lg px-4 py-3 max-w-[80%] bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="fixed bottom-0 right-0 left-0 max-w-4xl w-full mx-auto"
      >
        <div className="relative bg-background border-x border-t rounded-t-xl shadow-xl">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[60px] mb-0 resize-none pr-12 py-3 w-full px-4 focus:outline-0"
            maxRows={5}
            disabled={status === "submitted"}
          />
          <div className="absolute right-2 top-2">
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || status === "submitted"}
              className="size-8"
            >
              {status === "submitted" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
