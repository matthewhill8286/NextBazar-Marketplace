import { Bone } from "../../loading-skeleton";

export default function ChatLoading() {
  return (
    <div
      className="mx-auto flex flex-col"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <Bone className="w-8 h-8 rounded-lg shrink-0" />
        <Bone className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-48" />
        </div>
        <Bone className="w-10 h-10 rounded-lg shrink-0" />
      </div>

      {/* Listing bar */}
      <div className="bg-indigo-50/50 border-b border-indigo-100 px-4 py-2.5 flex items-center gap-3 shrink-0">
        <div className="flex-1 space-y-1.5">
          <Bone className="h-3 w-3/4" />
          <Bone className="h-3 w-1/4" />
        </div>
        <Bone className="w-16 h-4" />
        <Bone className="w-24 h-7 rounded-lg" />
      </div>

      {/* Message bubbles */}
      <div className="flex-1 p-4 space-y-6 overflow-hidden">
        <div className="flex justify-start">
          <div className="space-y-2">
            <Bone className="h-10 w-48 rounded-2xl rounded-tl-none" />
            <Bone className="h-3 w-12" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="space-y-2 flex flex-col items-end">
            <Bone className="h-12 w-56 rounded-2xl rounded-tr-none" />
            <Bone className="h-3 w-12" />
          </div>
        </div>
        <div className="flex justify-start">
          <div className="space-y-2">
            <Bone className="h-20 w-64 rounded-2xl rounded-tl-none" />
            <Bone className="h-3 w-12" />
          </div>
        </div>
        <div className="flex justify-end">
          <div className="space-y-2 flex flex-col items-end">
            <Bone className="h-10 w-36 rounded-2xl rounded-tr-none" />
            <Bone className="h-3 w-12" />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <Bone className="h-11 flex-1 rounded-xl" />
          <Bone className="h-11 w-11 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  );
}
