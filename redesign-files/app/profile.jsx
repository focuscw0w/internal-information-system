/* global React */
const { useState: useStateP } = React;

const PROFILE_USER = {
  name: 'Adam Kováč',
  role: 'Project Lead',
  department: 'Produktové dizajn studio',
  email: 'adam.kovac@atlas.sk',
  phone: '+421 905 123 456',
  location: 'Bratislava, SK',
  timezone: 'Europe/Bratislava (CET)',
  joined: '2023-03-14',
  manager: 'Lena Horváthová',
  weekly_target: 40,
  bio: 'Vediem produktové projekty pre fintech klientov. Mám rád dobre štruktúrované systémy, kanban a presné odhady.',
  skills: ['UX research', 'Figma', 'Roadmapping', 'Stakeholder mgmt', 'Mentoring', 'Agile'],
};

const PROFILE_STATS = {
  active_projects: 4,
  open_tasks: 12,
  completed_tasks_30d: 38,
  hours_this_month: 142,
  hours_target: 168,
  on_time_rate: 94,
  utilization: 87,
};

const PROFILE_ACTIVITY = [
  { id: 1, type: 'task_done', title: 'Dokončila si úlohu', target: 'KPI panel — finálny dizajn', project: 'Fintex CRM', when: 'pred 2h' },
  { id: 2, type: 'comment', title: 'Komentovala si na úlohe', target: 'Onboarding flow v3', project: 'Onboarding flow', when: 'pred 4h' },
  { id: 3, type: 'time', title: 'Zaznamenala si čas', target: '4.5h · Hi-fi dashboard', project: 'Fintex CRM', when: 'včera' },
  { id: 4, type: 'task_assign', title: 'Bola ti pridelená úloha', target: 'Klientská prezentácia', project: 'Mobile banking 2.0', when: 'včera' },
  { id: 5, type: 'project', title: 'Bola si pridaná do projektu', target: 'Onboarding flow', project: 'Onboarding flow', when: 'pred 3d' },
];

const ACTIVITY_ICON = {
  task_done: { icon: 'check', color: 'var(--success)', bg: 'var(--success-soft)' },
  comment:   { icon: 'message', color: 'var(--accent-text)', bg: 'var(--accent-soft)' },
  time:      { icon: 'clock', color: 'var(--text-secondary)', bg: 'var(--bg-subtle)' },
  task_assign: { icon: 'flag', color: 'var(--warning-text)', bg: 'var(--warning-soft)' },
  project:   { icon: 'briefcase', color: 'var(--accent-text)', bg: 'var(--accent-soft)' },
};

const PROFILE_PROJECTS = [
  { name: 'Fintex CRM', role: 'Project Lead', progress: 64, due: '2026-07-15', status: 'active' },
  { name: 'Mobile banking 2.0', role: 'Designer', progress: 38, due: '2026-09-30', status: 'active' },
  { name: 'Onboarding flow', role: 'Designer', progress: 22, due: '2026-06-20', status: 'planning' },
  { name: 'Interný — admin', role: 'Contributor', progress: 78, due: '2026-12-31', status: 'active' },
];

const ProfilePage = () => {
  const [tab, setTab] = useStateP('overview');
  const u = PROFILE_USER;
  const s = PROFILE_STATS;

  const tabs = [
    { id: 'overview', label: 'Prehľad', icon: <I.layers /> },
    { id: 'projects', label: 'Moje projekty', icon: <I.briefcase />, count: PROFILE_PROJECTS.length },
    { id: 'activity', label: 'Aktivita', icon: <I.clock /> },
    { id: 'settings', label: 'Nastavenia', icon: <I.settings /> },
  ];

  return (
    <div className="page page-enter">
      {/* Profile header card */}
      <div className="profile-hero">
        <div className="profile-hero__cover" />
        <div className="profile-hero__body">
          <Avatar name={u.name} size="lg" />
          <div className="profile-hero__main">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <h1 className="page-head__title" style={{ marginBottom: 0 }}>{u.name}</h1>
              <span className="badge badge--accent">{u.role}</span>
              <span className="badge badge--neutral">Aktívny</span>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.briefcase style={{ width: 13, height: 13 }} />{u.department}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.users style={{ width: 13, height: 13 }} />Manažér: {u.manager}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><I.calendar style={{ width: 13, height: 13 }} />V tíme od {new Date(u.joined).toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn"><I.message /> Správa</button>
            <button className="btn btn--primary"><I.settings /> Upraviť profil</button>
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 20 }}>
        <div className="kpi">
          <span className="kpi__label">Aktívne projekty</span>
          <span className="kpi__value">{s.active_projects}</span>
          <span className="kpi__delta kpi__delta--neutral">vedie 1, prispieva do 3</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Otvorené úlohy</span>
          <span className="kpi__value">{s.open_tasks}</span>
          <span className="kpi__delta kpi__delta--up">+{s.completed_tasks_30d} dokončených (30d)</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Hodiny tento mesiac</span>
          <span className="kpi__value">{s.hours_this_month}<sub>h / {s.hours_target}h</sub></span>
          <ProgressBar value={(s.hours_this_month / s.hours_target) * 100} />
        </div>
        <div className="kpi">
          <span className="kpi__label">Včas dokončené</span>
          <span className="kpi__value">{s.on_time_rate}<sub>%</sub></span>
          <span className="kpi__delta kpi__delta--up">+3% vs minulý mesiac</span>
        </div>
      </div>

      <div className="tabbar" style={{ marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
            {t.count !== undefined && <span className="tab__count">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid-main-side">
          <div className="col" style={{ gap: 20 }}>
            <div className="card">
              <div className="card__head"><h3 className="card__title">O mne</h3></div>
              <div className="card__body" style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.6 }}>
                {u.bio}
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Zručnosti</h3></div>
              <div className="card__body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {u.skills.map(sk => <span key={sk} className="badge badge--neutral" style={{ fontSize: 12.5 }}>{sk}</span>)}
              </div>
            </div>

            <div className="card">
              <div className="card__head">
                <h3 className="card__title">Posledná aktivita</h3>
                <button className="btn btn--ghost btn--sm">Všetka aktivita <I.arrowRight /></button>
              </div>
              <div className="card__body" style={{ padding: 0 }}>
                {PROFILE_ACTIVITY.map((a, i) => {
                  const ic = ACTIVITY_ICON[a.type];
                  const Ic = I[ic.icon];
                  return (
                    <div key={a.id} style={{ display: 'flex', gap: 12, padding: '14px 18px',
                                              borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)',
                                    background: ic.bg, color: ic.color,
                                    display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <Ic style={{ width: 14, height: 14 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: 'var(--text-tertiary)' }}>{a.title}: </span>
                          <strong style={{ fontWeight: 500 }}>{a.target}</strong>
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{a.project} · {a.when}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card__head"><h3 className="card__title">Kontakt</h3></div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['E-mail', u.email],
                  ['Telefón', u.phone],
                  ['Lokalita', u.location],
                  ['Časové pásmo', u.timezone],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                    <span style={{ fontWeight: 500, textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Tento týždeň</h3></div>
              <div className="card__body">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                  <span className="mono" style={{ fontSize: 24, fontWeight: 600 }}>30.5</span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>z {u.weekly_target}h</span>
                </div>
                <ProgressBar value={(30.5 / u.weekly_target) * 100} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 6 }}>
                  <span>Vyťaženie</span><span>{s.utilization}%</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__head"><h3 className="card__title">Odznaky</h3></div>
              <div className="card__body" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { name: 'Top performer', icon: 'zap', color: 'var(--warning)', bg: 'var(--warning-soft)' },
                  { name: 'Mentor', icon: 'users', color: 'var(--accent-text)', bg: 'var(--accent-soft)' },
                  { name: 'Včas vždy', icon: 'check', color: 'var(--success)', bg: 'var(--success-soft)' },
                ].map(b => {
                  const Ic = I[b.icon];
                  return (
                    <div key={b.name} style={{ textAlign: 'center', padding: '10px 6px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: b.bg, color: b.color,
                                    display: 'grid', placeItems: 'center', margin: '0 auto 6px' }}>
                        <Ic style={{ width: 18, height: 18 }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{b.name}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'projects' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Projekt</th>
                <th>Rola</th>
                <th>Postup</th>
                <th>Deadline</th>
                <th>Stav</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {PROFILE_PROJECTS.map((p, i) => (
                <tr key={i}>
                  <td><strong style={{ fontWeight: 500 }}>{p.name}</strong></td>
                  <td><span className="badge badge--neutral">{p.role}</span></td>
                  <td style={{ width: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ProgressBar value={p.progress} />
                      <span className="mono" style={{ fontSize: 12, minWidth: 32 }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{new Date(p.due).toLocaleDateString('sk-SK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><StatusBadge map={PROJECT_STATUS} value={p.status} /></td>
                  <td><button className="icon-btn"><I.more /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card">
          <div className="card__body" style={{ padding: 0 }}>
            {[...PROFILE_ACTIVITY, ...PROFILE_ACTIVITY.map(a => ({ ...a, id: a.id + 100, when: 'pred týždňom' }))].map((a, i) => {
              const ic = ACTIVITY_ICON[a.type];
              const Ic = I[ic.icon];
              return (
                <div key={a.id} style={{ display: 'flex', gap: 12, padding: '14px 18px',
                                          borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-md)',
                                background: ic.bg, color: ic.color,
                                display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <Ic style={{ width: 14, height: 14 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{a.title}: </span>
                      <strong style={{ fontWeight: 500 }}>{a.target}</strong>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 2 }}>{a.project} · {a.when}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="grid-main-side">
          <div className="card">
            <div className="card__head"><h3 className="card__title">Profilové údaje</h3></div>
            <div className="card__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                ['Meno', u.name], ['Rola', u.role], ['E-mail', u.email],
                ['Telefón', u.phone], ['Lokalita', u.location], ['Časové pásmo', u.timezone],
              ].map(([k, v]) => (
                <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 500 }}>{k}</span>
                  <input className="input" defaultValue={v} />
                </label>
              ))}
              <label style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 500 }}>Bio</span>
                <textarea className="textarea" defaultValue={u.bio} />
              </label>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn">Zrušiť</button>
                <button className="btn btn--primary">Uložiť zmeny</button>
              </div>
            </div>
          </div>
          <div className="col" style={{ gap: 16 }}>
            <div className="card">
              <div className="card__head"><h3 className="card__title">Notifikácie</h3></div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  ['Nové úlohy', true], ['Komentáre na mojich úlohách', true],
                  ['Pripomienky deadlinov', true], ['Týždenný report', false],
                  ['Mentions (@adam)', true],
                ].map(([k, v]) => (
                  <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span>{k}</span>
                    <input type="checkbox" defaultChecked={v} style={{ accentColor: 'var(--accent)' }} />
                  </label>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card__head"><h3 className="card__title">Bezpečnosť</h3></div>
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn" style={{ justifyContent: 'flex-start' }}>Zmeniť heslo</button>
                <button className="btn" style={{ justifyContent: 'flex-start' }}>Dvojfázové overenie</button>
                <button className="btn" style={{ justifyContent: 'flex-start' }}>Aktívne relácie (3)</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

window.ProfilePage = ProfilePage;
