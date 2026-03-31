/** Sidebar skeleton shown instantly while profile data streams in. */
export default function SidebarSkeleton() {
  return (
    <aside className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white border border-[#e8e6e3] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 animate-pulse bg-[#e8e6e3] shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse bg-[#e8e6e3]" />
            <div className="h-3 w-40 animate-pulse bg-[#e8e6e3]" />
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="bg-white border border-[#e8e6e3] p-2 space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse bg-[#f0eeeb]" />
        ))}
      </div>
    </aside>
  );
}
