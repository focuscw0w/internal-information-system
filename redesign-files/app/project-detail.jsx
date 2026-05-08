/* global React */
const { useState } = React;

const TASKS_DATA = [
  { id: 101, title: "Audit existujúcich CRM workflowov", status: "done", priority: "high", assignees: ["Adam Kováč", "Júlia Beňová"], estimated: 16, actual: 18, due: "2026-02-15", at_risk: false },
  { id: 102, title: "Wireframy pre dashboard a kontakt-list", status: "done", priority: "high", assignees: ["Eva Nováková"], estimated: 24, actual: 22, due: "2026-02-28", at_risk: false },
  { id: 103, title: "Hi-fi dizajn dashboardu", status: "in_progress", priority: "high", assignees: ["Eva Nováková", "Lucia Holá"], estimated: 32, actual: 18, due: "2026-05-12", at_risk: false },
  { id: 104, title: "Redesign filter panelov v zoznamoch", status: "in_progress", priority: "medium", assignees: ["Lucia Holá"], estimated: 12, actual: 8, due: "2026-05-08", at_risk: true },
  { id: 105, title: "API integrácia pre real-time notifikácie", status: "todo", priority: "high", assignees: ["Marek Pohan", "Tomáš Šebek"], estimated: 40, actual: 0, due: "2026-05-25", at_risk: false },
  { id: 106, title: "Migrácia user permissions", status: "todo", priority: "critical", assignees: ["Marek Pohan"], estimated: 28, actual: 0, due: "2026-05-15", at_risk: true },
  { id: 107, title: "QA test plan – customer 360 view", status: "testing", priority: "medium", assignees: ["Mária Sucha"], estimated: 16, actual: 14, due: "2026-05-10", at_risk: false },
  { id: 108, title: "Performance tuning na zoznamových obrazovkách", status: "testing", priority: "medium", assignees: ["Tomáš Šebek"], estimated: 20, actual: 22, due: "2026-05-20", at_risk: false },
  { id: 109, title: "Dokumentácia pre interných používateľov", status: "todo", priority: "low", assignees: ["Júlia Beňová"], estimated: 8, actual: 0, due: "2026-06-15", at_risk: false },
];

const TabBar = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <button key={t.id} className={`tab ${value === t.id ? 'is-active' : ''}`} onClick={() => onChange(t.id)}>
        {t.icon}{t.label}
        {t.count !== undefined && <span className="tab__count">{t.count}</span>}
      </button>
    ))}
  </div>
);

const TaskRow = ({ t, onOpen }) => (
  <tr onClick={() => onOpen(t.id)}>
    <td style={{ width: 28 }}>
      <input type="checkbox" defaultChecked={t.status === 'done'} onClick={e => e.stopPropagation()}
             style={{ accentColor: 'var(--accent)' }} />
    </td>
    <td>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {t.at_risk && <span className="dot dot--warning" title="Ohrozená úloha" />}
        <span style={{ fontWeight: 500, color: t.status === 'done' ? 'var(--text-tertiary)' : 'var(--text-primary)',
                       textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
          {t.title}
        </span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>TASK-{t.id}</div>
    </td>
    <td><StatusBadge map={TASK_STATUS} value={t.status} /></td>
    <td><StatusBadge map={PRIORITY} value={t.priority} dot={false} /></td>
    <td>
      <div className="avatars">
        {t.assignees.slice(0, 3).map(n => <Avatar key={n} name={n} size="sm" />)}
      </div>
    </td>
    <td className="mono" style={{ fontSize: 12 }}>
      {t.actual}h <span style={{ color: 'var(--text-tertiary)' }}>/ {t.estimated}h</span>
    </td>
    <td className="mono" style={{ fontSize: 12 }}>{fmtDate(t.due)}</td>
    <td><button className="icon-btn" onClick={e => e.stopPropagation()}><I.more /></button></td>
  </tr>
);

const KanbanBoard = ({ onOpenTask }) => {
  const cols = [
    { id: 'todo', label: 'Na vykonanie', accent: 'var(--text-muted)' },
    { id: 'in_progress', label: 'Prebieha', accent: 'var(--accent)' },
    { id: 'testing', label: 'Testovanie', accent: 'var(--warning)' },
    { id: 'done', label: 'Hotovo', accent: 'var(--success)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {cols.map(c => {
        const tasks = TASKS_DATA.filter(t => t.status === c.id);
        return (
          <div key={c.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                                    padding: 12, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{tasks.length}</span>
              </div>
              <button className="icon-btn" style={{ width: 22, height: 22 }}><I.plus /></button>
            </div>
            {tasks.map(t => (
              <div key={t.id} className="card" onClick={() => onOpenTask(t.id)}
                   style={{ padding: 12, cursor: 'pointer', boxShadow: 'var(--shadow-xs)', transition: 'all .12s ease' }}
                   onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                   onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xs)'; e.currentTarget.style.transform = ''; }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>TASK-{t.id}</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>
                  {t.at_risk && <span className="dot dot--warning" style={{ marginRight: 6, verticalAlign: 'middle' }} />}
                  {t.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <StatusBadge map={PRIORITY} value={t.priority} dot={false} />
                  <div className="avatars">
                    {t.assignees.slice(0, 2).map(n => <Avatar key={n} name={n} size="sm" />)}
                  </div>
                </div>
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              fontSize: 11, color: 'var(--text-tertiary)' }}>
                  <span className="mono">{t.actual}h / {t.estimated}h</span>
                  <span><I.calendar style={{ width: 11, height: 11, verticalAlign: 'middle', marginRight: 3 }} />{fmtDate(t.due).replace(/ \d{4}$/, '')}</span>
                </div>
              </div>
            ))}
            <button style={{ background: 'transparent', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)',
                             padding: '8px', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer',
                             display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <I.plus style={{ width: 12, height: 12 }} /> Pridať úlohu
            </button>
          </div>
        );
      })}
    </div>
  );
};

const ProjectDetailPage = ({ projectId, onBack, onOpenTask }) => {
  const [taskModal, setTaskModal] = useState(null);
  const [editProjectModal, setEditProjectModal] = useState(false);
  const p = PROJECTS_DATA.find(x => x.id === projectId) || PROJECTS_DATA[0];
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredTasks = TASKS_DATA.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  });

  const atRiskCount = TASKS_DATA.filter(t => t.at_risk && t.status !== 'done').length;
  const daysToDeadline = daysUntil(p.end_date);

  return (
    <div className="page page-enter">
      <button className="page-head__back" onClick={onBack}><I.arrowLeft /> Späť na projekty</button>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              {p.client}
            </span>
            <StatusBadge map={PROJECT_STATUS} value={p.status} />
            <StatusBadge map={WORKLOAD} value={p.workload} />
          </div>
          <h1 className="page-head__title">{p.name}</h1>
          <p className="page-head__subtitle">
            Vedúci projektu: <strong style={{ color: 'var(--text-secondary)' }}>{p.lead}</strong> · {fmtDate(p.start_date)} – {fmtDate(p.end_date)}
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.users /> Spravovať tím</button>
          <button className="btn" onClick={() => setEditProjectModal(true)}><I.settings /> Upraviť projekt</button>
          <button className="btn btn--primary" onClick={() => setTaskModal('create')}><I.plus /> Nová úloha</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Pokrok</span>
          <span className="kpi__value">{p.progress}<sub>%</sub></span>
          <ProgressBar value={p.progress} variant="accent" />
        </div>
        <div className="kpi">
          <span className="kpi__label">Vyťaženie tímu</span>
          <span className="kpi__value" style={{ color: p.capacity_used > 100 ? 'var(--danger-text)' : undefined }}>
            {p.capacity_used}<sub>%</sub>
          </span>
          <ProgressBar value={p.capacity_used} variant={p.capacity_used > 100 ? 'danger' : p.capacity_used > 85 ? 'warning' : 'accent'} />
        </div>
        <div className="kpi">
          <span className="kpi__label">Úlohy</span>
          <span className="kpi__value">{p.tasks_completed}<sub>/ {p.tasks_total}</sub></span>
          <span className="kpi__delta kpi__delta--neutral">{p.tasks_total - p.tasks_completed} ostáva</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Do deadline</span>
          <span className="kpi__value" style={{ color: daysToDeadline < 14 ? 'var(--warning-text)' : undefined }}>
            {Math.abs(daysToDeadline)}<sub>{daysToDeadline >= 0 ? 'dní' : 'dní po'}</sub>
          </span>
          <span className="kpi__delta kpi__delta--neutral">
            {atRiskCount > 0 ? <span style={{ color: 'var(--warning-text)' }}><I.alert style={{ width: 11, height: 11, verticalAlign: 'middle', marginRight: 3 }} />{atRiskCount} ohrozené úlohy</span> : 'všetko v pláne'}
          </span>
        </div>
      </div>

      <TabBar
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Prehľad', icon: <I.fileText /> },
          { id: 'tasks', label: 'Úlohy', icon: <I.list />, count: TASKS_DATA.length },
          { id: 'kanban', label: 'Kanban', icon: <I.kanban /> },
          { id: 'timeline', label: 'Časová os', icon: <I.calendar /> },
          { id: 'gantt', label: 'Gantt', icon: <I.gantt /> },
          { id: 'team', label: 'Tím', icon: <I.users />, count: p.team.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="grid-main-side">
          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card__head">
                <div>
                  <h3 className="card__title">Aktívne úlohy</h3>
                  <div className="card__sub">Úlohy, ktoré práve prebiehajú alebo sú v testovaní</div>
                </div>
                <button className="btn btn--sm btn--ghost" onClick={() => setTab('tasks')}>
                  Zobraziť všetky <I.arrowRight />
                </button>
              </div>
              <div className="card__body card__body--flush">
                <table className="table">
                  <tbody>
                    {TASKS_DATA.filter(t => t.status === 'in_progress' || t.status === 'testing').map(t => (
                      <TaskRow key={t.id} t={t} onOpen={onOpenTask} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Aktivita</h3>
              </div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { who: 'Eva Nováková', what: 'aktualizovala úlohu', target: 'Hi-fi dizajn dashboardu', when: 'pred 2h' },
                  { who: 'Marek Pohan', what: 'vytvoril úlohu', target: 'Migrácia user permissions', when: 'pred 5h' },
                  { who: 'Lucia Holá', what: 'pridala komentár k', target: 'Redesign filter panelov', when: 'včera 16:42' },
                  { who: 'Adam Kováč', what: 'dokončil úlohu', target: 'Audit existujúcich CRM workflowov', when: 'pred 2 dňami' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Avatar name={a.who} size="sm" />
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <strong>{a.who}</strong> <span style={{ color: 'var(--text-tertiary)' }}>{a.what}</span> <strong>{a.target}</strong>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card__head"><h3 className="card__title">Detaily</h3></div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Klient', p.client],
                  ['Vedúci', <span key="l" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Avatar name={p.lead} size="sm" />{p.lead}</span>],
                  ['Začiatok', fmtDate(p.start_date)],
                  ['Deadline', fmtDate(p.end_date)],
                  ['Veľkosť tímu', `${p.team.length} ľudí`],
                  ['Stav', <StatusBadge key="s" map={PROJECT_STATUS} value={p.status} />],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Tím</h3></div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {p.team.map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={n} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                        {n === p.lead ? 'Vedúci projektu' : 'Členovia tímu'}
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                      {32 + (n.length * 3) % 12}h/40h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <>
          <div className="command-bar">
            <div className="field-wrap command-bar__search">
              <I.search />
              <input className="input input--with-icon" style={{ width: '100%' }} placeholder="Hľadať úlohu..."
                     value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="command-bar__filters">
              <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Všetky stavy</option>
                {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="select" defaultValue="">
                <option value="">Všetky priority</option>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="select" defaultValue="">
                <option value="">Všetci priradení</option>
                {p.team.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="command-bar__spacer" />
            <button className="btn btn--primary"><I.plus /> Nová úloha</button>
          </div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th></th>
                  <th>Úloha</th>
                  <th>Stav</th>
                  <th>Priorita</th>
                  <th>Priradení</th>
                  <th>Hodiny</th>
                  <th>Termín</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(t => <TaskRow key={t.id} t={t} onOpen={onOpenTask} />)}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'kanban' && <KanbanBoard onOpenTask={onOpenTask} />}

      {tab === 'timeline' && (
        <div className="card">
          <div className="card__body">
            <TimelineView tasks={TASKS_DATA} />
          </div>
        </div>
      )}

      {tab === 'gantt' && (
        <div className="card">
          <div className="card__body" style={{ overflow: 'auto' }}>
            <GanttView tasks={TASKS_DATA} project={p} />
          </div>
        </div>
      )}

      {tab === 'team' && (
        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">Tím projektu</h3>
              <div className="card__sub">{p.team.length} členov · vyťaženosť za tento týždeň</div>
            </div>
            <button className="btn btn--primary"><I.plus /> Pridať člena</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Člen</th>
                <th>Rola</th>
                <th>Vyťaženie</th>
                <th>Pridelené úlohy</th>
                <th>Hodiny tento týždeň</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {p.team.map((n, i) => {
                const util = 60 + ((n.length * 7) % 70);
                return (
                  <tr key={n}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={n} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{n}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{n.toLowerCase().replace(' ', '.')}@firma.sk</div>
                        </div>
                      </div>
                    </td>
                    <td>{n === p.lead ? 'Project Lead' : ['Senior Developer', 'Designer', 'QA Engineer', 'Developer'][i % 4]}</td>
                    <td style={{ minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}><ProgressBar value={util} variant={util > 100 ? 'danger' : util > 85 ? 'warning' : 'accent'} /></div>
                        <span className="mono" style={{ fontSize: 12, minWidth: 40, textAlign: 'right' }}>{util}%</span>
                      </div>
                    </td>
                    <td className="mono">{TASKS_DATA.filter(t => t.assignees.includes(n)).length}</td>
                    <td className="mono">{Math.round(util * 0.4)}h / 40h</td>
                    <td><button className="icon-btn"><I.more /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TimelineView = ({ tasks }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún', 'Júl', 'Aug'];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${months.length}, 1fr)`, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 16 }}>
        {months.map(m => <div key={m} style={{ fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{m}</div>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tasks.map((t, i) => {
          const start = (i % 6) + 0.3;
          const dur = 1 + ((t.id * 7) % 22) / 10;
          return (
            <div key={t.id} style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'var(--border-subtle)' }} />
              <div style={{
                position: 'absolute',
                left: `${(start / months.length) * 100}%`,
                width: `${(dur / months.length) * 100}%`,
                height: 24,
                background: t.status === 'done' ? 'var(--success-soft)' : t.status === 'in_progress' ? 'var(--accent-soft-2)' : 'var(--bg-muted)',
                border: `1px solid ${t.status === 'done' ? 'var(--success-border)' : t.status === 'in_progress' ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 6,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: 'var(--text-primary)',
              }}>
                {t.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GanttView = ({ tasks, project }) => {
  const weeks = Array.from({ length: 16 }, (_, i) => `T${i + 1}`);
  return (
    <div style={{ minWidth: 900 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${weeks.length}, 1fr)`, alignItems: 'center',
                    paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8, gap: 0 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Úloha</div>
        {weeks.map(w => <div key={w} style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>{w}</div>)}
      </div>
      {tasks.map((t, i) => {
        const start = (i * 1.5) % 12;
        const dur = 1 + ((t.id * 11) % 30) / 10;
        return (
          <div key={t.id} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${weeks.length}, 1fr)`, alignItems: 'center', height: 32 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, paddingRight: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.title}
            </div>
            <div style={{ gridColumn: `${Math.floor(start) + 2} / span ${Math.ceil(dur)}`, height: 18,
                          background: t.status === 'done' ? 'var(--success)' : t.status === 'in_progress' ? 'var(--accent)' : 'var(--text-muted)',
                          borderRadius: 4, opacity: t.status === 'todo' ? 0.4 : 0.9 }} />
          </div>
        );
      })}
    </div>
  );
};

window.ProjectDetailPage = ProjectDetailPage;
window.TASKS_DATA = TASKS_DATA;
window.daysUntil = daysUntil;
function daysUntil(s) { return Math.round((new Date(s) - new Date('2026-05-01')) / 86400000); }
