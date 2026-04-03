import ChatThread from "@/app/[locale]/messages/[id]/chat-thread";

export default async function ShopManagerChatPage(
  props: PageProps<"/[locale]/shop-manager/messages/[id]">,
) {
  const { id } = await props.params;
  return <ChatThread conversationId={id} backHref="/shop-manager/messages" embedded />;
}
