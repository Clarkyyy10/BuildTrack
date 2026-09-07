export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Settings {
  user_id: string;
  theme: string;
  accent: string;
  font: string;
  density: string;
  sidebar_behavior: string;
  default_project_page: string;
  table_density: string;
  profile_visibility: string;
  show_online: number;
  show_last_active: number;
  font_scale: number;
  high_contrast: number;
  reduced_motion: number;
  screen_reader_hint: number;
  language: string;
  region: string;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  location: string | null;
  status: string;
  progressMethod: string;
  progress: number;
  budget: { approved: number; spent: number; remaining: number };
  role: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentNode {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  status: string;
  sortOrder: number;
  progress: number;
  directProgress: number;
  approvedBudget: number;
  startDate: string | null;
  endDate: string | null;
  children: ComponentNode[];
}

export interface BudgetSummary {
  approved: number;
  spent: number;
  remaining: number;
  percentSpent: number;
  status: 'on_track' | 'over_budget';
  breakdown: Array<{ category: string; amount: number; percent: number }>;
}

export interface ComponentDetail {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  type: string;
  status: string;
  progress: number;
  directProgress: number;
  startDate: string | null;
  endDate: string | null;
  teamCount: number;
  materialCount: number;
  budget: BudgetSummary;
}

export interface MaterialSummary {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  unitCost: number;
  supplier: string | null;
  status: string;
  totalNeeded: number;
  received: number;
  used: number;
  waste: number;
  usedToday: number;
  remaining: number;
}

export interface Personnel {
  id: string;
  userId: string | null;
  name: string;
  role: string;
  isLead: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface ScheduleActivity {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

export interface ActivityEntry {
  id: string;
  componentName: string | null;
  action: string;
  entityType: string;
  actorName: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  projectId: string | null;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  role: string;
  state: string;
  createdAt: string;
}
