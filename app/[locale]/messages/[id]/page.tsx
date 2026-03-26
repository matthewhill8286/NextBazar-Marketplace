import { redirect } from "next/navigation";

export default async function ChatRedirect(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/dashboard/messages/${id}`);
}
