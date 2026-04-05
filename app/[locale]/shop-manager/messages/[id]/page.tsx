import { redirect } from "next/navigation";

export default async function R(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/dashboard/messages/${id}`);
}
