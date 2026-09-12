-- BuildTrack schema (PostgreSQL / Supabase)
-- ISO-8601 text timestamps (UTC); booleans as integer 0/1; money as double precision.
-- Mirrors the original SQLite schema; app-generated string IDs.

CREATE TABLE IF NOT EXISTS id_sequences (
  name    text PRIMARY KEY,
  current integer NOT NULL DEFAULT 0
);

-- Users & sessions
CREATE TABLE IF NOT EXISTS users (
  id            text PRIMARY KEY,
  email         text NOT NULL,
  email_lower   text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  display_name  text NOT NULL,
  avatar_url    text,
  created_at    text NOT NULL,
  updated_at    text NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_at   text NOT NULL,
  expires_at  text NOT NULL,
  revoked_at  text,
  user_agent  text,
  ip          text
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id         text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at text NOT NULL,
  used_at    text
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id              text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme                text NOT NULL DEFAULT 'light',
  dark_theme           text NOT NULL DEFAULT 'warm',
  accent               text NOT NULL DEFAULT 'terracotta',
  font                 text NOT NULL DEFAULT 'IBM Plex Sans',
  density              text NOT NULL DEFAULT 'comfortable',
  sidebar_behavior     text NOT NULL DEFAULT 'expanded',
  default_project_page text NOT NULL DEFAULT 'overview',
  table_density        text NOT NULL DEFAULT 'comfortable',
  profile_visibility   text NOT NULL DEFAULT 'members',
  show_online          integer NOT NULL DEFAULT 1,
  show_last_active     integer NOT NULL DEFAULT 1,
  font_scale           double precision NOT NULL DEFAULT 1.0,
  high_contrast        integer NOT NULL DEFAULT 0,
  reduced_motion       integer NOT NULL DEFAULT 0,
  screen_reader_hint   integer NOT NULL DEFAULT 0,
  language             text NOT NULL DEFAULT 'en',
  region               text NOT NULL DEFAULT 'PH',
  updated_at           text NOT NULL
);
-- Backfill for databases created before dark_theme existed (idempotent).
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS dark_theme text NOT NULL DEFAULT 'warm';

-- Projects, membership, invitations
CREATE TABLE IF NOT EXISTS projects (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  type            text NOT NULL DEFAULT 'custom',
  location        text,
  status          text NOT NULL DEFAULT 'planning',
  progress_method text NOT NULL DEFAULT 'budget_weighted',
  created_by      text NOT NULL REFERENCES users(id),
  created_at      text NOT NULL,
  updated_at      text NOT NULL
);

CREATE TABLE IF NOT EXISTS project_members (
  id         text PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       text NOT NULL,
  added_by   text REFERENCES users(id),
  created_at text NOT NULL,
  UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);

CREATE TABLE IF NOT EXISTS project_invitations (
  id              text PRIMARY KEY,
  project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invitee_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inviter_user_id text NOT NULL REFERENCES users(id),
  proposed_role   text NOT NULL,
  state           text NOT NULL DEFAULT 'pending',
  expires_at      text,
  created_at      text NOT NULL,
  updated_at      text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invites_invitee ON project_invitations(invitee_user_id, state);
CREATE INDEX IF NOT EXISTS idx_invites_project ON project_invitations(project_id, state);

-- Project breakdown tree
CREATE TABLE IF NOT EXISTS project_components (
  id              text PRIMARY KEY,
  project_id      text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id       text REFERENCES project_components(id) ON DELETE CASCADE,
  name            text NOT NULL,
  component_type  text NOT NULL DEFAULT 'custom',
  sort_order      integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'planning',
  progress        double precision NOT NULL DEFAULT 0,
  weight          double precision NOT NULL DEFAULT 1,
  approved_budget double precision NOT NULL DEFAULT 0,
  start_date      text,
  end_date        text,
  created_at      text NOT NULL,
  updated_at      text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_components_tree ON project_components(project_id, parent_id, sort_order);

-- Materials & transactional inventory
CREATE TABLE IF NOT EXISTS materials (
  id           text PRIMARY KEY,
  component_id text NOT NULL REFERENCES project_components(id) ON DELETE CASCADE,
  name         text NOT NULL,
  description  text,
  category     text,
  unit         text NOT NULL DEFAULT 'unit',
  unit_cost    double precision NOT NULL DEFAULT 0,
  supplier     text,
  status       text NOT NULL DEFAULT 'active',
  total_needed double precision NOT NULL DEFAULT 0,
  notes        text,
  created_by   text NOT NULL REFERENCES users(id),
  created_at   text NOT NULL,
  updated_at   text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_materials_component ON materials(component_id);

CREATE TABLE IF NOT EXISTS material_transactions (
  id                text PRIMARY KEY,
  material_id       text NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  type              text NOT NULL,
  quantity          double precision NOT NULL,
  from_component_id text REFERENCES project_components(id),
  to_component_id   text REFERENCES project_components(id),
  reason            text,
  created_by        text NOT NULL REFERENCES users(id),
  created_at        text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_txn_material ON material_transactions(material_id, created_at);

-- Budget
CREATE TABLE IF NOT EXISTS expenses (
  id           text PRIMARY KEY,
  component_id text NOT NULL REFERENCES project_components(id) ON DELETE CASCADE,
  amount       double precision NOT NULL,
  category     text NOT NULL DEFAULT 'materials',
  description  text,
  spent_on     text NOT NULL,
  created_by   text NOT NULL REFERENCES users(id),
  created_at   text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_expenses_component ON expenses(component_id);

CREATE TABLE IF NOT EXISTS budget_changes (
  id              text PRIMARY KEY,
  component_id    text NOT NULL REFERENCES project_components(id) ON DELETE CASCADE,
  previous_amount double precision NOT NULL,
  new_amount      double precision NOT NULL,
  difference      double precision NOT NULL,
  reason          text,
  changed_by      text NOT NULL REFERENCES users(id),
  created_at      text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_budget_changes_component ON budget_changes(component_id);

-- Schedule
CREATE TABLE IF NOT EXISTS schedule_activities (
  id           text PRIMARY KEY,
  component_id text NOT NULL REFERENCES project_components(id) ON DELETE CASCADE,
  name         text NOT NULL,
  start_date   text,
  end_date     text,
  status       text NOT NULL DEFAULT 'planned',
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   text NOT NULL,
  updated_at   text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_schedule_component ON schedule_activities(component_id, sort_order);

-- Personnel
CREATE TABLE IF NOT EXISTS personnel_assignments (
  id           text PRIMARY KEY,
  component_id text NOT NULL REFERENCES project_components(id) ON DELETE CASCADE,
  user_id      text REFERENCES users(id),
  person_name  text NOT NULL,
  site_role    text NOT NULL,
  is_lead      integer NOT NULL DEFAULT 0,
  start_date   text,
  end_date     text,
  created_by   text NOT NULL REFERENCES users(id),
  created_at   text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_personnel_component ON personnel_assignments(component_id);

-- Daily site records
CREATE TABLE IF NOT EXISTS daily_records (
  id             text PRIMARY KEY,
  project_id     text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_id   text REFERENCES project_components(id) ON DELETE CASCADE,
  record_date    text NOT NULL,
  work_completed text,
  materials_used text,
  people_present text,
  progress       double precision,
  issues         text,
  notes          text,
  created_by     text NOT NULL REFERENCES users(id),
  created_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_daily_project ON daily_records(project_id, record_date);
CREATE INDEX IF NOT EXISTS idx_daily_component ON daily_records(component_id, record_date);

-- Activity log / audit trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id             text PRIMARY KEY,
  project_id     text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  component_id   text REFERENCES project_components(id) ON DELETE SET NULL,
  actor_user_id  text NOT NULL REFERENCES users(id),
  action         text NOT NULL,
  entity_type    text NOT NULL,
  entity_id      text,
  before_json    text,
  after_json     text,
  created_at     text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_logs(project_id, created_at);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id text REFERENCES projects(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  is_read    integer NOT NULL DEFAULT 0,
  created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
