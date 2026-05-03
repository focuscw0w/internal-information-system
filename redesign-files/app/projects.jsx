/* global React */
const { useState } = React;

const PROJECTS_DATA = [
  { id: 1, name: "Fintex – CRM redesign", client: "Fintex Group", status: "active", workload: "high",
    progress: 67, tasks_total: 48, tasks_completed: 32, capacity_used: 84, team_size: 6,
    start_date: "2026-01-15", end_date: "2026-06-30", lead: "Adam Kováč",
    team: ["Adam Kováč", "Júlia Beňová", "Marek Pohan", "Eva Nováková", "Tomáš Šebek", "Lucia Holá"] },
  { id: 2, name: "Mobile banking 2.0", client: "Tatra banka", status: "active", workload: "overloaded",
    progress: 42, tasks_total: 84, tasks_completed: 36, capacity_used: 112, team_size: 8,
    start_date: "2025-11-01", end_date: "2026-08-15", lead: "Júlia Beňová",
    team: ["Júlia Beňová", "Adam Kováč", "Peter Dobrý", "Mária Sucha", "Tomáš Šebek", "Eva Nováková", "Lucia Holá", "Karol Vrba"] },
  { id: 3, name: "Interný portál ESG", client: "Slovnaft", status: "planning", workload: "low",
    progress: 8, tasks_total: 24, tasks_completed: 2, capacity_used: 28, team_size: 3,
    start_date: "2026-05-01", end_date: "2026-12-15", lead: "Marek Pohan",
    team: ["Marek Pohan", "Lucia Holá", "Peter Dobrý"] },
  { id: 4, name: "Onboarding flow refresh", client: "Internal", status: "active", workload: "medium",
    progress: 78, tasks_total: 18, tasks_completed: 14, capacity_used: 62, team_size: 4,
    start_date: "2026-02-10", end_date: "2026-05-20", lead: "Eva Nováková",
    team: ["Eva Nováková", "Lucia Holá", "Adam Kováč", "Mária Sucha"] },
  { id: 5, name: "Data warehouse migrácia", client: "ČSOB", status: "on_hold", workload: "medium",
    progress: 34, tasks_total: 56, tasks_completed: 19, capacity_used: 0, team_size: 5,
    start_date: "2025-09-01", end_date: "2026-09-30", lead: "Tomáš Šebek",
    team: ["Tomáš Šebek", "Karol Vrba", "Peter Dobrý", "Mária Sucha", "Marek Pohan"] },
  { id: 6, name: "Marketing site v3", client: "Acme Studio", status: "completed", workload: "low",
    progress: 100, tasks_total: 22, tasks_completed: 22, capacity_used: 0, team_size: 3,
    start_date: "2025-10-01", end_date: "2026-02-28", lead: "Lucia Holá",
    team: ["Lucia Holá", "Eva Nováková", "Mária Sucha"] },
];

const fmtDate = (s) => new Date(s).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' });
const daysUntil = (s) => Math.round((new Date(s) - new Date('2026-05-01')) / 86400000);

const ProjectCard = ({ p, onOpen }) => {
  const days = daysUntil(p.end_date);
  const overdue = days < 0;
  return (
    <div className="card" onClick={() => onOpen(p.id)}
         style={{ cursor: 'pointer', transition: 'all .15s ease', display: 'flex', flexDirection: 'column' }}
         onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
         onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
      <div style={{ padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>
              {p.client}
            </div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {p.name}
            </h3>
          </div>
          <button className="icon-btn" onClick={(e) => e.stopPropagation()}><I.more /></button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatusBadge map={PROJECT_STATUS} value={p.status} />
          <StatusBadge map={WORKLOAD} value={p.workload} />
        </div>
      </div>
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>Pokrok</span>
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{p.progress}%</span>
        </div>
        <ProgressBar value={p.progress} variant={p.progress === 100 ? 'success' : 'accent'} />
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 'auto' }}>
        <div className="avatars">
          {p.team.slice(0, 4).map(n => <Avatar key={n} name={n} size="sm" />)}
          {p.team.length > 4 && (
            <span className="avatar avatar--sm" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
              +{p.team.length - 4}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
          <span className="mono">{p.tasks_completed}/{p.tasks_total} úloh</span>
          <span style={{ width: 1, height: 12, background: 'var(--border)' }} />
          <span style={{ color: overdue ? 'var(--danger-text)' : 'var(--text-tertiary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <I.calendar style={{ width: 12, height: 12 }} />
            {fmtDate(p.end_date)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ProjectsPage = ({ onOpen }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workloadFilter, setWorkloadFilter] = useState('');
  const [view, setView] = useState('grid');

  const filtered = PROJECTS_DATA.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (workloadFilter && p.workload !== workloadFilter) return false;
    return true;
  });

  const active = PROJECTS_DATA.filter(p => p.status === 'active').length;
  const totalTeam = new Set(PROJECTS_DATA.flatMap(p => p.team)).size;
  const avgCap = Math.round(PROJECTS_DATA.filter(p => p.status === 'active').reduce((s, p) => s + p.capacity_used, 0) / active);
  const tasksDone = PROJECTS_DATA.reduce((s, p) => s + p.tasks_completed, 0);
  const tasksAll = PROJECTS_DATA.reduce((s, p) => s + p.tasks_total, 0);

  return (
    <div className="page page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Projekty</h1>
          <p className="page-head__subtitle">
            Prehľad všetkých interných a klientskych projektov, ich stav, vyťaženie tímov a deadlinov.
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.download /> Export</button>
          <button className="btn btn--primary"><I.plus /> Nový projekt</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Aktívne projekty</span>
          <span className="kpi__value">{active}<sub>/ {PROJECTS_DATA.length}</sub></span>
          <span className="kpi__delta kpi__delta--up"><I.trending style={{ width: 12, height: 12 }} /> +1 oproti minulému mesiacu</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Ľudia v projektoch</span>
          <span className="kpi__value">{totalTeam}</span>
          <span className="kpi__delta kpi__delta--neutral">naprieč 4 tímami</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Priemerné vyťaženie</span>
          <span className="kpi__value">{avgCap}<sub>%</sub></span>
          <span className="kpi__delta kpi__delta--down">↑ 8% — pozri kapacity</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Dokončené úlohy</span>
          <span className="kpi__value">{tasksDone}<sub>/ {tasksAll}</sub></span>
          <ProgressBar value={(tasksDone / tasksAll) * 100} variant="accent" />
        </div>
      </div>

      {/* Command bar — všetky inputy na jednom konzistentnom mieste */}
      <div className="command-bar">
        <div className="field-wrap command-bar__search">
          <I.search />
          <input className="input input--with-icon" style={{ width: '100%' }}
                 placeholder="Hľadať projekt podľa názvu alebo klienta..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="command-bar__filters">
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Všetky stavy</option>
            {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select" value={workloadFilter} onChange={e => setWorkloadFilter(e.target.value)}>
            <option value="">Všetky vyťaženia</option>
            {Object.entries(WORKLOAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select" defaultValue="end_date">
            <option value="name">Zoradiť: Názov</option>
            <option value="end_date">Zoradiť: Najbližší deadline</option>
            <option value="progress">Zoradiť: Pokrok</option>
          </select>
        </div>
        <div className="command-bar__spacer" />
        <div className="command-bar__actions">
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginRight: 4 }}>
            {filtered.length} z {PROJECTS_DATA.length}
          </span>
          <div style={{ display: 'flex', background: 'var(--bg-muted)', borderRadius: 6, padding: 2 }}>
            <button className={`btn btn--sm ${view === 'grid' ? '' : 'btn--ghost'}`}
                    style={{ background: view === 'grid' ? 'var(--bg-surface)' : 'transparent', border: view === 'grid' ? '1px solid var(--border)' : 'none' }}
                    onClick={() => setView('grid')}><I.grid /></button>
            <button className={`btn btn--sm ${view === 'list' ? '' : 'btn--ghost'}`}
                    style={{ background: view === 'list' ? 'var(--bg-surface)' : 'transparent', border: view === 'list' ? '1px solid var(--border)' : 'none' }}
                    onClick={() => setView('list')}><I.list /></button>
          </div>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(p => <ProjectCard key={p.id} p={p} onOpen={onOpen} />)}
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Projekt</th>
                <th>Stav</th>
                <th>Vyťaženie</th>
                <th>Pokrok</th>
                <th>Tím</th>
                <th>Deadline</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} onClick={() => onOpen(p.id)}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{p.client}</div>
                  </td>
                  <td><StatusBadge map={PROJECT_STATUS} value={p.status} /></td>
                  <td><StatusBadge map={WORKLOAD} value={p.workload} /></td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={p.progress} variant={p.progress === 100 ? 'success' : 'accent'} /></div>
                      <span className="mono" style={{ fontSize: 12, minWidth: 32, textAlign: 'right' }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="avatars">
                      {p.team.slice(0, 3).map(n => <Avatar key={n} name={n} size="sm" />)}
                      {p.team.length > 3 && <span className="avatar avatar--sm" style={{ background: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>+{p.team.length - 3}</span>}
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{fmtDate(p.end_date)}</td>
                  <td><button className="icon-btn" onClick={e => e.stopPropagation()}><I.more /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

window.ProjectsPage = ProjectsPage;
window.PROJECTS_DATA = PROJECTS_DATA;
window.fmtDate = fmtDate;
