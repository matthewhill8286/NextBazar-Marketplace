-- Kleidi — Cyprus property closing workspace (not a classifieds site).
-- One paid deal = one plot/unit. No public listing feed.

create type kleidi_role as enum ('buyer', 'lawyer', 'surveyor', 'agent');
create type kleidi_deal_status as enum (
  'draft',
  'paid',
  'active',
  'blocked',
  'closed'
);
create type kleidi_deed_status as enum (
  'unknown',
  'issued',
  'pending',
  'trapped'
);
create type kleidi_item_status as enum (
  'todo',
  'in_review',
  'done',
  'blocked',
  'na'
);
create type kleidi_payment_status as enum (
  'requires_payment',
  'paid',
  'refunded',
  'failed'
);

create table kleidi_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  locale text not null default 'en' check (locale in ('en', 'el', 'ru')),
  phone text,
  created_at timestamptz not null default now()
);

-- Curated roster. Not an open marketplace.
create table kleidi_specialists (
  id uuid primary key default gen_random_uuid(),
  role kleidi_role not null check (role in ('lawyer', 'surveyor', 'agent')),
  full_name text not null,
  firm text,
  city text not null,
  languages text[] not null default array['en', 'el'],
  active boolean not null default true
);

create table kleidi_deals (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references kleidi_profiles (id),
  status kleidi_deal_status not null default 'draft',
  deed_status kleidi_deed_status not null default 'unknown',
  -- Property
  country text not null default 'CY' check (country in ('CY', 'GR')),
  city text not null,
  locality text,
  address_line text,
  plot_or_reg_no text,
  property_type text check (
    property_type in ('apartment', 'house', 'plot', 'off_plan')
  ),
  asking_price_eur integer,
  developer_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table kleidi_deal_members (
  deal_id uuid not null references kleidi_deals (id) on delete cascade,
  profile_id uuid not null references kleidi_profiles (id) on delete cascade,
  role kleidi_role not null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (deal_id, profile_id)
);

create table kleidi_checklist_items (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references kleidi_deals (id) on delete cascade,
  sort_order smallint not null,
  -- Seeded from template; bilingual so a UK buyer can read a Greek PDF label.
  key text not null,
  label_en text not null,
  label_el text not null,
  help_en text,
  help_el text,
  status kleidi_item_status not null default 'todo',
  evidence_document_id uuid,
  updated_by uuid references kleidi_profiles (id),
  updated_at timestamptz not null default now(),
  unique (deal_id, key)
);

create table kleidi_documents (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references kleidi_deals (id) on delete cascade,
  uploaded_by uuid not null references kleidi_profiles (id),
  checklist_key text,
  title text not null,
  storage_path text not null,
  mime_type text not null,
  byte_size integer not null,
  created_at timestamptz not null default now()
);

alter table kleidi_checklist_items
  add constraint kleidi_checklist_evidence_fk
  foreign key (evidence_document_id) references kleidi_documents (id)
  on delete set null;

create table kleidi_payments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references kleidi_deals (id) on delete cascade,
  payer_id uuid not null references kleidi_profiles (id),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  amount_eur_cents integer not null,
  currency text not null default 'eur',
  status kleidi_payment_status not null default 'requires_payment',
  paid_at timestamptz
);

-- Copy onto each new deal in the API, do not join at runtime.
create table kleidi_checklist_templates (
  key text primary key,
  sort_order smallint not null,
  label_en text not null,
  label_el text not null,
  help_en text,
  help_el text
);

insert into kleidi_checklist_templates
  (key, sort_order, label_en, label_el, help_en, help_el)
values
  (
    'title_deed',
    10,
    'Title deed status',
    'Κατάσταση τίτλου ιδιοκτησίας',
    'Issued, pending at Land Registry, or trapped with the developer.',
    'Εκδοθείς, σε εκκρεμότητα στο Κτηματολόγιο, ή δεσμευμένος στον εργολάβο.'
  ),
  (
    'planning_zone',
    20,
    'Planning / zoning',
    'Πολεοδομική ζώνη',
    'Confirm the plot can legally be used as sold (residential vs agricultural).',
    'Επιβεβαιώστε ότι το τεμάχιο μπορεί νόμιμα να χρησιμοποιηθεί ως πωλείται.'
  ),
  (
    'encumbrances',
    30,
    'Charges and encumbrances',
    'Βάρη και δεσμεύσεις',
    'Mortgages, memos, court charges on the specific registration.',
    'Υποθήκες, memos, δικαστικά βάρη στο συγκεκριμένο ακίνητο.'
  ),
  (
    'contract',
    40,
    'Sale contract',
    'Συμβόλαιο πώλησης',
    'Bilingual or certified translation. Payment schedule if off-plan.',
    'Δίγλωσσο ή επίσημη μετάφραση. Χρονοδιάγραμμα πληρωμών αν είναι off-plan.'
  ),
  (
    'deposited_contract',
    50,
    'Contract deposited at Land Registry',
    'Κατάθεση συμβολαίου στο Κτηματολόγιο',
    'Specific performance protection under Cypriot law.',
    'Προστασία ειδικής εκτέλεσης κατά το κυπριακό δίκαιο.'
  ),
  (
    'developer',
    60,
    'Developer / seller identity',
    'Ταυτότητα εργολάβου / πωλητή',
    'Company search, previous trapped-buyer pattern, guarantees.',
    'Έρευνα εταιρείας, ιστορικό εγκλωβισμένων αγοραστών, εγγυήσεις.'
  ),
  (
    'utilities',
    70,
    'Utilities and common expenses',
    'Κοινόχρηστα και υπηρεσίες',
    'EAC, water, management committee arrears.',
    'ΑΗΚ, νερό, οφειλές διαχειριστικής επιτροπής.'
  ),
  (
    'funds',
    80,
    'Where the money sits',
    'Πού βρίσκονται τα χρήματα',
    'Lawyer client account vs developer account vs escrow.',
    'Λογαριασμός δικηγόρου vs εργολάβου vs μεσεγγύηση.'
  );

alter table kleidi_deals enable row level security;
alter table kleidi_deal_members enable row level security;
alter table kleidi_checklist_items enable row level security;
alter table kleidi_documents enable row level security;
alter table kleidi_payments enable row level security;

create policy kleidi_member_read_deals on kleidi_deals
  for select using (
    exists (
      select 1 from kleidi_deal_members m
      where m.deal_id = id and m.profile_id = auth.uid()
    )
  );

create policy kleidi_member_read_items on kleidi_checklist_items
  for select using (
    exists (
      select 1 from kleidi_deal_members m
      where m.deal_id = kleidi_checklist_items.deal_id
        and m.profile_id = auth.uid()
    )
  );
