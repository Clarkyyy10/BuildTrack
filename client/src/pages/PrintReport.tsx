import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { BackLink, Button, ErrorState, ProgressBar, Spinner, StatusPill } from '../components/ui.js';
import { IconPrinter } from '../components/icons.js';
import { BrandMark } from '../components/Brand.js';
import { money, shortDate, titleCase, dateTime } from '../lib/format.js';

interface FullReport {
  generatedAt: string;
  project: { id: string; name: string; type: string; location: string | null; status: string; progress_method: string };
  overall: number;
  budget: { approved: number; spent: number; remaining: number; byCategory: Array<{ category: string; amount: number }> };
  components: Array<{ id: string; name: string; type: string; status: string; progress: number; approvedBudget: number; parentId: string | null }>;
  materials: Array<{ name: string; unit: string; category: string; total_needed: number; unit_cost: number; component: string }>;
  personnel: Array<{ person_name: string; site_role: string; is_lead: number; component: string }>;
  daily: Array<{ record_date: string; work_completed: string | null; issues: string | null; component: string | null }>;
}

export function PrintReport() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi<FullReport>(projectId ? `/projects/${projectId}/reports/full` : null);

  if (loading) return <Spinner label="Preparing report…" />;
  if (error || !data) return <ErrorState message={error ?? 'Could not load report.'} onRetry={reload} />;

  const p = data.project;

  return (
    <div className="print-doc">
      {/* Toolbar — hidden when printing */}
      <div className="no-print row-between" style={{ marginBottom: 20 }}>
        <BackLink label="Back to project" onClick={() => navigate(`/projects/${projectId}`)} />
        <Button onClick={() => window.print()}><IconPrinter size={16} />Print / Save as PDF</Button>
      </div>

      {/* Document header */}
      <div className="print-section" style={{ borderBottom: '2px solid var(--border-strong)', paddingBottom: 16, marginBottom: 24 }}>
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="row" style={{ gap: 8, marginBottom: 4 }}>
              <BrandMark size={22} radius={6} />
              <strong style={{ fontSize: '1.1rem' }}>BuildTrack</strong>
              <span className="muted">Project Report</span>
            </div>
            <h1 style={{ fontSize: '1.6rem' }}>{p.name}</h1>
            <p className="muted" style={{ fontSize: '0.9rem', marginTop: 4 }}>
              {titleCase(p.type)}{p.location ? ` · ${p.location}` : ''} · {p.id}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <StatusPill status={p.status} />
            <p className="muted" style={{ fontSize: '0.78rem', marginTop: 8 }}>Generated {dateTime(data.generatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <Section title="Summary">
        <div className="grid grid-4">
          <SummaryStat label="Overall Progress" value={`${data.overall}%`} />
          <SummaryStat label="Approved Budget" value={money(data.budget.approved)} />
          <SummaryStat label="Spent" value={money(data.budget.spent)} />
          <SummaryStat label="Remaining" value={money(data.budget.remaining)} />
        </div>
        <div style={{ marginTop: 16, maxWidth: 400 }}><ProgressBar value={data.overall} /></div>
      </Section>

      {/* Breakdown */}
      <Section title={`Project Breakdown (${data.components.length} components)`}>
        <table>
          <thead><tr><th>Component</th><th>Type</th><th>Status</th><th>Approved</th><th>Progress</th></tr></thead>
          <tbody>
            {data.components.map((c) => (
              <tr key={c.id}>
                <td style={{ paddingLeft: c.parentId ? 24 : 14 }}>{c.parentId ? '└ ' : ''}{c.name}</td>
                <td>{c.type}</td>
                <td>{titleCase(c.status)}</td>
                <td>{money(c.approvedBudget)}</td>
                <td>{c.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Budget breakdown */}
      <Section title="Budget by Category">
        {data.budget.byCategory.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>Category</th><th>Amount</th><th>% of Spent</th></tr></thead>
            <tbody>
              {data.budget.byCategory.map((b) => (
                <tr key={b.category}><td>{titleCase(b.category)}</td><td>{money(b.amount)}</td><td>{data.budget.spent > 0 ? Math.round((b.amount / data.budget.spent) * 100) : 0}%</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Materials */}
      <Section title={`Materials (${data.materials.length})`}>
        {data.materials.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>Material</th><th>Component</th><th>Category</th><th>Total Needed</th><th>Unit Cost</th></tr></thead>
            <tbody>
              {data.materials.map((m, i) => (
                <tr key={i}><td>{m.name}</td><td>{m.component}</td><td>{m.category}</td><td>{m.total_needed} {m.unit}</td><td>{money(m.unit_cost)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Personnel */}
      <Section title={`Personnel (${data.personnel.length})`}>
        {data.personnel.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Lead</th><th>Component</th></tr></thead>
            <tbody>
              {data.personnel.map((pe, i) => (
                <tr key={i}><td>{pe.person_name}</td><td>{pe.site_role}</td><td>{pe.is_lead ? 'Yes' : '—'}</td><td>{pe.component}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Daily records */}
      <Section title={`Daily Records (${data.daily.length})`}>
        {data.daily.length === 0 ? <Empty /> : (
          <table>
            <thead><tr><th>Date</th><th>Component</th><th>Work completed</th><th>Issues</th></tr></thead>
            <tbody>
              {data.daily.map((d, i) => (
                <tr key={i}><td>{shortDate(d.record_date)}</td><td>{d.component ?? '—'}</td><td>{d.work_completed ?? '—'}</td><td>{d.issues ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <p className="muted no-print" style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: 24 }}>
        Tip: in the print dialog choose "Save as PDF" as the destination to export a file.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="print-section" style={{ marginBottom: 28 }}>
      <h3 style={{ marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>{title}</h3>
      {children}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function Empty() {
  return <p className="muted" style={{ fontSize: '0.88rem' }}>Nothing recorded.</p>;
}
