import ChatThread from "@/app/[locale]/messages/[id]/chat-thread";

export default async function DashboardChatPage(
  props: PageProps<"/[locale]/dashboard/messages/[id]">,
) {
  const { id } = await props.params;
  return <ChatThread conversationId={id} />;
}
