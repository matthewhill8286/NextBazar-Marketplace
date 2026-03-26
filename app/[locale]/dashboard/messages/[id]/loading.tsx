import { Bone } from "../../loading-skeleton";

export default function ChatLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <Bone className="w-8 h-8 rounded-lg shrink-0" />
        <Bone className="w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-48" />
        </div>
      </div>

      {/* Listing bar */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-50 bg-gray-50/50">
        <Bone className="w-full h-10 rounded-lg" />
      </div>

      {/* Message bubbles */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex justify-start">
          <Bone className="h-16 w-56 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Bone className="h-12 w-44 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Bone className="h-20 w-64 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Bone className="h-10 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-gray-100">
        <Bone className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
