import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { ArrowUp, Sparkles } from "lucide-react";
import { generateWearoAiReply } from "@/lib/wearo-ai-chat.functions";
import { getCustomerAccessToken } from "@/lib/auth";

const modelAdapter: ChatModelAdapter = {
  async run({ messages }) {
    const session = getCustomerSession();
    if (!session?.access_token) throw new Error("MEMBER_REQUIRED");
    const normalized = messages
      .map((message) => ({
        role: message.role === "user" ? "user" as const : "assistant" as const,
        content: message.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n"),
      }))
      .filter((message) => message.content.trim().length > 0);

    const result = await generateWearoAiReply({ data: { accessToken, messages: normalized } });
    return { content: [{ type: "text", text: result.text }] };
  },
};

function WearoMessage() {
  return (
    <MessagePrimitive.Root className="wearo-ai-message wearo-ai-message-assistant">
      <div className="wearo-ai-message-icon" aria-hidden="true"><Sparkles className="size-3.5" /></div>
      <div className="wearo-ai-message-copy"><MessagePrimitive.Parts>{({ part }) => (part.type === "text" ? <MessagePartPrimitive.Text /> : null)}</MessagePrimitive.Parts></div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="wearo-ai-message wearo-ai-message-user">
      <div className="wearo-ai-user-bubble"><MessagePrimitive.Parts>{({ part }) => (part.type === "text" ? <MessagePartPrimitive.Text /> : null)}</MessagePrimitive.Parts></div>
    </MessagePrimitive.Root>
  );
}

function WearoThread() {
  return (
    <ThreadPrimitive.Root className="wearo-ai-thread">
      <ThreadPrimitive.Viewport className="wearo-ai-thread-viewport"><ThreadPrimitive.Messages>{({ message }) => (message.role === "user" ? <UserMessage /> : <WearoMessage />)}</ThreadPrimitive.Messages></ThreadPrimitive.Viewport>
      <ThreadPrimitive.If condition="running">
        <div className="wearo-ai-typing-state" role="status" aria-live="polite">
          <span className="wearo-ai-loader" aria-hidden="true" />
          <span>WEARO AI Stylist đang soạn câu trả lời…</span>
        </div>
      </ThreadPrimitive.If>
      <div className="wearo-ai-composer-wrap">
        <ComposerPrimitive.Root className="wearo-ai-composer">
          <ComposerPrimitive.Input placeholder="Ví dụ: Phối gì với hoodie beige để đi học?" rows={2} className="wearo-ai-composer-input" />
          <ComposerPrimitive.Send className="wearo-ai-composer-send" aria-label="Gửi tin nhắn"><ArrowUp className="size-4" /></ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
        <p className="wearo-ai-composer-note">Không chia sẻ thông tin nhạy cảm. AI có thể đưa ra gợi ý chưa hoàn toàn chính xác.</p>
      </div>
    </ThreadPrimitive.Root>
  );
}

export function WearoAiAssistant() {
  const runtime = useLocalRuntime(modelAdapter, { maxSteps: 1 });
  return <AssistantRuntimeProvider runtime={runtime}><WearoThread /></AssistantRuntimeProvider>;
}
