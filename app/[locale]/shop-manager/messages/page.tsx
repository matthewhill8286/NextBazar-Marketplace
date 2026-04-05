"use client";

import MessagesTab from "../../dashboard/dealer/messages-tab";
import QuickReplyManager from "../../dashboard/messages/quick-reply-manager";
import { useShopCMS } from "../shop-context";

export default function ShopMessagesPage() {
  const { shop } = useShopCMS();
  const tier = shop?.plan_tier || "starter";
  const showQuickReplies = tier === "pro" || tier === "business";

  return (
    <div className="space-y-4">
      {showQuickReplies && <QuickReplyManager />}
      <MessagesTab shopMode />
    </div>
  );
}
