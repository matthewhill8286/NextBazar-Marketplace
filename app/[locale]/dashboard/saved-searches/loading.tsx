import { HeaderSkeleton, ListRowSkeleton } from "../loading-skeleton";

export default function SavedSearchesLoading() {
  return (
    <div>
      <HeaderSkeleton subtitle={false} />
      <ListRowSkeleton count={4} />
    </div>
  );
}
