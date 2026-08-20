import ChatThread from "@/app/[locale]/messages/[id]/chat-thread";
import type { Route } from "./+types/messages-id";

export default function DashboardChatPage({ params }: Route.ComponentProps) {
  return (
    <ChatThread conversationId={params.id!} backHref="/dashboard/messages" embedded />
  );
}
