/* global React */
const { useState: useStateR, useMemo: useMemoR } = React;

/* =========================================================
   Mock data
   ========================================================= */
const REPORT_USERS = [
  { user_id: 1, user_name: 'Eva Nováková',   total_hours: 162.5, entries_count: 42, projects_count: 4 },
  { user_id: 2, user_name: 'Marek Pohan',    total_hours: 156.0, entries_count: 38, projects_count: 3 },
  { user_id: 3, user_name: 'Adam Kováč',     total_hours: 152.0, entries_count: 41, projects_count: 5 },
  { user_id: 4, user_name: 'Júlia Beňová',   total_hours: 148.5, entries_count: 36, projects_count: 4 },
  { user_id: 5, user_name: 'Tomáš Šebek',    total_hours: 144.0, entries_count: 32, projects_count: 3 },
  { user_id: 6, user_name: 'Lucia Holá',     total_hours: 138.0, entries_count: 35, projects_count: 4 },
  { user_id: 7, user_name: 'Mária Sucha',    total_hours: 124.5, entries_count: 28, projects_count: 3 },
  { user_id: 8, user_name: 'Lena Horváthová', total_hours: 120.0, entries_count: 30, projects_count: 6 },
];

const REPORT_PROJECTS = [
  { project_id: 1, project_name: 'Fintex CRM',         total_hours: 412.5, entries_count: 96,
    top_contributors: [
      { user_id: 1, name: 'Eva Nováková', hours: 82.5 },
      { user_id: 3, name: 'Adam Kováč',   hours: 64.0 },
      { user_id: 6, name: 'Lucia Holá',   hours: 58.0 },
      { user_id: 2, name: 'Marek Pohan',  hours: 52.0 },
    ] },
  { project_id: 2, project_name: 'Mobile banking 2.0', total_hours: 342.0, entries_count: 84,
    top_contributors: [
      { user_id: 4, name: 'Júlia Beňová', hours: 78.0 },
      { user_id: 2, name: 'Marek Pohan',  hours: 72.0 },
      { user_id: 5, name: 'Tomáš Šebek',  hours: 64.0 },
    ] },
  { project_id: 3, project_name: 'Onboarding flow',    total_hours: 184.5, entries_count: 52,
    top_contributors: [
      { user_id: 1, name: 'Eva Nováková', hours: 56.0 },
      { user_id: 7, name: 'Mária Sucha',  hours: 48.0 },
      { user_id: 6, name: 'Lucia Holá',   hours: 42.5 },
    ] },
  { project_id: 4, project_name: 'Data warehouse',     total_hours: 96.0,  entries_count: 24,
    top_contributors: [
      { user_id: 5, name: 'Tomáš Šebek',     hours: 48.0 },
      { user_id: 8, name: 'Lena Horváthová', hours: 30.0 },
    ] },
  { project_id: 5, project_name: 'Interný – admin',    total_hours: 62.0,  entries_count: 18,
    top_contributors: [
      { user_id: 8, name: 'Lena Horváthová', hours: 24.0 },
      { user_id: 3, name: 'Adam Kováč',      hours: 18.0 },
    ] },
];

const REPORT_TIMELINE = [
  { label: '14. apr', total_hours: 198, entries_count: 48 },
  { label: '21. apr', total_hours: 215, entries_count: 52 },
  { label: '28. apr', total_hours: 232, entries_count: 56 },
  { label: '5. máj',  total_hours: 268, entries_count: 64 },
  { label: '12. máj', total_hours: 142, entries_count: 36 }, // partial week (current)
];

const REPORT_PROJECT_OPTIONS = REPORT_PROJECTS.map(p => ({ id: p.project_id, name: p.project_name }));
const REPORT_USER_OPTIONS = REPORT_USERS.map(u => ({ id: u.user_id, name: u.user_name }));

const STATUS_OPTIONS = [
  { value: 'approved', label: 'Schválené' },
  { value: 'pending',  label: 'Čaká na schválenie' },
  { value: 'rejected', label: 'Zamietnuté' },
  { value: 'all',      label: 'Všetky stavy' },
];

const fmtHours = (h) => new Intl.NumberFormat('sk-SK', { maximumFractionDigits: 1 }).format(h);

/* =========================================================
   Multi-select with chips
   ========================================================= */
const MultiSelect = ({ placeholder, options, value, onChange, icon }) => {
  const [open, setOpen] = useStateR(false);
  const [query, setQuery] = useStateR('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  const selectedNames = options.filter(o => value.includes(o.id)).map(o => o.name);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="multi-select" onClick={() => setOpen(o => !o)}>
        {icon}
        {value.length === 0 ? (
          <span style={{ color: 'var(--text-tertiary)', flex: 1, textAlign: 'left' }}>{placeholder}</span>
        ) : (
          <span style={{ flex: 1, textAlign: 'left', display: 'flex', gap: 4, overflow: 'hidden' }}>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
              {value.length === 1 ? selectedNames[0] : `${value.length} vybrané`}
            </span>
          </span>
        )}
        {value.length > 0 && (
          <span onClick={(e) => { e.stopPropagation(); onChange([]); }}
                className="multi-select__clear">
            <I.x style={{ width: 11, height: 11 }} />
          </span>
        )}
        <I.chevDown style={{ width: 12, height: 12, color: 'var(--text-tertiary)', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="multi-select__menu">
          <div className="multi-select__search">
            <I.search />
            <input value={query} onChange={e => setQuery(e.target.value)}
                   placeholder="Hľadať…" autoFocus />
          </div>
          <div className="multi-select__list">
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                Žiadne výsledky
              </div>
            ) : filtered.map(o => (
              <button key={o.id} type="button" className="multi-select__item"
                      onClick={() => toggle(o.id)}>
                <span className={`multi-select__check ${value.includes(o.id) ? 'is-on' : ''}`}>
                  {value.includes(o.id) && <I.check style={{ width: 10, height: 10 }} />}
                </span>
                {o.name}
              </button>
            ))}
          </div>
          {value.length > 0 && (
            <div className="multi-select__foot">
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{value.length} vybrané</span>
              <button type="button" className="link-btn" style={{ fontSize: 12 }} onClick={() => onChange([])}>
                Vyčistiť
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   Timeline chart (SVG)
   ========================================================= */
const TimelineChart = ({ rows }) => {
  const max = Math.max(...rows.map(r => r.total_hours), 1);

  return (
    <div style={{ position: 'relative', height: 320, padding: '12px 8px 32px 56px' }}>
      {/* Y axis labels */}
      <div style={{ position: 'absolute', top: 12, bottom: 32, left: 0, width: 48,
                     display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                     fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)',
                     textAlign: 'right', paddingRight: 8 }}>
        <span>{Math.round(max)} h</span>
        <span>{Math.round(max * 0.75)} h</span>
        <span>{Math.round(max * 0.5)} h</span>
        <span>{Math.round(max * 0.25)} h</span>
        <span>0 h</span>
      </div>

      <div style={{ position: 'relative', height: '100%' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <div key={p} style={{ position: 'absolute', left: 0, right: 0,
                                  bottom: `${p * 100}%`,
                                  borderTop: '1px dashed var(--border-subtle)' }} />
        ))}

        {/* Bars */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end',
                       gap: 0, padding: '0 4px' }}>
          {rows.map((r, i) => {
            const h = (r.total_hours / max) * 100;
            return (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex',
                                      flexDirection: 'column', alignItems: 'center',
                                      justifyContent: 'flex-end', position: 'relative' }}>
                <div className="timeline-bar-wrap"
                     style={{ width: '70%', maxWidth: 56, height: `${h}%`, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'var(--accent)',
                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    transition: 'all 0.2s ease',
                  }} />
                  <div className="timeline-bar-label"
                       style={{ position: 'absolute', bottom: '100%', left: '50%',
                                 transform: 'translateX(-50%)', marginBottom: 4,
                                 fontSize: 10.5, fontWeight: 500, color: 'var(--text-secondary)',
                                 fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {fmtHours(r.total_hours)}h
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* X axis labels */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%',
                       display: 'flex', gap: 0, padding: '8px 4px 0' }}>
          {rows.map((r, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11,
                                    color: 'var(--text-secondary)', fontWeight: 500 }}>
              {r.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   Main page
   ========================================================= */
const ReportsPage = () => {
  const [activeTab, setActiveTab] = useStateR('users');
  const [dateFrom, setDateFrom] = useStateR('2026-05-01');
  const [dateTo, setDateTo] = useStateR('2026-05-14');
  const [projectIds, setProjectIds] = useStateR([]);
  const [userIds, setUserIds] = useStateR([]);
  const [status, setStatus] = useStateR('approved');
  const [search, setSearch] = useStateR('');

  const totals = useMemoR(() => {
    const hours = REPORT_USERS.reduce((s, r) => s + r.total_hours, 0);
    const entries = REPORT_USERS.reduce((s, r) => s + r.entries_count, 0);
    return { hours, entries };
  }, []);

  const filteredUsers = REPORT_USERS.filter(u =>
    !search || u.user_name.toLowerCase().includes(search.toLowerCase()));
  const filteredProjects = REPORT_PROJECTS.filter(p =>
    !search || p.project_name.toLowerCase().includes(search.toLowerCase()));

  const hasFilters = projectIds.length > 0 || userIds.length > 0 || status !== 'approved' || search;

  const clearFilters = () => {
    setProjectIds([]); setUserIds([]); setStatus('approved'); setSearch('');
  };

  const presets = [
    { label: 'Tento týždeň', from: '2026-05-11', to: '2026-05-14' },
    { label: 'Minulý týždeň', from: '2026-05-04', to: '2026-05-10' },
    { label: 'Tento mesiac', from: '2026-05-01', to: '2026-05-14' },
    { label: 'Posledných 30 dní', from: '2026-04-14', to: '2026-05-14' },
    { label: 'Q2', from: '2026-04-01', to: '2026-06-30' },
  ];

  return (
    <div className="page page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Time Reports</h1>
          <p className="page-head__subtitle">
            Agregácie hodín podľa ľudí, projektov a obdobia. Vyber rozsah a filtre.
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Hodiny spolu</span>
          <span className="kpi__value">{fmtHours(totals.hours)}<sub>h</sub></span>
          <span className="kpi__delta kpi__delta--up">+12% vs minulé obdobie</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Záznamy</span>
          <span className="kpi__value">{totals.entries}</span>
          <span className="kpi__delta kpi__delta--neutral">priemer {(totals.entries / REPORT_USERS.length).toFixed(1)} / osoba</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Ľudia</span>
          <span className="kpi__value">{REPORT_USERS.length}</span>
          <span className="kpi__delta kpi__delta--neutral">aktívnych v období</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Projekty</span>
          <span className="kpi__value">{REPORT_PROJECTS.length}</span>
          <span className="kpi__delta kpi__delta--neutral">s aspoň 1 záznamom</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Date range */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)',
                            textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 80 }}>
              Obdobie
            </span>
            <div className="field-wrap">
              <I.calendar />
              <input type="date" className="input input--with-icon" value={dateFrom}
                     onChange={e => setDateFrom(e.target.value)} style={{ width: 158 }} />
            </div>
            <span style={{ color: 'var(--text-tertiary)' }}>–</span>
            <div className="field-wrap">
              <I.calendar />
              <input type="date" className="input input--with-icon" value={dateTo}
                     onChange={e => setDateTo(e.target.value)} style={{ width: 158 }} />
            </div>
            <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 4px' }} />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {presets.map(p => {
                const active = dateFrom === p.from && dateTo === p.to;
                return (
                  <button key={p.label} type="button"
                          className={`btn btn--sm ${active ? '' : 'btn--ghost'}`}
                          onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)',
                            textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: 80 }}>
              Filtre
            </span>
            <MultiSelect
              placeholder="Všetky projekty"
              options={REPORT_PROJECT_OPTIONS}
              value={projectIds} onChange={setProjectIds}
              icon={<I.briefcase style={{ width: 13, height: 13, color: 'var(--text-tertiary)' }} />}
            />
            <MultiSelect
              placeholder="Všetci ľudia"
              options={REPORT_USER_OPTIONS}
              value={userIds} onChange={setUserIds}
              icon={<I.users style={{ width: 13, height: 13, color: 'var(--text-tertiary)' }} />}
            />
            <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="field-wrap" style={{ flex: 1, minWidth: 200, maxWidth: 280 }}>
              <I.search />
              <input className="input input--with-icon" style={{ width: '100%' }}
                     placeholder="Hľadať v tabuľke…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {hasFilters && (
              <button className="btn btn--sm btn--ghost" onClick={clearFilters}>
                <I.x /> Vyčistiť
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed report */}
      <div className="card">
        <div className="card__head" style={{ padding: 0, borderBottom: 'none' }}>
          <div className="tabbar" style={{ width: '100%', borderBottom: '1px solid var(--border)' }}>
            <button className={`tab ${activeTab === 'users' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('users')}>
              <I.users /> Po osobe
              <span className="tab__count">{REPORT_USERS.length}</span>
            </button>
            <button className={`tab ${activeTab === 'projects' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('projects')}>
              <I.briefcase /> Po projekte
              <span className="tab__count">{REPORT_PROJECTS.length}</span>
            </button>
            <button className={`tab ${activeTab === 'timeline' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('timeline')}>
              <I.trending /> Po období
              <span className="tab__count">{REPORT_TIMELINE.length}</span>
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <UsersReportTable rows={filteredUsers} total={totals.hours} />
        )}
        {activeTab === 'projects' && (
          <ProjectsReportTable rows={filteredProjects} total={totals.hours} />
        )}
        {activeTab === 'timeline' && (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Hodiny v čase</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                  Súčet zaznamenaných hodín po týždňoch ({REPORT_TIMELINE.length} období)
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                              fontSize: 12, color: 'var(--text-tertiary)' }}>
                <span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }} />
                Hodiny týždeň
              </div>
            </div>
            <TimelineChart rows={REPORT_TIMELINE} />
            <table className="table" style={{ marginTop: 20 }}>
              <thead>
                <tr>
                  <th>Obdobie</th>
                  <th style={{ textAlign: 'right' }}>Hodiny</th>
                  <th style={{ textAlign: 'right' }}>Záznamy</th>
                  <th style={{ textAlign: 'right' }}>Priemer / záznam</th>
                </tr>
              </thead>
              <tbody>
                {REPORT_TIMELINE.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.label}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtHours(r.total_hours)} h</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{r.entries_count}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
                      {fmtHours(r.total_hours / r.entries_count)} h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const UsersReportTable = ({ rows, total }) => (
  <table className="table">
    <thead>
      <tr>
        <th>Osoba</th>
        <th>Podiel</th>
        <th style={{ textAlign: 'right' }}>Hodiny</th>
        <th style={{ textAlign: 'right' }}>Záznamy</th>
        <th style={{ textAlign: 'right' }}>Projekty</th>
        <th style={{ textAlign: 'right' }}>Priemer / deň</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(r => {
        const share = (r.total_hours / total) * 100;
        return (
          <tr key={r.user_id}>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={r.user_name} size="sm" />
                <span style={{ fontWeight: 500 }}>{r.user_name}</span>
              </div>
            </td>
            <td style={{ width: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ProgressBar value={share} />
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)', minWidth: 36, textAlign: 'right' }}>
                  {share.toFixed(1)}%
                </span>
              </div>
            </td>
            <td className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>{fmtHours(r.total_hours)} h</td>
            <td className="mono" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{r.entries_count}</td>
            <td className="mono" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{r.projects_count}</td>
            <td className="mono" style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
              {fmtHours(r.total_hours / 14)} h
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

const ProjectsReportTable = ({ rows, total }) => (
  <table className="table">
    <thead>
      <tr>
        <th>Projekt</th>
        <th>Podiel</th>
        <th style={{ textAlign: 'right' }}>Hodiny</th>
        <th style={{ textAlign: 'right' }}>Záznamy</th>
        <th>Top prispievatelia</th>
      </tr>
    </thead>
    <tbody>
      {rows.map(r => {
        const share = (r.total_hours / total) * 100;
        return (
          <tr key={r.project_id}>
            <td style={{ fontWeight: 500 }}>{r.project_name}</td>
            <td style={{ width: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ProgressBar value={share} />
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)', minWidth: 36, textAlign: 'right' }}>
                  {share.toFixed(1)}%
                </span>
              </div>
            </td>
            <td className="mono" style={{ textAlign: 'right', fontWeight: 500 }}>{fmtHours(r.total_hours)} h</td>
            <td className="mono" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{r.entries_count}</td>
            <td>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {r.top_contributors.slice(0, 4).map(c => (
                  <span key={c.user_id} className="badge badge--neutral" style={{ fontSize: 11 }}>
                    <Avatar name={c.name} size="sm" style={{ width: 14, height: 14, fontSize: 8 }} />
                    {c.name} · {fmtHours(c.hours)}h
                  </span>
                ))}
                {r.top_contributors.length > 4 && (
                  <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)',
                                  alignSelf: 'center', padding: '0 4px' }}>
                    +{r.top_contributors.length - 4}
                  </span>
                )}
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

window.ReportsPage = ReportsPage;
