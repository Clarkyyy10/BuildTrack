import { exec, closeDb } from './connection.js';
import { hashPassword } from '../lib/password.js';
import { nowIso } from '../lib/time.js';
import { newComponentId, newMaterialId, newExpenseId, newTxnId, randomId } from '../lib/ids.js';

const TABLES = [
  'material_transactions', 'materials', 'expenses', 'budget_changes',
  'schedule_activities', 'personnel_assignments', 'daily_records',
  'audit_logs', 'notifications', 'project_invitations', 'project_members',
  'project_components', 'projects', 'password_resets', 'sessions',
  'user_settings', 'users', 'id_sequences',
];

async function seed(): Promise<void> {
  const ts = nowIso();

  await exec(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);

  // Demo user (mockup identity USR-000587); advance the sequence so future signups continue.
  const clarkId = 'USR-000587';
  const { hash, salt } = hashPassword('password123');
  await exec(
    `INSERT INTO users (id, email, email_lower, password_hash, password_salt, display_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [clarkId, 'clark@buildtrack.test', 'clark@buildtrack.test', hash, salt, 'Clark Santos', ts, ts],
  );
  await exec("INSERT INTO id_sequences (name, current) VALUES ('user', 587)");
  await exec('INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)', [clarkId, ts]);

  // Project
  const projectId = 'PRJ-000001';
  await exec("INSERT INTO id_sequences (name, current) VALUES ('project', 1)");
  await exec(
    `INSERT INTO projects (id, name, type, location, status, progress_method, created_by, created_at, updated_at)
     VALUES (?, 'Riverside Residence', 'residential', 'Antipolo, Rizal', 'active', 'budget_weighted', ?, ?, ?)`,
    [projectId, clarkId, ts, ts],
  );
  await exec(
    `INSERT INTO project_members (id, project_id, user_id, role, added_by, created_at)
     VALUES (?, ?, ?, 'project_manager', ?, ?)`,
    [randomId(), projectId, clarkId, clarkId, ts],
  );

  // Breakdown tree
  await exec("INSERT INTO id_sequences (name, current) VALUES ('component', 0)");
  let order = 0;
  const addComponent = async (
    parentId: string | null,
    name: string,
    type: string,
    opts: { progress?: number; budget?: number; status?: string } = {},
  ): Promise<string> => {
    const id = await newComponentId();
    await exec(
      `INSERT INTO project_components
         (id, project_id, parent_id, name, component_type, sort_order, status, progress, weight, approved_budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [id, projectId, parentId, name, type, order++, opts.status ?? 'planning', opts.progress ?? 0, opts.budget ?? 0, ts, ts],
    );
    return id;
  };

  const firstFloor = await addComponent(null, '1st Floor', 'floor', { progress: 45, status: 'in_progress', budget: 40000 });
  await addComponent(null, '2nd Floor', 'floor', { progress: 20, budget: 35000, status: 'in_progress' });
  await addComponent(null, '3rd Floor', 'floor', { progress: 0, budget: 30000 });
  await addComponent(null, 'Roof', 'phase', { progress: 0, budget: 15000 });
  await addComponent(null, 'Foundation', 'phase', { progress: 100, budget: 25000, status: 'completed' });
  await addComponent(null, 'Exterior', 'trade', { progress: 10, budget: 18000 });
  await addComponent(null, 'Electrical', 'trade', { progress: 30, budget: 20000, status: 'in_progress' });
  await addComponent(null, 'Plumbing', 'trade', { progress: 25, budget: 16000, status: 'in_progress' });
  await addComponent(null, 'HVAC', 'trade', { progress: 5, budget: 12000 });

  const livingRoom = await addComponent(firstFloor, 'Living Room', 'room', { progress: 70, budget: 8500, status: 'in_progress' });
  await addComponent(firstFloor, 'Kitchen', 'room', { progress: 40, budget: 9000, status: 'in_progress' });
  await addComponent(firstFloor, 'Bedroom 1', 'room', { progress: 30, budget: 7000 });
  await addComponent(firstFloor, 'Bedroom 2', 'room', { progress: 25, budget: 7000 });
  await addComponent(firstFloor, 'Bathroom', 'room', { progress: 50, budget: 5000, status: 'in_progress' });

  // Living Room materials + transactions
  const materials: Array<[string, string, string, number, number, number]> = [
    ['Cement', 'materials', 'bags', 250, 50, 5],
    ['Concrete Mix', 'materials', 'bags', 180, 20, 2],
    ['Steel Bars', 'materials', 'pcs', 320, 100, 10],
    ['Wood Planks', 'materials', 'pcs', 90, 200, 15],
    ['Paint', 'materials', 'cans', 650, 10, 1],
    ['Tiles', 'materials', 'pcs', 45, 150, 12],
  ];
  for (const [name, category, unit, unitCost, total, usedToday] of materials) {
    const matId = await newMaterialId();
    await exec(
      `INSERT INTO materials (id, component_id, name, category, unit, unit_cost, supplier, status, total_needed, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Rizal Builders Supply', 'active', ?, ?, ?, ?)`,
      [matId, livingRoom, name, category, unit, unitCost, total, clarkId, ts, ts],
    );
    await exec(
      `INSERT INTO material_transactions (id, material_id, type, quantity, created_by, created_at) VALUES (?, ?, 'receive', ?, ?, ?)`,
      [await newTxnId(), matId, total, clarkId, ts],
    );
    await exec(
      `INSERT INTO material_transactions (id, material_id, type, quantity, created_by, created_at) VALUES (?, ?, 'use', ?, ?, ?)`,
      [await newTxnId(), matId, usedToday, clarkId, ts],
    );
  }

  // Living Room budget: approved 8500, expenses total 5950
  const expenses: Array<[string, number]> = [
    ['materials', 3300], ['labor', 1500], ['equipment', 600], ['misc', 550],
  ];
  for (const [category, amount] of expenses) {
    await exec(
      `INSERT INTO expenses (id, component_id, amount, category, description, spent_on, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, '2025-05-10', ?, ?)`,
      [await newExpenseId(), livingRoom, amount, category, `${category} spend`, clarkId, ts],
    );
  }
  await exec(
    `INSERT INTO budget_changes (id, component_id, previous_amount, new_amount, difference, reason, changed_by, created_at)
     VALUES (?, ?, 8000, 8500, 500, 'Additional approved finishing work', ?, ?)`,
    [randomId(), livingRoom, clarkId, ts],
  );

  // Living Room schedule
  const activities: Array<[string, string, string, string]> = [
    ['Demolition', '2025-05-05', '2025-05-06', 'completed'],
    ['Framing', '2025-05-06', '2025-05-08', 'completed'],
    ['Electrical', '2025-05-06', '2025-05-10', 'in_progress'],
    ['Plumbing', '2025-05-08', '2025-05-11', 'planned'],
    ['Walls & Ceiling', '2025-05-10', '2025-05-12', 'planned'],
    ['Flooring', '2025-05-12', '2025-05-14', 'planned'],
    ['Painting', '2025-05-13', '2025-05-15', 'planned'],
  ];
  let sOrder = 0;
  for (const [name, start, end, status] of activities) {
    await exec(
      `INSERT INTO schedule_activities (id, component_id, name, start_date, end_date, status, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomId(), livingRoom, name, start, end, status, sOrder++, ts, ts],
    );
  }
  await exec('UPDATE project_components SET start_date = ?, end_date = ? WHERE id = ?', ['2025-05-05', '2025-05-15', livingRoom]);

  // Living Room personnel
  const personnel: Array<[string, string, number]> = [
    ['Juan Dela Cruz', 'Electrician', 1],
    ['Maria Santos', 'Helper', 0],
    ['Ramon Reyes', 'Laborer', 0],
    ['Ella Garcia', 'Apprentice', 0],
  ];
  for (const [name, role, lead] of personnel) {
    await exec(
      `INSERT INTO personnel_assignments (id, component_id, person_name, site_role, is_lead, start_date, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, '2025-05-06', ?, ?)`,
      [randomId(), livingRoom, name, role, lead, clarkId, ts],
    );
  }

  // A daily site record
  await exec(
    `INSERT INTO daily_records (id, project_id, component_id, record_date, work_completed, materials_used, people_present, progress, issues, notes, created_by, created_at)
     VALUES (?, ?, ?, '2025-05-08', ?, ?, ?, 70, ?, ?, ?, ?)`,
    [
      randomId(), projectId, livingRoom,
      'Electrical rough-in continued; conduit runs completed in living room.',
      'Cement 5 bags, Steel Bars 10 pcs, Wood Planks 15 pcs',
      'Juan Dela Cruz, Maria Santos, Ramon Reyes, Ella Garcia',
      'Minor delay waiting on lighting fixtures delivery.',
      'Overall on track for the week.',
      clarkId, ts,
    ],
  );

  console.log('Seed complete on Supabase.');
  console.log('  Demo login: clark@buildtrack.test / password123  (User ID USR-000587)');
  console.log('  Project: Riverside Residence (PRJ-000001)');
  await closeDb();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
