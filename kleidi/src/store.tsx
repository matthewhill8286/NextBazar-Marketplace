import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DealStatus, ItemStatus, Locale, MemberRole } from "../types";
import {
  SAMPLE_DEAL,
  seedItems,
  type DealRecord,
  type Member,
  type VaultDoc,
} from "./data";

const STORAGE_KEY = "kleidi.demo.v1";

export type RoleView = Extract<MemberRole, "buyer" | "lawyer">;

type Store = {
  locale: Locale;
  role: RoleView;
  deals: DealRecord[];
  setLocale: (locale: Locale) => void;
  setRole: (role: RoleView) => void;
  getDeal: (id: string) => DealRecord | undefined;
  createDraft: (input: Omit<DealRecord, "id" | "status" | "deedStatus" | "items" | "documents" | "createdAt" | "members"> & { buyerName: string }) => string;
  markPaid: (id: string) => void;
  cycleItem: (dealId: string, key: string) => void;
  setItemNote: (dealId: string, key: string, note: string) => void;
  inviteLawyer: (dealId: string, name: string) => void;
  addDocument: (dealId: string, doc: Omit<VaultDoc, "id" | "createdAt" | "uploadedBy">) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

type Persist = {
  locale: Locale;
  role: RoleView;
  deals: DealRecord[];
};

function initial(): Persist {
  return {
    locale: "en",
    role: "buyer",
    deals: [structuredClone(SAMPLE_DEAL)],
  };
}

function load(): Persist {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial();
    const parsed = JSON.parse(raw) as Persist;
    if (!Array.isArray(parsed.deals) || parsed.deals.length === 0) return initial();
    return {
      locale: parsed.locale === "el" ? "el" : "en",
      role: parsed.role === "lawyer" ? "lawyer" : "buyer",
      deals: parsed.deals,
    };
  } catch {
    return initial();
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [role, setRole] = useState<RoleView>("buyer");
  const [deals, setDeals] = useState<DealRecord[]>([SAMPLE_DEAL]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = load();
    setLocale(next.locale);
    setRole(next.role);
    setDeals(next.deals);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ locale, role, deals } satisfies Persist),
    );
  }, [locale, role, deals, ready]);

  const value = useMemo<Store>(
    () => ({
      locale,
      role,
      deals,
      setLocale: (next) => setLocale(next === "el" ? "el" : "en"),
      setRole,
      getDeal: (id) => deals.find((d) => d.id === id),
      createDraft: (input) => {
        const id = crypto.randomUUID();
        const buyer: Member = {
          id: `buyer-${id.slice(0, 8)}`,
          name: input.buyerName || "You",
          role: "buyer",
          locale: "en",
        };
        const deal: DealRecord = {
          id,
          status: "draft",
          deedStatus: "unknown",
          country: input.country,
          city: input.city,
          locality: input.locality,
          addressLine: input.addressLine,
          plotOrRegNo: input.plotOrRegNo,
          propertyType: input.propertyType,
          askingPriceEur: input.askingPriceEur,
          developerName: input.developerName,
          members: [buyer],
          items: seedItems(),
          documents: [],
          createdAt: new Date().toISOString(),
        };
        setDeals((prev) => [deal, ...prev]);
        return id;
      },
      markPaid: (id) => {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === id && d.status === "draft"
              ? { ...d, status: "active" satisfies DealStatus }
              : d,
          ),
        );
      },
      cycleItem: (dealId, key) => {
        setDeals((prev) =>
          prev.map((d) => {
            if (d.id !== dealId) return d;
            const items = d.items.map((item) => {
              if (item.key !== key) return item;
              const order: ItemStatus[] = [
                "todo",
                "in_review",
                "done",
                "blocked",
                "na",
              ];
              const i = order.indexOf(item.status);
              return { ...item, status: order[(i + 1) % order.length] };
            });
            const titleStatus = items.find((x) => x.key === "title_deed")?.status;
            return {
              ...d,
              items,
              deedStatus:
                key === "title_deed"
                  ? syncDeed(titleStatus, d.deedStatus)
                  : d.deedStatus,
            };
          }),
        );
      },
      setItemNote: (dealId, key, note) => {
        setDeals((prev) =>
          prev.map((d) =>
            d.id !== dealId
              ? d
              : {
                  ...d,
                  items: d.items.map((item) =>
                    item.key === key ? { ...item, note } : item,
                  ),
                },
          ),
        );
      },
      inviteLawyer: (dealId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setDeals((prev) =>
          prev.map((d) => {
            if (d.id !== dealId) return d;
            if (d.members.some((m) => m.role === "lawyer")) {
              return {
                ...d,
                members: d.members.map((m) =>
                  m.role === "lawyer" ? { ...m, name: trimmed } : m,
                ),
              };
            }
            return {
              ...d,
              members: [
                ...d.members,
                {
                  id: `lawyer-${crypto.randomUUID().slice(0, 8)}`,
                  name: trimmed,
                  role: "lawyer",
                  locale: "el",
                  city: "Nicosia",
                },
              ],
            };
          }),
        );
      },
      addDocument: (dealId, doc) => {
        setDeals((prev) =>
          prev.map((d) => {
            if (d.id !== dealId) return d;
            const uploader =
              d.members.find((m) => m.role === role)?.name ?? "You";
            return {
              ...d,
              documents: [
                {
                  ...doc,
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  uploadedBy: uploader,
                },
                ...d.documents,
              ],
            };
          }),
        );
      },
      reset: () => {
        const next = initial();
        setLocale(next.locale);
        setRole(next.role);
        setDeals(next.deals);
      },
    }),
    [locale, role, deals],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function syncDeed(
  itemStatus: ItemStatus | undefined,
  current: DealRecord["deedStatus"],
): DealRecord["deedStatus"] {
  if (itemStatus === "blocked") return "trapped";
  if (itemStatus === "done") return "issued";
  if (itemStatus === "in_review") return "pending";
  return current === "issued" ? "unknown" : current;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
