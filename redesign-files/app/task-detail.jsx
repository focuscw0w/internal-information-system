/* global React */
const { useState } = React;

const TaskDetailPage = ({ taskId, projectId, onBack, onOpenTask }) => {
  const t = TASKS_DATA.find(x => x.id === taskId) || TASKS_DATA[2];
  const p = PROJECTS_DATA.find(x => x.id === projectId) || PROJECTS_DATA[0];
  const [tab, setTab] = useState('overview');
  const [comment, setComment] = useState('');

  const subtasks = [
    { id: 1, title: 'Definovať brand tokens (color, type)', done: true },
    { id: 2, title: 'Komponenty: KPI cards, badges, tabs', done: true },
    { id: 3, title: 'Layout dashboardu — desktop', done: false },
    { id: 4, title: 'Responsive variant tabletu', done: false },
    { id: 5, title: 'Hand-off do Storybooku', done: false },
  ];

  const comments = [
    { id: 1, author: 'Adam Kováč', when: 'pred 2 dňami', text: 'Na meetingu sme sa zhodli, že KPI sekcia musí byť hore — používatelia ju nájdu okamžite. @Eva môžeš to zohľadniť?' },
    { id: 2, author: 'Eva Nováková', when: 'pred 1 dňom', text: 'Jasné, pridávam. Pripravujem aj alternatívu so 4 kartami v rade. Pozri si Figma frame "v3-kpi"' },
    { id: 3, author: 'Lucia Holá', when: 'pred 3h', text: 'Druhá varianta sa mi páči viac, je vzdušnejšia. Idem to skúsiť napojiť aj na filter panel.' },
  ];

  return (
    <div className="page page-enter">
      <button className="page-head__back" onClick={onBack}><I.arrowLeft /> Späť na {p.name}</button>
      <div className="page-head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>TASK-{t.id}</span>
            <StatusBadge map={TASK_STATUS} value={t.status} />
            <StatusBadge map={PRIORITY} value={t.priority} dot={false} />
            {t.at_risk && <span className="badge badge--warning"><I.alert style={{ width: 11, height: 11 }} /> Ohrozená</span>}
          </div>
          <h1 className="page-head__title">{t.title}</h1>
          <p className="page-head__subtitle">
            Súčasť projektu <strong style={{ color: 'var(--text-secondary)' }}>{p.name}</strong> · termín {fmtDate(t.due)}
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.play /> Spustiť timer</button>
          <button className="btn btn--primary"><I.settings /> Upraviť úlohu</button>
        </div>
      </div>

      <div className="grid-main-side">
        <div className="col" style={{ gap: 16 }}>
          <TabBar
            value={tab}
            onChange={setTab}
            tabs={[
              { id: 'overview', label: 'Prehľad', icon: <I.fileText /> },
              { id: 'subtasks', label: 'Podúlohy', icon: <I.list />, count: subtasks.length },
              { id: 'time', label: 'Záznamy času', icon: <I.clock />, count: 8 },
            ]}
          />

          {tab === 'overview' && (
            <>
              <div className="card">
                <div className="card__head"><h3 className="card__title">Popis</h3></div>
                <div className="card__body" style={{ fontSize: 13.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                  <p style={{ margin: 0, marginBottom: 12 }}>
                    Vytvoriť hi-fi dizajn dashboardu pre Fintex CRM s dôrazom na rýchle nájdenie aktívnych
                    klientov a stavu pipeline. Dizajn musí byť konzistentný s novým interným design systémom
                    a funkčný v light aj dark móde.
                  </p>
                  <p style={{ margin: 0 }}>
                    Akceptačné kritériá: KPI sekcia s 4 hlavnými metrikami, recent activity feed,
                    rýchly prístup k najnovším deal-om a integrácia notifikácií.
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card__head">
                  <div>
                    <h3 className="card__title">Podúlohy</h3>
                    <div className="card__sub">{subtasks.filter(s => s.done).length} z {subtasks.length} dokončených</div>
                  </div>
                  <button className="btn btn--sm"><I.plus /> Pridať</button>
                </div>
                <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {subtasks.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                                              borderBottom: '1px solid var(--border-subtle)' }}>
                      <input type="checkbox" defaultChecked={s.done} style={{ accentColor: 'var(--accent)' }} />
                      <span style={{ flex: 1, fontSize: 13.5, color: s.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                     textDecoration: s.done ? 'line-through' : 'none' }}>
                        {s.title}
                      </span>
                      <button className="icon-btn" style={{ width: 24, height: 24 }}><I.more /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card__head">
                  <h3 className="card__title">Komentáre</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{comments.length} komentárov</span>
                </div>
                <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                      <Avatar name={c.author} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                          <strong style={{ fontSize: 13 }}>{c.author}</strong>
                          <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{c.when}</span>
                        </div>
                        <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.text}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', gap: 10 }}>
                    <Avatar name="Adam Kováč" />
                    <div style={{ flex: 1 }}>
                      <textarea className="textarea" placeholder="Napíš komentár, použi @ na zmienku..."
                                value={comment} onChange={e => setComment(e.target.value)} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <button className="btn btn--sm btn--ghost"><I.paperclip /> Priložiť</button>
                        <button className="btn btn--primary btn--sm"><I.send /> Pridať komentár</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'subtasks' && (
            <div className="card">
              <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {subtasks.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0',
                                            borderBottom: '1px solid var(--border-subtle)' }}>
                    <input type="checkbox" defaultChecked={s.done} style={{ accentColor: 'var(--accent)' }} />
                    <span style={{ flex: 1, fontSize: 13.5, color: s.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                                   textDecoration: s.done ? 'line-through' : 'none' }}>
                      {s.title}
                    </span>
                    <Avatar name="Eva Nováková" size="sm" />
                    <span className="mono dim" style={{ fontSize: 12 }}>4h</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'time' && (
            <div className="card">
              <table className="table">
                <thead><tr><th>Dátum</th><th>Používateľ</th><th>Popis</th><th>Hodiny</th></tr></thead>
                <tbody>
                  {[
                    ['28.4.2026', 'Eva Nováková', 'KPI komponent + tokens', 4.5],
                    ['28.4.2026', 'Lucia Holá', 'Layout exploration', 3],
                    ['25.4.2026', 'Eva Nováková', 'Wireframy v3', 5],
                    ['24.4.2026', 'Eva Nováková', 'Dashboard hero state', 2.5],
                    ['22.4.2026', 'Lucia Holá', 'Filter panel variants', 3 ],
                  ].map((r, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ fontSize: 12.5 }}>{r[0]}</td>
                      <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Avatar name={r[1]} size="sm" />{r[1]}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{r[2]}</td>
                      <td className="mono num">{r[3]}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card__head"><h3 className="card__title">Detaily úlohy</h3></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>Stav</div>
                <select className="select" defaultValue={t.status} style={{ width: '100%' }}>
                  {Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>Priorita</div>
                <select className="select" defaultValue={t.priority} style={{ width: '100%' }}>
                  {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>Priradení</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {t.assignees.map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, background: 'var(--bg-subtle)' }}>
                      <Avatar name={a} size="sm" />
                      <span style={{ fontSize: 13 }}>{a}</span>
                    </div>
                  ))}
                  <button className="btn btn--sm btn--ghost" style={{ justifyContent: 'flex-start' }}>
                    <I.plus /> Pridať priradenie
                  </button>
                </div>
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Termín</span>
                <span className="mono">{fmtDate(t.due)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Odhad</span>
                <span className="mono">{t.estimated}h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Strávené</span>
                <span className="mono" style={{ color: t.actual > t.estimated ? 'var(--danger-text)' : undefined }}>{t.actual}h</span>
              </div>
              <ProgressBar value={(t.actual / t.estimated) * 100} variant={t.actual > t.estimated ? 'danger' : 'accent'} />
            </div>
          </div>

          <div className="card">
            <div className="card__head"><h3 className="card__title">Aktivita</h3></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['Eva Nováková', 'zmenila stav', 'Prebieha', 'pred 3h'],
                ['Adam Kováč', 'pridelil', 'Lucia Holá', 'včera'],
                ['Marek Pohan', 'vytvoril úlohu', '', '2.4.2026'],
              ].map(([who, what, target, when], i) => (
                <div key={i} style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{who}</strong> {what}
                  {target && <> <strong>{target}</strong></>}
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.TaskDetailPage = TaskDetailPage;
