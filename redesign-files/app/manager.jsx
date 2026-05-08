/* global React */
const { useState: useStateMgr, useMemo: useMemoMgr } = React;

/* =========================================================
   Mock data
   ========================================================= */
const PENDING_APPROVALS = [
  { id: 'a1', type: 'time', user: 'Mária Bieliková', avatar: 'Mária Bieliková', project: 'Fintex CRM',
    period: '21. apr – 27. apr', total: 41.5, billable: 38, entries: 9, submitted: '28. apr', priority: 'normal' },
  { id: 'a2', type: 'time', user: 'Tomáš Varga', avatar: 'Tomáš Varga', project: 'Mobile banking 2.0',
    period: '21. apr – 27. apr', total: 39, billable: 39, entries: 8, submitted: '28. apr', priority: 'normal' },
  { id: 'a3', type: 'time', user: 'Lena Horváthová', avatar: 'Lena Horváthová', project: 'Onboarding flow',
    period: '21. apr – 27. apr', total: 44, billable: 36, entries: 11, submitted: '28. apr', priority: 'high' },
  { id: 'a4', type: 'leave', user: 'Petra Šimková', avatar: 'Petra Šimková', project: 'Dovolenka',
    period: '12. máj – 19. máj', total: 6, billable: 0, entries: 0, submitted: '5. máj', priority: 'normal',
    note: '6 pracovných dní · spring break' },
  { id: 'a5', type: 'overtime', user: 'Ján Kollár', avatar: 'Ján Kollár', project: 'Fintex CRM',
    period: '24. apr – 27. apr', total: 12, billable: 12, entries: 4, submitted: '27. apr', priority: 'high',
    note: 'Hot-fix nasadenie · víkend' },
  { id: 'a6', type: 'expense', user: 'Adam Kováč', avatar: 'Adam Kováč', project: 'Klientský meeting · Viedeň',
    period: '22. apr', total: 248, billable: 0, entries: 3, submitted: '23. apr', priority: 'normal',
    note: 'Doprava + ubytovanie' },
  { id: 'a7', type: 'time', user: 'Daniela Krajčová', avatar: 'Daniela Krajčová', project: 'Interné R&D',
    period: '21. apr – 27. apr', total: 36, billable: 4, entries: 7, submitted: '28. apr', priority: 'normal' },
];

const TEAM_PROJECTS_REPORT = [
  { name: 'Fintex CRM', budget: 1200, spent: 920, billable: 880, members: 7, health: 'on_track', delivery: '15. jún' },
  { name: 'Mobile banking 2.0', budget: 2400, spent: 2120, billable: 2080, members: 9, health: 'at_risk', delivery: '30. máj' },
  { name: 'Onboarding flow', budget: 600, spent: 410, billable: 380, members: 4, health: 'on_track', delivery: '22. máj' },
  { name: 'Interný — admin', budget: 240, spent: 268, billable: 0, members: 3, health: 'over_budget', delivery: '—' },
  { name: 'Acme migrácia', budget: 800, spent: 320, billable: 320, members: 5, health: 'on_track', delivery: '11. júl' },
];

const HEALTH_BADGE = {
  on_track: { label: 'V pláne', cls: 'badge--success' },
  at_risk: { label: 'Ohrozený', cls: 'badge--warning' },
  over_budget: { label: 'Nad rozpočet', cls: 'badge--danger' },
};

const APPROVAL_TYPE = {
  time: { label: 'Výkaz času', icon: <I.clock />, color: 'var(--accent)' },
  leave: { label: 'Dovolenka', icon: <I.calendar />, color: 'var(--success)' },
  overtime: { label: 'Nadčas', icon: <I.zap />, color: 'var(--warning)' },
  expense: { label: 'Výdavok', icon: <I.fileText />, color: 'var(--text-secondary)' },
};

/* =========================================================
   Page
   ========================================================= */
const ManagerPage = () => {
  const [tab, setTab] = useStateMgr('approvals');
  const [filter, setFilter] = useStateMgr('all');
  const [selected, setSelected] = useStateMgr(new Set());
  const [items, setItems] = useStateMgr(PENDING_APPROVALS);

  const filtered = items.filter(i => filter === 'all' || i.type === filter);
  const allSelected = filtered.length > 0 && filtered.every(i => selected.has(i.id));

  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };
  const approveSelected = () => {
    setItems(items.filter(i => !selected.has(i.id)));
    setSelected(new Set());
  };

  const counts = {
    all: items.length,
    time: items.filter(i => i.type === 'time').length,
    leave: items.filter(i => i.type === 'leave').length,
    overtime: items.filter(i => i.type === 'overtime').length,
    expense: items.filter(i => i.type === 'expense').length,
  };

  return (
    <div className="page page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Manažérsky pohľad</h1>
          <p className="page-head__subtitle">
            Schvaľuj výkazy svojho tímu a sleduj prehľad projektov, na ktorých pracujú.
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.download /> Export</button>
          <button className="btn"><I.calendar /> Tento týždeň</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Čaká na schválenie</span>
          <span className="kpi__value">{items.length}<sub>položiek</sub></span>
          <span className="kpi__delta kpi__delta--neutral">{items.filter(i => i.priority === 'high').length} prioritných</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Hodiny tímu (týždeň)</span>
          <span className="kpi__value">288<sub>h / 320h</sub></span>
          <ProgressBar value={(288/320)*100} variant="accent" />
        </div>
        <div className="kpi">
          <span className="kpi__label">Účtovateľná utilizácia</span>
          <span className="kpi__value">82<sub>%</sub></span>
          <span className="kpi__delta kpi__delta--up">+4 % vs minulý týždeň</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Projekty v ohrození</span>
          <span className="kpi__value">2<sub>/ 5</sub></span>
          <span className="kpi__delta kpi__delta--down">1 nad rozpočtom</span>
        </div>
      </div>

      <div className="tabbar" style={{ marginBottom: 20 }}>
        <button className={`tab ${tab === 'approvals' ? 'is-active' : ''}`} onClick={() => setTab('approvals')}>
          <I.checkCircle /> Schvaľovania
          <span className="tab__count">{items.length}</span>
        </button>
        <button className={`tab ${tab === 'team' ? 'is-active' : ''}`} onClick={() => setTab('team')}>
          <I.users /> Môj tím
        </button>
        <button className={`tab ${tab === 'reports' ? 'is-active' : ''}`} onClick={() => setTab('reports')}>
          <I.trending /> Reporty
        </button>
      </div>

      {tab === 'approvals' && (
        <div className="card">
          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
                         borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
            {[
              ['all', 'Všetko'],
              ['time', 'Výkazy času'],
              ['overtime', 'Nadčasy'],
              ['leave', 'Dovolenky'],
              ['expense', 'Výdavky'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)}
                      className={`btn btn--sm ${filter === id ? 'btn--accent' : 'btn--ghost'}`}>
                {label}
                <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 4 }}>{counts[id]}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {selected.size > 0 ? (
              <>
                <span style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>
                  Vybraných {selected.size}
                </span>
                <button className="btn btn--sm btn--ghost" onClick={() => setSelected(new Set())}>
                  Zrušiť výber
                </button>
                <button className="btn btn--sm" style={{ color: 'var(--danger-text)' }}>
                  <I.x /> Zamietnuť
                </button>
                <button className="btn btn--sm btn--primary" onClick={approveSelected}>
                  <I.check /> Schváliť ({selected.size})
                </button>
              </>
            ) : (
              <button className="btn btn--sm">Nastaviť pravidlá</button>
            )}
          </div>

          {/* Approval rows */}
          {filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <I.checkCircle style={{ width: 32, height: 32, color: 'var(--success)', margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>Všetko schválené</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Žiadne čakajúce položky pre tento filter.</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 140px 120px 100px 100px 80px',
                             alignItems: 'center', gap: 12, padding: '8px 18px',
                             background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)',
                             fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                             color: 'var(--text-tertiary)', fontWeight: 500 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: 'var(--accent)' }} />
                <span>Položka</span>
                <span>Projekt</span>
                <span>Obdobie</span>
                <span style={{ textAlign: 'right' }}>Hodiny</span>
                <span>Podané</span>
                <span />
              </div>
              {filtered.map(item => {
                const t = APPROVAL_TYPE[item.type];
                const isSel = selected.has(item.id);
                return (
                  <div key={item.id}
                       style={{ display: 'grid',
                                 gridTemplateColumns: '32px 1fr 140px 120px 100px 100px 80px',
                                 alignItems: 'center', gap: 12, padding: '14px 18px',
                                 borderBottom: '1px solid var(--border-subtle)',
                                 background: isSel ? 'var(--accent-soft)' : 'transparent',
                                 transition: 'background 0.12s ease' }}>
                    <input type="checkbox" checked={isSel} onChange={() => toggle(item.id)}
                           style={{ accentColor: 'var(--accent)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <Avatar name={item.avatar} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.user}
                          {item.priority === 'high' && (
                            <span className="badge badge--warning" style={{ fontSize: 10 }}>
                              <I.flag style={{ width: 9, height: 9 }} /> Priorita
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: t.color }}>
                            {t.icon} {t.label}
                          </span>
                          {item.note && <><span style={{ color: 'var(--text-quaternary)' }}>·</span><span>{item.note}</span></>}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: 13 }}>{item.project}</span>
                    <span className="mono" style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{item.period}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>
                        {item.type === 'expense' ? `${item.total} €` : `${item.total}h`}
                      </div>
                      {item.type === 'time' && item.billable < item.total && (
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.billable}h účt.</div>
                      )}
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.submitted}</span>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" title="Schváliť"
                              style={{ color: 'var(--success-text)' }}><I.check /></button>
                      <button className="icon-btn" title="Zamietnuť"
                              style={{ color: 'var(--danger-text)' }}><I.x /></button>
                      <button className="icon-btn" title="Detail"><I.more /></button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {tab === 'team' && <ManagerTeamView />}
      {tab === 'reports' && <ManagerReportsView />}
    </div>
  );
};

/* =========================================================
   Team view
   ========================================================= */
const TEAM_MEMBERS_MGR = [
  { name: 'Mária Bieliková', role: 'Senior dizajnér', utilization: 96, hours_week: 38.5, target: 40, projects: 3, status: 'high' },
  { name: 'Tomáš Varga', role: 'Backend vývojár', utilization: 88, hours_week: 35, target: 40, projects: 2, status: 'medium' },
  { name: 'Lena Horváthová', role: 'Project lead', utilization: 110, hours_week: 44, target: 40, projects: 4, status: 'overloaded' },
  { name: 'Petra Šimková', role: 'Frontend vývojár', utilization: 65, hours_week: 26, target: 40, projects: 1, status: 'low' },
  { name: 'Ján Kollár', role: 'DevOps inžinier', utilization: 92, hours_week: 37, target: 40, projects: 3, status: 'high' },
  { name: 'Daniela Krajčová', role: 'QA inžinier', utilization: 75, hours_week: 30, target: 40, projects: 2, status: 'medium' },
];

const ManagerTeamView = () => (
  <div className="grid-main-side">
    <div className="card">
      <div className="card__head">
        <div>
          <h3 className="card__title">Vyťaženie tímu</h3>
          <div className="card__sub">{TEAM_MEMBERS_MGR.length} ľudí · tento týždeň</div>
        </div>
        <div className="seg">
          <button className="seg__btn is-active">Týždeň</button>
          <button className="seg__btn">Mesiac</button>
          <button className="seg__btn">Štvrťrok</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Člen tímu</th>
              <th style={{ width: 240 }}>Vyťaženie</th>
              <th>Hodiny / cieľ</th>
              <th>Projekty</th>
              <th>Stav</th>
              <th style={{ width: 80 }} />
            </tr>
          </thead>
          <tbody>
            {TEAM_MEMBERS_MGR.map(m => {
              const overloaded = m.utilization > 100;
              return (
                <tr key={m.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={m.name} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-strong)', borderRadius: 'var(--radius-pill)', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%',
                                       width: `${Math.min(m.utilization, 100)}%`,
                                       background: overloaded ? 'var(--danger)' : m.utilization > 90 ? 'var(--warning)' : 'var(--accent)',
                                       borderRadius: 'var(--radius-pill)' }} />
                        {overloaded && (
                          <div style={{ position: 'absolute', right: 0, top: -2, bottom: -2,
                                         width: `${m.utilization - 100}%`, maxWidth: '20%',
                                         background: 'var(--danger)', opacity: 0.4,
                                         borderRadius: 'var(--radius-pill)' }} />
                        )}
                      </div>
                      <span className="mono" style={{ fontSize: 12, fontWeight: 500, minWidth: 38, textAlign: 'right',
                                                       color: overloaded ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                        {m.utilization}%
                      </span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 12.5 }}>
                    {m.hours_week}h <span style={{ color: 'var(--text-tertiary)' }}>/ {m.target}h</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{m.projects}</td>
                  <td><StatusBadge map={WORKLOAD} value={m.status} /></td>
                  <td><button className="icon-btn"><I.more /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    <div className="col" style={{ gap: 16 }}>
      <div className="card">
        <div className="card__head"><h3 className="card__title">Upozornenia</h3></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { type: 'overload', text: 'Lena Horváthová má 110% vyťaženie', sub: '4h nad cieľ tento týždeň' },
            { type: 'underload', text: 'Petra Šimková je na 65%', sub: 'Možnosť priradiť ďalšiu úlohu' },
            { type: 'leave', text: '3 ľudia majú dovolenku 12.–16. máj', sub: 'Plánuj kapacitu vopred' },
          ].map((a, i) => {
            const c = a.type === 'overload' ? 'var(--danger)' : a.type === 'underload' ? 'var(--warning)' : 'var(--accent)';
            return (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px',
                                     background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ width: 4, alignSelf: 'stretch', background: c, borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.text}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{a.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3 className="card__title">Rýchle akcie</h3></div>
        <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="btn btn--ghost" style={{ justifyContent: 'flex-start' }}><I.send /> Pošli pripomienku na výkazy</button>
          <button className="btn btn--ghost" style={{ justifyContent: 'flex-start' }}><I.calendar /> Naplánuj 1:1 stretnutia</button>
          <button className="btn btn--ghost" style={{ justifyContent: 'flex-start' }}><I.fileText /> Vygeneruj report kapacít</button>
          <button className="btn btn--ghost" style={{ justifyContent: 'flex-start' }}><I.users /> Pridaj člena do tímu</button>
        </div>
      </div>
    </div>
  </div>
);

/* =========================================================
   Reports view
   ========================================================= */
const ManagerReportsView = () => {
  const months = ['nov', 'dec', 'jan', 'feb', 'mar', 'apr'];
  const billable = [620, 680, 710, 740, 820, 880];
  const internal = [180, 160, 200, 190, 170, 200];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top row: chart + breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20 }}>
        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">Hodiny v čase</h3>
              <div className="card__sub">6 mesiacov · účtovateľné vs interné</div>
            </div>
            <div className="seg">
              <button className="seg__btn">Týždeň</button>
              <button className="seg__btn is-active">Mesiac</button>
              <button className="seg__btn">Kvartál</button>
            </div>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 220, padding: '12px 4px 0' }}>
              {months.map((m, i) => {
                const total = billable[i] + internal[i];
                const max = Math.max(...billable.map((b, j) => b + internal[j]));
                return (
                  <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                    <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{total}h</div>
                      <div style={{ width: '100%', maxWidth: 56, display: 'flex', flexDirection: 'column',
                                     borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', overflow: 'hidden',
                                     height: `${(total / max) * 100}%` }}>
                        <div style={{ background: 'var(--text-tertiary)', flex: internal[i] }} title={`Interné: ${internal[i]}h`} />
                        <div style={{ background: 'var(--accent)', flex: billable[i] }} title={`Účtovateľné: ${billable[i]}h`} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{m}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: 'var(--accent)', borderRadius: 2 }} />
                Účtovateľné
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: 'var(--text-tertiary)', borderRadius: 2 }} />
                Interné
              </span>
              <div style={{ flex: 1 }} />
              <span className="mono">Spolu apríl: 1 080h · 81 % účtovateľných</span>
            </div>
          </div>
        </div>

        {/* Side stats */}
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card__head"><h3 className="card__title">Top projekty</h3></div>
            <div className="card__body" style={{ padding: 0 }}>
              {[
                ['Mobile banking 2.0', 412, 100],
                ['Fintex CRM', 298, 72],
                ['Acme migrácia', 156, 38],
                ['Onboarding flow', 124, 30],
                ['Interný — admin', 90, 22],
              ].map(([name, hours, pct]) => (
                <div key={name} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{name}</span>
                    <span className="mono" style={{ color: 'var(--text-tertiary)' }}>{hours}h</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-strong)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project finance table */}
      <div className="card">
        <div className="card__head">
          <div>
            <h3 className="card__title">Projekty v správe</h3>
            <div className="card__sub">Rozpočet, čerpanie a stav delivery</div>
          </div>
          <button className="btn btn--sm"><I.download /> Export</button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Projekt</th>
              <th style={{ width: 220 }}>Čerpanie rozpočtu</th>
              <th style={{ textAlign: 'right' }}>Účtovateľné</th>
              <th>Tím</th>
              <th>Delivery</th>
              <th>Stav</th>
            </tr>
          </thead>
          <tbody>
            {TEAM_PROJECTS_REPORT.map(p => {
              const pct = (p.spent / p.budget) * 100;
              const over = pct > 100;
              return (
                <tr key={p.name}>
                  <td>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{p.name}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--bg-strong)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`,
                                       background: over ? 'var(--danger)' : pct > 85 ? 'var(--warning)' : 'var(--success)' }} />
                      </div>
                      <span className="mono" style={{ fontSize: 12, minWidth: 80, textAlign: 'right' }}>
                        {p.spent}h / {p.budget}h
                      </span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 13, textAlign: 'right' }}>{p.billable}h</td>
                  <td><div className="avatars">{Array.from({ length: Math.min(p.members, 4) }).map((_, i) => (
                    <Avatar key={i} name={['Lena H','Mária B','Tomáš V','Petra Š','Ján K','Adam K'][i]} size="sm" />
                  ))}{p.members > 4 && <span className="avatar avatar--sm" style={{ background: 'var(--bg-strong)', color: 'var(--text-secondary)' }}>+{p.members - 4}</span>}</div></td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{p.delivery}</td>
                  <td><StatusBadge map={HEALTH_BADGE} value={p.health} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

window.ManagerPage = ManagerPage;
