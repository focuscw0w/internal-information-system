/* global React */
const { useState } = React;

const TIME_ENTRIES = [
  { id: 1, date: '2026-04-30', user: 'Adam Kováč', project: 'Fintex CRM', task: 'Hi-fi dashboard dizajn', hours: 4.5, billable: true, status: 'approved', note: 'KPI sekcia + filtračný panel' },
  { id: 2, date: '2026-04-30', user: 'Adam Kováč', project: 'Mobile banking 2.0', task: 'Code review', hours: 1.5, billable: true, status: 'approved', note: 'PR #234, #237' },
  { id: 3, date: '2026-04-30', user: 'Adam Kováč', project: 'Interný — admin', task: 'Tímový sync', hours: 1, billable: false, status: 'approved', note: 'Týždenný stand-up' },
  { id: 4, date: '2026-04-29', user: 'Adam Kováč', project: 'Fintex CRM', task: 'Hi-fi dashboard dizajn', hours: 6, billable: true, status: 'approved', note: '' },
  { id: 5, date: '2026-04-29', user: 'Adam Kováč', project: 'Onboarding flow', task: 'Wireframy', hours: 2, billable: true, status: 'approved', note: 'Iterácia v3' },
  { id: 6, date: '2026-04-28', user: 'Adam Kováč', project: 'Fintex CRM', task: 'Klientský meeting', hours: 1.5, billable: true, status: 'pending', note: 'Review s klientom' },
  { id: 7, date: '2026-04-28', user: 'Adam Kováč', project: 'Fintex CRM', task: 'Hi-fi dashboard dizajn', hours: 5, billable: true, status: 'approved', note: '' },
  { id: 8, date: '2026-04-27', user: 'Adam Kováč', project: 'Mobile banking 2.0', task: 'Backend integration', hours: 7.5, billable: true, status: 'approved', note: 'Auth modul' },
  { id: 9, date: '2026-04-26', user: 'Adam Kováč', project: 'Interný — admin', task: 'Mentoring', hours: 2, billable: false, status: 'approved', note: 'Onboarding nový kolega' },
];

const PROJECT_COLORS = {
  'Fintex CRM': '#6366f1',
  'Mobile banking 2.0': '#0ea5e9',
  'Onboarding flow': '#10b981',
  'Interný — admin': '#94a3b8',
};

const TimeTrackingPage = () => {
  const [view, setView] = useState('week');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(2734); // seconds
  const [timerProject, setTimerProject] = useState('Fintex CRM');
  const [timerTask, setTimerTask] = useState('Hi-fi dashboard dizajn');
  const [timerNote, setTimerNote] = useState('');

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const fmtTimer = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Week computation
  const weekDays = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'];
  const weekDates = ['27.4.', '28.4.', '29.4.', '30.4.', '1.5.', '2.5.', '3.5.'];
  const weekTotals = [9.5, 6.5, 8, 7, 0, 0, 0];
  const weekTarget = 8;
  const weekTotal = weekTotals.reduce((a, b) => a + b, 0);
  const weekBillable = 28;
  const weekBillablePct = Math.round((weekBillable / weekTotal) * 100);

  // Build a project breakdown for the week
  const projectsBreakdown = [
    { name: 'Fintex CRM', hours: 17, color: PROJECT_COLORS['Fintex CRM'] },
    { name: 'Mobile banking 2.0', hours: 9, color: PROJECT_COLORS['Mobile banking 2.0'] },
    { name: 'Onboarding flow', hours: 2, color: PROJECT_COLORS['Onboarding flow'] },
    { name: 'Interný — admin', hours: 3, color: PROJECT_COLORS['Interný — admin'] },
  ];

  // Group entries by date
  const entriesByDate = TIME_ENTRIES.reduce((acc, e) => {
    (acc[e.date] = acc[e.date] || []).push(e);
    return acc;
  }, {});

  return (
    <div className="page page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Evidencia času</h1>
          <p className="page-head__subtitle">
            Sleduj hodiny strávené na projektoch. Týždeň <strong style={{ color: 'var(--text-secondary)' }}>27. apr – 3. máj 2026</strong>
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.download /> Export CSV</button>
          <button className="btn"><I.send /> Odoslať na schválenie</button>
        </div>
      </div>

      {/* Active timer banner */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 24,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ width: 4, background: running ? 'var(--success)' : 'var(--border-strong)' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
          <button
            onClick={() => setRunning(r => !r)}
            style={{
              width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: running ? 'var(--danger)' : 'var(--accent)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: running ? '0 0 0 4px var(--danger-soft)' : '0 0 0 4px var(--accent-soft)',
              transition: 'all 0.15s ease',
            }}
          >
            {running
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>
            }
          </button>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(220px, 1.6fr) minmax(220px, 1.6fr) minmax(180px, 2fr)', gap: 12 }}>
            <select className="select" value={timerProject} onChange={e => setTimerProject(e.target.value)}>
              {Object.keys(PROJECT_COLORS).map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="select" value={timerTask} onChange={e => setTimerTask(e.target.value)}>
              <option>Hi-fi dashboard dizajn</option>
              <option>Code review</option>
              <option>Klientský meeting</option>
              <option>Tímový sync</option>
            </select>
            <input className="input" placeholder="Krátka poznámka (voliteľné)..."
                   value={timerNote} onChange={e => setTimerNote(e.target.value)} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 26, fontWeight: 500, fontVariantNumeric: 'tabular-nums',
                                            color: running ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
              {fmtTimer(elapsed)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              {running ? <span style={{ color: 'var(--success-text)' }}>● Beží</span> : 'Pozastavené'}
            </div>
          </div>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Tento týždeň</span>
          <span className="kpi__value">{weekTotal}<sub>h / 40h</sub></span>
          <ProgressBar value={(weekTotal / 40) * 100} variant="accent" />
        </div>
        <div className="kpi">
          <span className="kpi__label">Účtovateľné</span>
          <span className="kpi__value">{weekBillable}<sub>h ({weekBillablePct}%)</sub></span>
          <span className="kpi__delta kpi__delta--up">+4h vs minulý týždeň</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Priemer / deň</span>
          <span className="kpi__value">{(weekTotal / 4).toFixed(1)}<sub>h</sub></span>
          <span className="kpi__delta kpi__delta--neutral">Cieľ: 8h / deň</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Tento mesiac</span>
          <span className="kpi__value">142<sub>h / 168h</sub></span>
          <ProgressBar value={(142 / 168) * 100} variant="accent" />
        </div>
      </div>

      <div className="grid-main-side">
        <div className="col" style={{ gap: 20 }}>
          {/* Weekly chart */}
          <div className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">Prehľad týždňa</h3>
                <div className="card__sub">Hodiny po dňoch a projektoch</div>
              </div>
              <div className="seg">
                <button className={`seg__btn ${view === 'week' ? 'is-active' : ''}`} onClick={() => setView('week')}>Týždeň</button>
                <button className={`seg__btn ${view === 'month' ? 'is-active' : ''}`} onClick={() => setView('month')}>Mesiac</button>
              </div>
            </div>
            <div className="card__body">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 200, padding: '0 4px' }}>
                {weekDays.map((d, i) => {
                  const h = weekTotals[i];
                  const max = Math.max(...weekTotals, 10);
                  const heightPct = (h / max) * 100;
                  return (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{h ? `${h}h` : '—'}</span>
                        <div style={{
                          width: '100%', maxWidth: 56,
                          height: `${heightPct}%`, minHeight: h ? 4 : 0,
                          background: h >= weekTarget ? 'var(--accent)' : h > 0 ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                          border: h > 0 && h < weekTarget ? '1px solid var(--accent)' : 'none',
                          borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                          position: 'relative',
                        }}>
                          {/* Target line */}
                          {h > 0 && (
                            <div style={{
                              position: 'absolute', left: -4, right: -4,
                              top: `${(1 - weekTarget / max) * 100 / (h / max) * 100}%`,
                              borderTop: '1px dashed var(--text-tertiary)', opacity: 0.4,
                            }} />
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{d}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginTop: 1 }}>{weekDates[i]}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Entries log */}
          <div className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">Záznamy</h3>
                <div className="card__sub">{TIME_ENTRIES.length} záznamov, celkom {TIME_ENTRIES.reduce((s, e) => s + e.hours, 0)}h</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="select btn--sm">
                  <option>Všetky projekty</option>
                  {Object.keys(PROJECT_COLORS).map(p => <option key={p}>{p}</option>)}
                </select>
                <button className="btn btn--primary btn--sm"><I.plus /> Manuálny záznam</button>
              </div>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {Object.entries(entriesByDate).map(([date, entries]) => {
                const dayTotal = entries.reduce((s, e) => s + e.hours, 0);
                const d = new Date(date);
                const label = ['Ne','Po','Ut','St','Št','Pi','So'][d.getDay()];
                return (
                  <div key={date}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                                   padding: '12px 24px', background: 'var(--bg-subtle)',
                                   borderTop: '1px solid var(--border-subtle)',
                                   borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{label}, {fmtDate(date)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{entries.length} záznam(y)</span>
                      </div>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{dayTotal}h</span>
                    </div>
                    {entries.map(e => (
                      <div key={e.id} style={{ display: 'grid',
                                                 gridTemplateColumns: '4px 1fr auto auto auto auto',
                                                 alignItems: 'center', gap: 14, padding: '12px 24px',
                                                 borderBottom: '1px solid var(--border-subtle)' }}>
                        <span style={{ width: 4, height: 32, background: PROJECT_COLORS[e.project], borderRadius: 2 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{e.task}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                            {e.project}{e.note && <> · {e.note}</>}
                          </div>
                        </div>
                        <span className="badge badge--neutral" style={{ fontSize: 10.5 }}>
                          {e.billable ? 'Účtovateľné' : 'Interné'}
                        </span>
                        {e.status === 'pending'
                          ? <span className="badge badge--warning" style={{ fontSize: 10.5 }}>Čaká schválenie</span>
                          : <span className="badge badge--success" style={{ fontSize: 10.5 }}><I.check style={{ width: 10, height: 10 }} /> Schválené</span>}
                        <span className="mono" style={{ fontSize: 13, fontWeight: 500, minWidth: 40, textAlign: 'right' }}>{e.hours}h</span>
                        <button className="icon-btn" style={{ width: 28, height: 28 }}><I.more /></button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side */}
        <div className="col" style={{ gap: 16 }}>
          {/* Quick add */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Pridať záznam</h3>
            </div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                                 color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Projekt</label>
                <select className="select" style={{ width: '100%' }}>
                  {Object.keys(PROJECT_COLORS).map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                                 color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Úloha</label>
                <select className="select" style={{ width: '100%' }}>
                  <option>Hi-fi dashboard dizajn</option>
                  <option>Code review</option>
                  <option>Klientský meeting</option>
                  <option>Tímový sync</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                                   color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Dátum</label>
                  <input type="date" className="input" defaultValue="2026-04-30" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                                   color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Hodiny</label>
                  <input type="number" className="input" defaultValue="2" step="0.25" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                                 color: 'var(--text-tertiary)', fontWeight: 500, display: 'block', marginBottom: 6 }}>Poznámka</label>
                <textarea className="textarea" placeholder="Čo si robil..." style={{ minHeight: 60 }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
                Účtovateľná položka
              </label>
              <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                <I.plus /> Uložiť záznam
              </button>
            </div>
          </div>

          {/* Project breakdown */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Rozloženie podľa projektov</h3>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Tento týždeň</span>
            </div>
            <div className="card__body">
              {/* Stacked bar */}
              <div style={{ display: 'flex', height: 8, borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: 16 }}>
                {projectsBreakdown.map(p => (
                  <div key={p.name} style={{ flex: p.hours, background: p.color }} title={`${p.name}: ${p.hours}h`} />
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projectsBreakdown.map(p => {
                  const pct = Math.round((p.hours / weekTotal) * 100);
                  return (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
                      <span className="mono" style={{ fontSize: 12, color: 'var(--text-tertiary)', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                      <span className="mono" style={{ fontSize: 13, fontWeight: 500, minWidth: 36, textAlign: 'right' }}>{p.hours}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent entries shortcut */}
          <div className="card">
            <div className="card__head"><h3 className="card__title">Naposledy použité</h3></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Fintex CRM', 'Hi-fi dashboard dizajn'],
                ['Mobile banking 2.0', 'Code review'],
                ['Onboarding flow', 'Wireframy'],
              ].map(([proj, task], i) => (
                <button key={i} className="btn btn--ghost" style={{ justifyContent: 'space-between', padding: '8px 10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 1, background: PROJECT_COLORS[proj] }} />
                    <span style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{task}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{proj}</div>
                    </span>
                  </span>
                  <I.play style={{ width: 12, height: 12, color: 'var(--text-tertiary)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.TimeTrackingPage = TimeTrackingPage;
