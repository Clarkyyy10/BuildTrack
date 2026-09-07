import { useState, type FormEvent } from 'react';
import { Modal } from './Modal.js';
import { Button, Card } from './ui.js';
import { createProject } from '../pages/Projects.js';
import { ApiError } from '../lib/api.js';

export function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('residential');
  const [location, setLocation] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const id = await createProject({ name, type, location: location || undefined, useTemplate });
      onCreated(id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create project.');
      setBusy(false);
    }
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="pname">Project name</label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="e.g. Riverside Residence" />
        </div>
        <div className="field">
          <label htmlFor="ptype">Project type</label>
          <select id="ptype" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="road">Road</option>
            <option value="custom">Custom / Blank</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="ploc">Location</label>
          <input id="ploc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Antipolo, Rizal" />
        </div>
        <label className="row" style={{ gap: 8, fontWeight: 400, color: 'var(--text)' }}>
          <input type="checkbox" checked={useTemplate} onChange={(e) => setUseTemplate(e.target.checked)} style={{ width: 'auto' }} />
          Start from a template breakdown (you can change everything later)
        </label>
        {error && <Card padding="10px 14px" style={{ background: 'var(--error-soft)', border: '1px solid var(--error)', color: 'var(--error)', margin: '16px 0 0', fontSize: '0.88rem' }}>{error}</Card>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</Button>
        </div>
      </form>
    </Modal>
  );
}
