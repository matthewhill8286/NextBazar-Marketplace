import { Bone, HeaderSkeleton, ListRowSkeleton } from "../loading-skeleton";

export default function MessagesLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <HeaderSkeleton subtitle={false} />
      <Bone className="h-10 w-full rounded-xl mb-4" />
      <ListRowSkeleton count={5} />
    </div>
  );
}
