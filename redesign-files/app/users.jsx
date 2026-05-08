/* global React */
const { useState: useStateUsers, useMemo: useMemoUsers } = React;

const USERS_DATA = [
  { id: 1, name: 'Adam Kováč', email: 'adam.kovac@atlas.sk', role: 'project_lead', department: 'Design Studio', status: 'active', last_active: 'pred 5 min', joined: '2023-03-14', projects: 4, hours_30d: 142, two_factor: true },
  { id: 2, name: 'Lena Horváthová', email: 'lena.horvathova@atlas.sk', role: 'admin', department: 'Vedenie', status: 'active', last_active: 'pred 12 min', joined: '2021-08-02', projects: 8, hours_30d: 168, two_factor: true },
  { id: 3, name: 'Marek Polák', email: 'marek.polak@atlas.sk', role: 'developer', department: 'Engineering', status: 'active', last_active: 'pred 2h', joined: '2024-01-15', projects: 3, hours_30d: 156, two_factor: true },
  { id: 4, name: 'Petra Nováková', email: 'petra.novakova@atlas.sk', role: 'designer', department: 'Design Studio', status: 'active', last_active: 'pred 30 min', joined: '2024-06-20', projects: 5, hours_30d: 144, two_factor: false },
  { id: 5, name: 'Tomáš Varga', email: 'tomas.varga@atlas.sk', role: 'developer', department: 'Engineering', status: 'active', last_active: 'pred 1h', joined: '2023-11-10', projects: 4, hours_30d: 162, two_factor: true },
  { id: 6, name: 'Jana Lukáčová', email: 'jana.lukacova@atlas.sk', role: 'pm', department: 'Operations', status: 'active', last_active: 'pred 3h', joined: '2022-04-05', projects: 6, hours_30d: 138, two_factor: true },
  { id: 7, name: 'Igor Beňo', email: 'igor.beno@atlas.sk', role: 'developer', department: 'Engineering', status: 'inactive', last_active: 'pred 8 dňami', joined: '2023-07-18', projects: 0, hours_30d: 12, two_factor: false },
  { id: 8, name: 'Sofia Mikulová', email: 'sofia.mikulova@atlas.sk', role: 'designer', department: 'Design Studio', status: 'active', last_active: 'pred 45 min', joined: '2025-01-08', projects: 3, hours_30d: 134, two_factor: true },
  { id: 9, name: 'Roman Kádek', email: 'roman.kadek@atlas.sk', role: 'pm', department: 'Operations', status: 'pending', last_active: 'nikdy', joined: '2026-04-28', projects: 0, hours_30d: 0, two_factor: false },
  { id: 10, name: 'Viera Šimková', email: 'viera.simkova@atlas.sk', role: 'finance', department: 'Finance', status: 'active', last_active: 'pred 4h', joined: '2022-09-12', projects: 2, hours_30d: 152, two_factor: true },
  { id: 11, name: 'Daniel Repák', email: 'daniel.repak@atlas.sk', role: 'developer', department: 'Engineering', status: 'active', last_active: 'pred 1d', joined: '2024-03-22', projects: 3, hours_30d: 148, two_factor: true },
  { id: 12, name: 'Karol Bednár', email: 'karol.bednar@atlas.sk', role: 'developer', department: 'Engineering', status: 'suspended', last_active: 'pred 21 dňami', joined: '2023-02-01', projects: 0, hours_30d: 0, two_factor: false },
];

const ROLE_MAP = {
  admin: { label: 'Administrátor', cls: 'badge--danger' },
  project_lead: { label: 'Project Lead', cls: 'badge--accent' },
  pm: { label: 'Project Manager', cls: 'badge--accent' },
  developer: { label: 'Vývojár', cls: 'badge--neutral' },
  designer: { label: 'Dizajnér', cls: 'badge--neutral' },
  finance: { label: 'Finance', cls: 'badge--warning' },
};

const USER_STATUS = {
  active: { label: 'Aktívny', cls: 'badge--success' },
  inactive: { label: 'Neaktívny', cls: 'badge--neutral' },
  pending: { label: 'Pozvaný', cls: 'badge--warning' },
  suspended: { label: 'Pozastavený', cls: 'badge--danger' },
};

const UsersPage = () => {
  const [userModal, setUserModal] = useStateUsers(null);
  const [search, setSearch] = useStateUsers('');
  const [roleFilter, setRoleFilter] = useStateUsers('');
  const [statusFilter, setStatusFilter] = useStateUsers('');
  const [deptFilter, setDeptFilter] = useStateUsers('');
  const [selected, setSelected] = useStateUsers(new Set());
  const [drawerUser, setDrawerUser] = useStateUsers(null);

  const filtered = useMemoUsers(() => {
    return USERS_DATA.filter(u => {
      if (search && !`${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter && u.status !== statusFilter) return false;
      if (deptFilter && u.department !== deptFilter) return false;
      return true;
    });
  }, [search, roleFilter, statusFilter, deptFilter]);

  const departments = [...new Set(USERS_DATA.map(u => u.department))];

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };
  const toggle = (id) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const stats = {
    total: USERS_DATA.length,
    active: USERS_DATA.filter(u => u.status === 'active').length,
    pending: USERS_DATA.filter(u => u.status === 'pending').length,
    no_2fa: USERS_DATA.filter(u => !u.two_factor && u.status === 'active').length,
  };

  return (
    <div className="page page-enter">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Správa používateľov</h1>
          <p className="page-head__subtitle">Spravuj prístupy, role a oprávnenia členov tímu.</p>
        </div>
        <div className="page-head__actions">
          <button className="btn"><I.download /> Export</button>
          <button className="btn"><I.users /> Skupiny a role</button>
          <button className="btn btn--primary" onClick={() => setUserModal('create')}><I.plus /> Pridať používateľa</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi__label">Celkom používateľov</span>
          <span className="kpi__value">{stats.total}</span>
          <span className="kpi__delta kpi__delta--up">+2 tento mesiac</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Aktívni</span>
          <span className="kpi__value">{stats.active}</span>
          <span className="kpi__delta kpi__delta--neutral">{Math.round((stats.active / stats.total) * 100)}% z celku</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Čakajúce pozvánky</span>
          <span className="kpi__value">{stats.pending}</span>
          <span className="kpi__delta kpi__delta--neutral">Pripomenúť?</span>
        </div>
        <div className="kpi">
          <span className="kpi__label">Bez 2FA</span>
          <span className="kpi__value" style={{ color: stats.no_2fa > 0 ? 'var(--danger-text)' : 'inherit' }}>{stats.no_2fa}</span>
          <span className="kpi__delta kpi__delta--down">Bezpečnostné riziko</span>
        </div>
      </div>

      {/* Command bar */}
      <div className="command-bar">
        <div className="field-wrap command-bar__search">
          <I.search />
          <input className="input input--with-icon" style={{ width: '100%' }}
                 placeholder="Hľadať podľa mena alebo e-mailu..."
                 value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="command-bar__filters">
          <select className="select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Všetky role</option>
            {Object.entries(ROLE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Všetky stavy</option>
            {Object.entries(USER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">Všetky oddelenia</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="command-bar__spacer" />
        <div className="command-bar__actions">
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{filtered.length} z {USERS_DATA.length}</span>
        </div>
      </div>

      {/* Bulk actions banner */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                       background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
                       borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-text)' }}>
            Vybraných {selected.size} {selected.size === 1 ? 'používateľ' : 'používateľov'}
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn btn--sm">Zmeniť rolu</button>
          <button className="btn btn--sm">Pozastaviť</button>
          <button className="btn btn--sm" style={{ color: 'var(--danger-text)' }}>Odstrániť</button>
          <button className="icon-btn" onClick={() => setSelected(new Set())} style={{ width: 26, height: 26 }}><I.x /></button>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                       onChange={toggleAll} style={{ accentColor: 'var(--accent)' }} />
              </th>
              <th>Používateľ</th>
              <th>Rola</th>
              <th>Oddelenie</th>
              <th>Stav</th>
              <th style={{ textAlign: 'right' }}>Projekty</th>
              <th style={{ textAlign: 'right' }}>Hodín / 30d</th>
              <th>2FA</th>
              <th>Posledná aktivita</th>
              <th style={{ width: 36 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} onClick={() => setDrawerUser(u)}>
                <td onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggle(u.id)}
                         style={{ accentColor: 'var(--accent)' }} />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><StatusBadge map={ROLE_MAP} value={u.role} dot={false} /></td>
                <td style={{ fontSize: 13 }}>{u.department}</td>
                <td><StatusBadge map={USER_STATUS} value={u.status} /></td>
                <td className="mono" style={{ textAlign: 'right' }}>{u.projects}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{u.hours_30d}h</td>
                <td>
                  {u.two_factor
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--success-text)' }}><I.check style={{ width: 12, height: 12 }} /> ON</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-tertiary)' }}><I.x style={{ width: 12, height: 12 }} /> OFF</span>}
                </td>
                <td style={{ fontSize: 12.5, color: 'var(--text-tertiary)' }}>{u.last_active}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="icon-btn"><I.more /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User detail drawer */}
      {drawerUser && (
        <>
          <div onClick={() => setDrawerUser(null)} style={{
            position: 'fixed', inset: 0, background: 'rgba(15,12,9,0.3)', zIndex: 50,
            animation: 'fadeIn .15s ease',
          }} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 51,
            background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight .2s cubic-bezier(.2,.8,.2,1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Detail používateľa</h3>
              <button className="icon-btn" onClick={() => setDrawerUser(null)}><I.x /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <Avatar name={drawerUser.name} size="lg" />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>{drawerUser.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{drawerUser.email}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <StatusBadge map={ROLE_MAP} value={drawerUser.role} dot={false} />
                    <StatusBadge map={USER_STATUS} value={drawerUser.status} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div className="card card--inset" style={{ padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Aktívne projekty</div>
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{drawerUser.projects}</div>
                </div>
                <div className="card card--inset" style={{ padding: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Hodín za 30d</div>
                  <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{drawerUser.hours_30d}h</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  ['Oddelenie', drawerUser.department],
                  ['Pridaný', new Date(drawerUser.joined).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' })],
                  ['Posledná aktivita', drawerUser.last_active],
                  ['Dvojfázové overenie', drawerUser.two_factor ? '✓ Aktívne' : '✗ Vypnuté'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{k}</span>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 8 }}>
                  Oprávnenia
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Vytvárať projekty', drawerUser.role === 'admin' || drawerUser.role === 'project_lead'],
                    ['Spravovať tímy', drawerUser.role === 'admin' || drawerUser.role === 'pm'],
                    ['Pristupovať k financiám', drawerUser.role === 'admin' || drawerUser.role === 'finance'],
                    ['Spravovať používateľov', drawerUser.role === 'admin'],
                    ['Schvaľovať čas', drawerUser.role === 'admin' || drawerUser.role === 'project_lead' || drawerUser.role === 'pm'],
                  ].map(([k, v]) => (
                    <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span>{k}</span>
                      <input type="checkbox" defaultChecked={v} style={{ accentColor: 'var(--accent)' }} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }}>Resetovať heslo</button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', color: 'var(--danger-text)' }}>Pozastaviť</button>
              <button className="btn btn--primary" style={{ flex: 1, justifyContent: 'center' }}>Uložiť</button>
            </div>
          </div>
        </>
      )}
      <UserModal open={!!userModal} mode={userModal} onClose={() => setUserModal(null)} />
    </div>
  );
};

window.UsersPage = UsersPage;
