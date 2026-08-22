import type {
  DeedStatus,
  DealStatus,
  ItemStatus,
  Locale,
  MemberRole,
} from "../types";

export type Member = {
  id: string;
  name: string;
  role: MemberRole;
  locale: Locale;
  firm?: string;
  city?: string;
};

export type ChecklistRow = {
  key: string;
  sortOrder: number;
  label: { en: string; el: string };
  help: { en: string; el: string };
  status: ItemStatus;
  note: string;
};

export type VaultDoc = {
  id: string;
  title: string;
  checklistKey: string | null;
  uploadedBy: string;
  mimeType: string;
  byteSize: number;
  createdAt: string;
};

export type DealRecord = {
  id: string;
  status: DealStatus;
  deedStatus: DeedStatus;
  country: "CY" | "GR";
  city: string;
  locality: string;
  addressLine: string;
  plotOrRegNo: string;
  propertyType: "apartment" | "house" | "plot" | "off_plan";
  askingPriceEur: number;
  developerName: string;
  members: Member[];
  items: ChecklistRow[];
  documents: VaultDoc[];
  createdAt: string;
};

export const CHECKLIST_TEMPLATE: Omit<ChecklistRow, "status" | "note">[] = [
  {
    key: "title_deed",
    sortOrder: 10,
    label: {
      en: "Title deed status",
      el: "Κατάσταση τίτλου ιδιοκτησίας",
    },
    help: {
      en: "Issued, pending at Land Registry, or trapped with the developer.",
      el: "Εκδοθείς, σε εκκρεμότητα στο Κτηματολόγιο, ή δεσμευμένος στον εργολάβο.",
    },
  },
  {
    key: "planning_zone",
    sortOrder: 20,
    label: {
      en: "Planning / zoning",
      el: "Πολεοδομική ζώνη",
    },
    help: {
      en: "Confirm the plot can legally be used as sold (residential vs agricultural).",
      el: "Επιβεβαιώστε ότι το τεμάχιο μπορεί νόμιμα να χρησιμοποιηθεί ως πωλείται.",
    },
  },
  {
    key: "encumbrances",
    sortOrder: 30,
    label: {
      en: "Charges and encumbrances",
      el: "Βάρη και δεσμεύσεις",
    },
    help: {
      en: "Mortgages, memos, court charges on the specific registration.",
      el: "Υποθήκες, memos, δικαστικά βάρη στο συγκεκριμένο ακίνητο.",
    },
  },
  {
    key: "contract",
    sortOrder: 40,
    label: {
      en: "Sale contract",
      el: "Συμβόλαιο πώλησης",
    },
    help: {
      en: "Bilingual or certified translation. Payment schedule if off-plan.",
      el: "Δίγλωσσο ή επίσημη μετάφραση. Χρονοδιάγραμμα πληρωμών αν είναι off-plan.",
    },
  },
  {
    key: "deposited_contract",
    sortOrder: 50,
    label: {
      en: "Contract deposited at Land Registry",
      el: "Κατάθεση συμβολαίου στο Κτηματολόγιο",
    },
    help: {
      en: "Specific performance protection. If this slips, the seller can sell twice.",
      el: "Προστασία ειδικής εκτέλεσης. Αν καθυστερήσει, ο πωλητής μπορεί να πουλήσει δύο φορές.",
    },
  },
  {
    key: "developer",
    sortOrder: 60,
    label: {
      en: "Developer / seller identity",
      el: "Ταυτότητα εργολάβου / πωλητή",
    },
    help: {
      en: "Company search, previous trapped-buyer pattern, guarantees.",
      el: "Έρευνα εταιρείας, ιστορικό εγκλωβισμένων αγοραστών, εγγυήσεις.",
    },
  },
  {
    key: "utilities",
    sortOrder: 70,
    label: {
      en: "Utilities and common expenses",
      el: "Κοινόχρηστα και υπηρεσίες",
    },
    help: {
      en: "EAC, water, management committee arrears.",
      el: "ΑΗΚ, νερό, οφειλές διαχειριστικής επιτροπής.",
    },
  },
  {
    key: "funds",
    sortOrder: 80,
    label: {
      en: "Where the money sits",
      el: "Πού βρίσκονται τα χρήματα",
    },
    help: {
      en: "Lawyer client account vs developer account vs escrow. Do not send the next tranche until this is clear.",
      el: "Λογαριασμός δικηγόρου vs εργολάβου vs μεσεγγύηση. Μην στείλετε την επόμενη δόση αν αυτό δεν είναι σαφές.",
    },
  },
];

export function seedItems(
  overrides: Partial<Record<string, { status: ItemStatus; note: string }>> = {},
): ChecklistRow[] {
  return CHECKLIST_TEMPLATE.map((row) => ({
    ...row,
    status: overrides[row.key]?.status ?? "todo",
    note: overrides[row.key]?.note ?? "",
  }));
}

export const SAMPLE_DEAL_ID = "demo-cap-st-george";

export const SAMPLE_DEAL: DealRecord = {
  id: SAMPLE_DEAL_ID,
  status: "active",
  deedStatus: "trapped",
  country: "CY",
  city: "Paphos",
  locality: "Peyia",
  addressLine: "Cap St. George, villa 12",
  plotOrRegNo: "Sheet 45, plot 218",
  propertyType: "off_plan",
  askingPriceEur: 890_000,
  developerName: "Helios Coast Ltd",
  createdAt: "2026-03-12T09:00:00.000Z",
  members: [
    {
      id: "buyer-james",
      name: "James Hart",
      role: "buyer",
      locale: "en",
      city: "London",
    },
    {
      id: "lawyer-andreas",
      name: "Andreas Ioannou",
      role: "lawyer",
      locale: "el",
      firm: "Nicosia boutique",
      city: "Nicosia",
    },
  ],
  items: seedItems({
    title_deed: {
      status: "blocked",
      note: "Individual title not issued. Charge still sits on the whole plot with the developer's bank.",
    },
    planning_zone: {
      status: "done",
      note: "Ka6 residential. Matches the brochure.",
    },
    encumbrances: {
      status: "in_review",
      note: "Land search 12 Mar 2026: developer mortgage on the mother plot. Memo for unpaid contractor alleged — waiting on confirmation.",
    },
    contract: {
      status: "done",
      note: "Signed EN + EL. 40% already paid. Next 20% on 'roof complete'.",
    },
    deposited_contract: {
      status: "todo",
      note: "",
    },
    funds: {
      status: "todo",
      note: "Developer has asked for the roof tranche to their company account.",
    },
  }),
  documents: [
    {
      id: "doc-1",
      title: "sale-agreement-el.pdf",
      checklistKey: "contract",
      uploadedBy: "Andreas Ioannou",
      mimeType: "application/pdf",
      byteSize: 1_240_000,
      createdAt: "2026-03-14T11:20:00.000Z",
    },
    {
      id: "doc-2",
      title: "sale-agreement-en.pdf",
      checklistKey: "contract",
      uploadedBy: "Andreas Ioannou",
      mimeType: "application/pdf",
      byteSize: 1_180_000,
      createdAt: "2026-03-14T11:21:00.000Z",
    },
    {
      id: "doc-3",
      title: "land-search-2026-03-12.pdf",
      checklistKey: "encumbrances",
      uploadedBy: "Andreas Ioannou",
      mimeType: "application/pdf",
      byteSize: 420_000,
      createdAt: "2026-03-12T16:04:00.000Z",
    },
    {
      id: "doc-4",
      title: "developer-invoice-roof.pdf",
      checklistKey: "funds",
      uploadedBy: "James Hart",
      mimeType: "application/pdf",
      byteSize: 88_000,
      createdAt: "2026-08-02T08:11:00.000Z",
    },
  ],
};

export const COPY = {
  en: {
    wordmark: "Kleidi",
    tagline: "One property. One closing file.",
    notAMarket: "Not a listings site. The buyer pays. The lawyer gets a free seat.",
    startFile: "Start a file",
    openSample: "Open the sample file",
    demoNote: "Weekend demo — stays in this browser. No Stripe, no accounts.",
    buyer: "Buyer",
    lawyer: "Lawyer",
    intakeTitle: "The property",
    intakeLead: "One plot or unit. You can invite the lawyer after you unlock the file.",
    payTitle: "Unlock this file",
    payLead: "Checklist, vault, and lawyer invite — for this property only.",
    payCta: "Pay €490 (demo)",
    paid: "Paid",
    workspace: "File",
    vault: "Vault",
    parties: "Parties",
    inviteLawyer: "Invite lawyer",
    invitePlaceholder: "Name, e.g. Melina",
    add: "Add",
    deed: "Title",
    trapped:
      "Title is not issued. Land Registry still has it with the developer. Do not send the next tranche to the developer account until the lawyer confirms the client account, and the sale contract is deposited.",
    pendingDeed: "Title is pending at Land Registry.",
    issuedDeed: "Title is issued.",
    unknownDeed: "Title status is unknown — this is the first thing to check.",
    cycleHint: "Click a row to cycle status. Lawyer view is how Melina would tick it.",
    vaultLead: "PDFs tied to a checklist row. No public links.",
    addDoc: "Add a file name",
    reset: "Reset demo",
    city: "City",
    locality: "Locality / area",
    address: "Address / unit",
    plot: "Sheet / plot / reg.",
    type: "Type",
    price: "Price (€)",
    developer: "Developer / seller",
    continue: "Continue to pay",
    empty: "No file with that id.",
    home: "Home",
    progress: "Checklist",
    moneyWarn: "Money path is not confirmed. Do not pay the developer directly.",
    depositWarn: "Sale contract is not deposited at Land Registry.",
  },
  el: {
    wordmark: "Κλειδί",
    tagline: "Ένα ακίνητο. Ένας φάκελος ολοκλήρωσης.",
    notAMarket:
      "Όχι αγγελίες. Πληρώνει ο αγοραστής. Ο δικηγόρος μπαίνει δωρεάν.",
    startFile: "Νέος φάκελος",
    openSample: "Δείγμα φακέλου",
    demoNote: "Demo — μένει σε αυτόν τον browser. Χωρίς Stripe, χωρίς λογαριασμούς.",
    buyer: "Αγοραστής",
    lawyer: "Δικηγόρος",
    intakeTitle: "Το ακίνητο",
    intakeLead: "Ένα τεμάχιο ή μονάδα. Τον δικηγόρο τον καλείτε αφού ξεκλειδώσετε τον φάκελο.",
    payTitle: "Ξεκλείδωμα φακέλου",
    payLead: "Λίστα, αρχείο εγγράφων, και πρόσκληση δικηγόρου — μόνο γι' αυτό το ακίνητο.",
    payCta: "Πληρωμή €490 (demo)",
    paid: "Πληρώθηκε",
    workspace: "Φάκελος",
    vault: "Έγγραφα",
    parties: "Μέρη",
    inviteLawyer: "Πρόσκληση δικηγόρου",
    invitePlaceholder: "Όνομα, π.χ. Μελίνα",
    add: "Προσθήκη",
    deed: "Τίτλος",
    trapped:
      "Ο τίτλος δεν έχει εκδοθεί. Παραμένει στον εργολάβο / Κτηματολόγιο. Μην στείλετε την επόμενη δόση στον εργολάβο μέχρι να επιβεβαιώσει ο δικηγόρος τον λογαριασμό πελάτη και να κατατεθεί το συμβόλαιο.",
    pendingDeed: "Ο τίτλος εκκρεμεί στο Κτηματολόγιο.",
    issuedDeed: "Ο τίτλος έχει εκδοθεί.",
    unknownDeed: "Άγνωστη κατάσταση τίτλου — αυτό ελέγχεται πρώτο.",
    cycleHint: "Κλικ στη γραμμή αλλάζει την κατάσταση. Η όψη δικηγόρου είναι πώς θα το τσεκάρει.",
    vaultLead: "PDF δεμένα σε γραμμή της λίστας. Χωρίς δημόσια links.",
    addDoc: "Προσθήκη ονόματος αρχείου",
    reset: "Επαναφορά demo",
    city: "Πόλη",
    locality: "Περιοχή",
    address: "Διεύθυνση / μονάδα",
    plot: "Φύλλο / τεμάχιο",
    type: "Τύπος",
    price: "Τιμή (€)",
    developer: "Εργολάβος / πωλητής",
    continue: "Συνέχεια στην πληρωμή",
    empty: "Δεν υπάρχει αυτός ο φάκελος.",
    home: "Αρχική",
    progress: "Λίστα ελέγχου",
    moneyWarn: "Δεν έχει επιβεβαιωθεί πού κάθονται τα χρήματα. Μην πληρώσετε απευθείας τον εργολάβο.",
    depositWarn: "Το συμβόλαιο δεν έχει κατατεθεί στο Κτηματολόγιο.",
  },
} as const;

export const STATUS_LABEL: Record<
  ItemStatus,
  { en: string; el: string }
> = {
  todo: { en: "To do", el: "Εκκρεμεί" },
  in_review: { en: "In review", el: "Σε έλεγχο" },
  done: { en: "Done", el: "Έγινε" },
  blocked: { en: "Blocked", el: "Μπλοκαρισμένο" },
  na: { en: "N/A", el: "Δ/Ε" },
};

export const DEED_LABEL: Record<DeedStatus, { en: string; el: string }> = {
  unknown: { en: "unknown", el: "άγνωστο" },
  issued: { en: "issued", el: "εκδοθείς" },
  pending: { en: "pending", el: "εκκρεμεί" },
  trapped: { en: "trapped", el: "δεσμευμένος" },
};

export const TYPE_LABEL: Record<
  DealRecord["propertyType"],
  { en: string; el: string }
> = {
  apartment: { en: "Apartment", el: "Διαμέρισμα" },
  house: { en: "House", el: "Κατοικία" },
  plot: { en: "Plot", el: "Οικόπεδο" },
  off_plan: { en: "Off-plan", el: "Off-plan" },
};

export function formatEur(n: number): string {
  return new Intl.NumberFormat("en-CY", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
