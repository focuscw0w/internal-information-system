/* global React */
const { useState, useMemo } = React;

const PEOPLE_DATA = [
  { id: 1, name: 'Adam Kováč', role: 'Project Lead', email: 'adam.kovac@firma.sk', cap: 40, load: 38, util: 95, free: 2, status: 'orange', monthly_load: 152, monthly_cap: 160, monthly_util: 95,
    history: [85, 90, 88, 92, 95, 87, 90, 93, 95, 94, 96, 95] },
  { id: 2, name: 'Júlia Beňová', role: 'Senior Developer', email: 'julia.benova@firma.sk', cap: 40, load: 46, util: 115, free: -6, status: 'red', monthly_load: 184, monthly_cap: 160, monthly_util: 115,
    history: [88, 92, 100, 105, 110, 108, 112, 115, 118, 116, 114, 115] },
  { id: 3, name: 'Marek Pohan', role: 'Backend Developer', email: 'marek.pohan@firma.sk', cap: 40, load: 42, util: 105, free: -2, status: 'red', monthly_load: 168, monthly_cap: 160, monthly_util: 105,
    history: [80, 85, 90, 95, 100, 102, 105, 103, 106, 105, 104, 105] },
  { id: 4, name: 'Eva Nováková', role: 'Senior Designer', email: 'eva.novakova@firma.sk', cap: 40, load: 32, util: 80, free: 8, status: 'green', monthly_load: 128, monthly_cap: 160, monthly_util: 80,
    history: [75, 78, 80, 82, 78, 75, 80, 82, 80, 78, 80, 80] },
  { id: 5, name: 'Tomáš Šebek', role: 'Senior Developer', email: 'tomas.sebek@firma.sk', cap: 40, load: 34, util: 85, free: 6, status: 'green', monthly_load: 136, monthly_cap: 160, monthly_util: 85,
    history: [70, 75, 78, 80, 82, 85, 84, 86, 85, 84, 85, 85] },
  { id: 6, name: 'Lucia Holá', role: 'Designer', email: 'lucia.hola@firma.sk', cap: 40, load: 28, util: 70, free: 12, status: 'green', monthly_load: 112, monthly_cap: 160, monthly_util: 70,
    history: [60, 65, 68, 70, 72, 70, 68, 72, 70, 68, 70, 70] },
  { id: 7, name: 'Peter Dobrý', role: 'Developer', email: 'peter.dobry@firma.sk', cap: 40, load: 18, util: 45, free: 22, status: 'green', monthly_load: 72, monthly_cap: 160, monthly_util: 45,
    history: [50, 55, 48, 45, 50, 48, 45, 42, 45, 48, 45, 45] },
  { id: 8, name: 'Mária Sucha', role: 'QA Engineer', email: 'maria.sucha@firma.sk', cap: 40, load: 36, util: 90, free: 4, status: 'orange', monthly_load: 144, monthly_cap: 160, monthly_util: 90,
    history: [82, 85, 88, 90, 92, 88, 90, 91, 90, 89, 90, 90] },
];

const utilColor = (u) => u > 100 ? 'danger' : u >= 90 ? 'warning' : u >= 60 ? 'accent' : 'success';
const utilStatusColor = (u) => u > 100 ? 'var(--danger)' : u >= 90 ? 'var(--warning)' : 'var(--success)';

const CapacityPage = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const overloaded = PEOPLE_DATA.filter(p => p.util > 100).sort((a, b) => b.util - a.util);
  const risky = PEOPLE_DATA.filter(p => p.util >= 90 && p.util <= 100);
  const free = PEOPLE_DATA.filter(p => p.util < 60);

  const teamCap = PEOPLE_DATA.reduce((s, p) => s + p.cap, 0);
  const teamLoad = PEOPLE_DATA.reduce((s, p) => s + p.load, 0);
  const teamUtil = Math.round((teamLoad / teamCap) * 100);

  const filtered = PEOPLE_DATA.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'overloaded') return p.util > 100;
    if (filter === 'risky') return p.util >= 90 && p.util <= 100;
    if (filter === 'free') return p.util < 60;
    return true;
  });

  return (
    <div className="page page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Kapacitné plánovanie</h1>
          <p className="page-head__subtitle">
            Prehľad ukazuje, kde tím nestíha, kto je preťažený a kde je ešte priestor na zmenu.
            Aktuálny týždeň: <strong style={{ color: 'var(--text-secondary)' }}>28. apr – 4. máj 2026</strong>
          </p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.refresh /> Sync s projektmi</button>
          <button className="btn"><I.download /> Export</button>
          <button className="btn btn--primary"><I.zap /> Spustiť simuláciu</button>
        </div>
      </div>

      {/* Alerts banner */}
      {overloaded.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                      background: 'var(--danger-soft)', border: '1px solid var(--danger-border)',
                      borderRadius: 'var(--radius-lg)', marginBottom: 20 }}>
          <I.alert style={{ color: 'var(--danger)', width: 18, height: 18, flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13.5, color: 'var(--danger-text)' }}>
            <strong>{overloaded.length} ľudí je preťažených</strong> tento týždeň. Najviac{' '}
            <strong>{overloaded[0].name}</strong> ({overloaded[0].util}%).
            Zvážte prerozdelenie úloh alebo posun deadlineov.
          </div>
          <button className="btn btn--sm" style={{ background: 'white' }}>Pozrieť odporúčania</button>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Vyťaženie tímu</span>
          <span className="kpi__value" style={{ color: utilStatusColor(teamUtil) }}>{teamUtil}<sub>%</sub></span>
          <ProgressBar value={teamUtil} variant={utilColor(teamUtil)} />
        </div>
        <div className="kpi">
          <span className="kpi__label">Preťažení</span>
          <span className="kpi__value" style={{ color: 'var(--danger-text)' }}>{overloaded.length}</span>
          <span className="kpi__delta kpi__delta--down">↑ 1 oproti minulému týždňu</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Voľná kapacita</span>
          <span className="kpi__value">{teamCap - teamLoad}<sub>h / týždeň</sub></span>
          <span className="kpi__delta kpi__delta--neutral">{free.length} ľudí má rezervu</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Predikcia projektov</span>
          <span className="kpi__value">4<sub>/ 5 stihne</sub></span>
          <span className="kpi__delta" style={{ color: 'var(--warning-text)' }}>1 projekt ohrozený</span>
        </div>
      </div>

      <div className="grid-main-side">
        <div className="col" style={{ gap: 20 }}>
          {/* Recommendations */}
          <div className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">Odporúčania</h3>
                <div className="card__sub">Akcie, ktoré dnes pomôžu uvoľniť tlak</div>
              </div>
            </div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { who: 'Júlia Beňová', from: 'Mobile banking 2.0', util: 115, action: 'presunúť 6h týždenne', to: 'Peter Dobrý', toUtil: 45 },
                { who: 'Marek Pohan', from: 'Mobile banking 2.0', util: 105, action: 'odložiť deadline o 5 dní', to: null, toUtil: null },
                { who: 'Adam Kováč', from: 'Fintex CRM', util: 95, action: 'sledovať trend, blízko stropu', to: null, toUtil: null },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                                       border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <span className="dot" style={{ background: utilStatusColor(r.util) }} />
                  <Avatar name={r.who} />
                  <div style={{ flex: 1, fontSize: 13 }}>
                    <div style={{ fontWeight: 500 }}>{r.who} <span className="mono" style={{ color: utilStatusColor(r.util), fontSize: 12 }}>{r.util}%</span></div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 2 }}>
                      Návrh: {r.action}{r.to && <> → <strong style={{ color: 'var(--text-secondary)' }}>{r.to}</strong> ({r.toUtil}%)</>}
                    </div>
                  </div>
                  <button className="btn btn--sm">Aplikovať</button>
                  <button className="btn btn--sm btn--ghost"><I.x /></button>
                </div>
              ))}
            </div>
          </div>

          {/* People */}
          <div className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">Ľudia a ich vyťaženie</h3>
                <div className="card__sub">{filtered.length} z {PEOPLE_DATA.length} členov tímu</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all', 'Všetci', PEOPLE_DATA.length], ['overloaded', 'Preťažení', overloaded.length],
                  ['risky', 'Na hranici', risky.length], ['free', 'Voľní', free.length]].map(([k, l, c]) => (
                  <button key={k} className={`btn btn--sm ${filter === k ? 'btn--primary' : ''}`}
                          onClick={() => setFilter(k)}>
                    {l} <span style={{ opacity: 0.6, marginLeft: 2 }}>{c}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="card__head" style={{ borderTop: 'none', paddingTop: 12, paddingBottom: 12 }}>
              <div className="field-wrap" style={{ flex: 1, maxWidth: 320 }}>
                <I.search />
                <input className="input input--with-icon" style={{ width: '100%' }}
                       placeholder="Hľadať osobu..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Osoba</th>
                  <th style={{ width: 280 }}>Týždeň</th>
                  <th>Vyťaženie</th>
                  <th>Voľné</th>
                  <th>12-týždenný trend</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={p.name} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{p.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1 }}><ProgressBar value={Math.min(p.util, 100)} variant={utilColor(p.util)} /></div>
                        <span className="mono" style={{ fontSize: 12, minWidth: 64, textAlign: 'right' }}>
                          {p.load}h / {p.cap}h
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ fontWeight: 600, color: utilStatusColor(p.util) }}>
                        {p.util}%
                      </span>
                    </td>
                    <td>
                      <span className="mono" style={{ fontSize: 12, color: p.free < 0 ? 'var(--danger-text)' : 'var(--text-secondary)' }}>
                        {p.free > 0 ? '+' : ''}{p.free}h
                      </span>
                    </td>
                    <td style={{ width: 140 }}>
                      <Sparkline data={p.history.map(v => ({ v, color: v > 100 ? 'var(--danger)' : v >= 90 ? 'var(--warning)' : 'var(--accent)' }))} height={28} />
                    </td>
                    <td><button className="icon-btn"><I.more /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trend */}
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">História vyťaženia tímu (12 týždňov)</h3>
              <select className="select btn--sm">
                <option>Posledných 12 týždňov</option>
                <option>Posledné 3 mesiace</option>
                <option>Tento kvartál</option>
              </select>
            </div>
            <div className="card__body">
              <TeamHistoryChart />
            </div>
          </div>
        </div>

        {/* Side: Simulator + projects */}
        <div className="col" style={{ gap: 16 }}>
          <div className="card">
            <div className="card__head">
              <div>
                <h3 className="card__title">Simulátor projektu</h3>
                <div className="card__sub">Pozri dopad zmeny tímu / deadline-u</div>
              </div>
            </div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                              color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>Projekt</div>
                <select className="select" style={{ width: '100%' }}>
                  <option>Mobile banking 2.0</option>
                  <option>Fintex CRM</option>
                  <option>Onboarding flow</option>
                </select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 500 }}>Veľkosť tímu</span>
                  <span className="mono" style={{ fontSize: 12 }}>8 ľudí</span>
                </div>
                <input type="range" className="sim-slider" min="3" max="12" defaultValue="8" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 500 }}>Posun deadline-u</span>
                  <span className="mono" style={{ fontSize: 12 }}>+0 dní</span>
                </div>
                <input type="range" className="sim-slider" min="-30" max="60" defaultValue="0" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', fontWeight: 500 }}>Zostávajúce hodiny</span>
                  <span className="mono" style={{ fontSize: 12 }}>820h</span>
                </div>
                <input type="range" className="sim-slider" min="100" max="2000" defaultValue="820" />
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div style={{ background: 'var(--warning-soft)', border: '1px solid var(--warning-border)',
                            borderRadius: 'var(--radius-md)', padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--warning-text)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>
                  Predikcia
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Projekt <strong>nestihne deadline</strong> o ~12 dní
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  Pri súčasnom tempe končí 27.8.2026
                </div>
              </div>
              <button className="btn btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
                Otvoriť detailnú simuláciu <I.arrowRight />
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card__head"><h3 className="card__title">Projekty v ohrození</h3></div>
            <div className="card__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Mobile banking 2.0', conf: 38, days: 105 },
                { name: 'Data warehouse', conf: 72, days: 152 },
                { name: 'Fintex CRM', conf: 88, days: 60 },
              ].map(p => (
                <div key={p.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span className="mono" style={{ fontSize: 12, color: p.conf < 50 ? 'var(--danger-text)' : p.conf < 75 ? 'var(--warning-text)' : 'var(--success-text)' }}>
                      {p.conf}% istota
                    </span>
                  </div>
                  <ProgressBar value={p.conf} variant={p.conf < 50 ? 'danger' : p.conf < 75 ? 'warning' : 'success'} />
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{p.days} dní do deadline-u</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamHistoryChart = () => {
  const data = Array.from({ length: 12 }, (_, i) => 70 + Math.round(Math.sin(i * 0.7) * 12 + i * 1.5));
  const max = 130;
  return (
    <div style={{ position: 'relative', height: 200 }}>
      {/* Reference lines */}
      {[100, 80, 60].map(v => (
        <div key={v} style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - v / max) * 100}%`,
                               borderTop: v === 100 ? '1px dashed var(--danger-border)' : '1px dashed var(--border)' }}>
          <span style={{ position: 'absolute', right: 0, top: -8, fontSize: 10, color: v === 100 ? 'var(--danger-text)' : 'var(--text-tertiary)', background: 'var(--bg-surface)', padding: '0 4px' }}>{v}%</span>
        </div>
      ))}
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <polyline
          points={data.map((v, i) => `${(i / (data.length - 1)) * 100},${(1 - v / max) * 100}`).join(' ')}
          fill="none" stroke="var(--accent)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
        <polygon
          points={`0,100 ${data.map((v, i) => `${(i / (data.length - 1)) * 100},${(1 - v / max) * 100}`).join(' ')} 100,100`}
          fill="var(--accent-soft)" opacity="0.5" />
        {data.map((v, i) => (
          <circle key={i} cx={(i / (data.length - 1)) * 100} cy={(1 - v / max) * 100}
                  r="0.8" fill="var(--accent)" vectorEffect="non-scaling-stroke" stroke="white" strokeWidth="0.4" />
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: -22, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-tertiary)' }}>
        {Array.from({ length: 12 }, (_, i) => <span key={i}>T{i + 9}</span>)}
      </div>
    </div>
  );
};

window.CapacityPage = CapacityPage;
