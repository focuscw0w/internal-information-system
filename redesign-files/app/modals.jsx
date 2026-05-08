/* global React */
const { useState: useStateModal } = React;

/* =========================================================
   Modal shell
   ========================================================= */
const Modal = ({ open, onClose, title, subtitle, size = 'md', footer, children }) => {
  if (!open) return null;
  const widths = { sm: 420, md: 560, lg: 720, xl: 880 };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: widths[size] }} onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle && <div className="modal__sub">{subtitle}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}><I.x /></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
};

const Field = ({ label, hint, required, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : 'auto' }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
      {label} {required && <span style={{ color: 'var(--danger-text)' }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)', marginTop: 4 }}>{hint}</div>}
  </div>
);

/* =========================================================
   Project modal (create / edit)
   ========================================================= */
const ProjectModal = ({ open, onClose, mode = 'create' }) => {
  const [team, setTeam] = useStateModal(['Lena Horváthová', 'Mária Bieliková']);
  return (
    <Modal open={open} onClose={onClose}
           title={mode === 'create' ? 'Nový projekt' : 'Upraviť projekt'}
           subtitle={mode === 'create' ? 'Vytvor projekt a priraď tím.' : 'Uprav nastavenia projektu.'}
           size="lg"
           footer={<>
             <button className="btn" onClick={onClose}>Zrušiť</button>
             <button className="btn btn--primary" onClick={onClose}>
               {mode === 'create' ? 'Vytvoriť projekt' : 'Uložiť zmeny'}
             </button>
           </>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Field label="Názov projektu" required span={2}>
          <input className="input" defaultValue={mode === 'edit' ? 'Fintex CRM' : ''}
                 placeholder="napr. Fintex CRM redesign" style={{ width: '100%' }} />
        </Field>
        <Field label="Klient" required>
          <select className="select" style={{ width: '100%' }}>
            <option>Fintex Bank a.s.</option>
            <option>Acme Corp</option>
            <option>Interný</option>
          </select>
        </Field>
        <Field label="Project lead" required>
          <select className="select" style={{ width: '100%' }}>
            <option>Lena Horváthová</option>
            <option>Adam Kováč</option>
            <option>Tomáš Varga</option>
          </select>
        </Field>
        <Field label="Začiatok">
          <input type="date" className="input" defaultValue="2026-05-01" style={{ width: '100%' }} />
        </Field>
        <Field label="Deadline">
          <input type="date" className="input" defaultValue="2026-08-15" style={{ width: '100%' }} />
        </Field>
        <Field label="Stav">
          <select className="select" style={{ width: '100%' }}>
            <option value="planning">Plánovanie</option>
            <option value="active">Aktívny</option>
            <option value="on_hold">Pozastavený</option>
          </select>
        </Field>
        <Field label="Rozpočet (hodiny)">
          <input type="number" className="input" defaultValue="1200" style={{ width: '100%' }} />
        </Field>
        <Field label="Popis" span={2}>
          <textarea className="textarea" placeholder="Krátky popis projektu, ciele, dôležité kontexty..."
                    defaultValue={mode === 'edit' ? 'Komplexný redizajn admin rozhrania pre internú banku Fintex.' : ''} />
        </Field>
        <Field label="Tím" hint="Pridaj členov, ktorí budú mať prístup k projektu" span={2}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8,
                         border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                         background: 'var(--bg-surface)', minHeight: 44 }}>
            {team.map(name => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                                         padding: '4px 8px 4px 4px', background: 'var(--bg-subtle)',
                                         border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)',
                                         fontSize: 12 }}>
                <Avatar name={name} size="sm" />
                {name}
                <button onClick={() => setTeam(team.filter(t => t !== name))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                  color: 'var(--text-tertiary)', display: 'inline-grid', placeItems: 'center' }}>
                  <I.x style={{ width: 11, height: 11 }} />
                </button>
              </span>
            ))}
            <input placeholder="+ Pridať..." style={{ border: 'none', outline: 'none', flex: 1, minWidth: 100,
                                                       fontSize: 12, background: 'transparent' }} />
          </div>
        </Field>
      </div>
    </Modal>
  );
};

/* =========================================================
   Task modal
   ========================================================= */
const TaskModal = ({ open, onClose, mode = 'create' }) => {
  const [assignees, setAssignees] = useStateModal(['Mária Bieliková']);
  return (
    <Modal open={open} onClose={onClose}
           title={mode === 'create' ? 'Nová úloha' : 'Upraviť úlohu'}
           subtitle={mode === 'create' ? 'Pridaj úlohu do projektu.' : 'TASK-1042 · Fintex CRM'}
           size="lg"
           footer={<>
             {mode === 'edit' && <button className="btn" style={{ color: 'var(--danger-text)', marginRight: 'auto' }}>Zmazať úlohu</button>}
             <button className="btn" onClick={onClose}>Zrušiť</button>
             <button className="btn btn--primary" onClick={onClose}>
               {mode === 'create' ? 'Vytvoriť úlohu' : 'Uložiť'}
             </button>
           </>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Field label="Názov úlohy" required span={2}>
          <input className="input" defaultValue={mode === 'edit' ? 'Hi-fi dashboard dizajn' : ''}
                 placeholder="napr. Implementovať login flow" style={{ width: '100%' }} />
        </Field>
        <Field label="Projekt" required>
          <select className="select" style={{ width: '100%' }}>
            <option>Fintex CRM</option>
            <option>Mobile banking 2.0</option>
            <option>Onboarding flow</option>
          </select>
        </Field>
        <Field label="Stĺpec / Stav">
          <select className="select" style={{ width: '100%' }}>
            <option>Na vykonanie</option>
            <option>Prebieha</option>
            <option>Testovanie</option>
            <option>Hotovo</option>
          </select>
        </Field>
        <Field label="Priorita">
          <select className="select" style={{ width: '100%' }}>
            <option>Nízka</option>
            <option>Stredná</option>
            <option selected>Vysoká</option>
            <option>Kritická</option>
          </select>
        </Field>
        <Field label="Termín">
          <input type="date" className="input" defaultValue="2026-05-15" style={{ width: '100%' }} />
        </Field>
        <Field label="Odhad (hodiny)">
          <input type="number" className="input" defaultValue="16" step="0.5" style={{ width: '100%' }} />
        </Field>
        <Field label="Závislosti" hint="Úloha sa môže spustiť až po dokončení">
          <select className="select" style={{ width: '100%' }}>
            <option>— Bez závislostí —</option>
            <option>TASK-1041 · Wireframy</option>
          </select>
        </Field>
        <Field label="Riešitelia" span={2}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: 8,
                         border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                         background: 'var(--bg-surface)', minHeight: 44 }}>
            {assignees.map(name => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                                         padding: '4px 8px 4px 4px', background: 'var(--bg-subtle)',
                                         border: '1px solid var(--border)', borderRadius: 'var(--radius-pill)',
                                         fontSize: 12 }}>
                <Avatar name={name} size="sm" />
                {name}
                <button onClick={() => setAssignees(assignees.filter(t => t !== name))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                  color: 'var(--text-tertiary)', display: 'inline-grid', placeItems: 'center' }}>
                  <I.x style={{ width: 11, height: 11 }} />
                </button>
              </span>
            ))}
            <input placeholder="+ Priradiť..." style={{ border: 'none', outline: 'none', flex: 1, minWidth: 100,
                                                         fontSize: 12, background: 'transparent' }} />
          </div>
        </Field>
        <Field label="Popis úlohy" span={2}>
          <textarea className="textarea" style={{ minHeight: 100 }}
                    placeholder="Acceptance criteria, kontext, linky..."
                    defaultValue={mode === 'edit' ? 'Vytvoriť hi-fi dizajn dashboardu vrátane filtrov, KPI sekcie a tabuľky transakcií.' : ''} />
        </Field>
      </div>
    </Modal>
  );
};

/* =========================================================
   Time entry modal
   ========================================================= */
const TimeEntryModal = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose}
         title="Manuálny záznam času"
         subtitle="Pridaj hodiny späť do minulosti alebo bez timera."
         size="md"
         footer={<>
           <button className="btn" onClick={onClose}>Zrušiť</button>
           <button className="btn btn--primary" onClick={onClose}>Uložiť záznam</button>
         </>}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      <Field label="Projekt" required span={2}>
        <select className="select" style={{ width: '100%' }}>
          <option>Fintex CRM</option>
          <option>Mobile banking 2.0</option>
          <option>Onboarding flow</option>
        </select>
      </Field>
      <Field label="Úloha" span={2}>
        <select className="select" style={{ width: '100%' }}>
          <option>Hi-fi dashboard dizajn</option>
          <option>Code review</option>
          <option>Klientský meeting</option>
        </select>
      </Field>
      <Field label="Dátum" required>
        <input type="date" className="input" defaultValue="2026-05-08" style={{ width: '100%' }} />
      </Field>
      <Field label="Hodiny" required>
        <input type="number" className="input" defaultValue="2" step="0.25" style={{ width: '100%' }} />
      </Field>
      <Field label="Začiatok">
        <input type="time" className="input" defaultValue="09:00" style={{ width: '100%' }} />
      </Field>
      <Field label="Koniec">
        <input type="time" className="input" defaultValue="11:00" style={{ width: '100%' }} />
      </Field>
      <Field label="Poznámka" span={2}>
        <textarea className="textarea" placeholder="Čo si robil..." style={{ minHeight: 70 }} />
      </Field>
      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8,
                     padding: '12px 14px', background: 'var(--bg-subtle)',
                     borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
          Účtovateľná položka
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <input type="checkbox" style={{ accentColor: 'var(--accent)' }} />
          Odoslať okamžite na schválenie
        </label>
      </div>
    </div>
  </Modal>
);

/* =========================================================
   User modal (invite / edit)
   ========================================================= */
const UserModal = ({ open, onClose, mode = 'create' }) => (
  <Modal open={open} onClose={onClose}
         title={mode === 'create' ? 'Pridať používateľa' : 'Upraviť používateľa'}
         subtitle={mode === 'create' ? 'Vytvor účet a pošli pozvánku e-mailom.' : 'Uprav rolu, oddelenie a prístupy.'}
         size="lg"
         footer={<>
           {mode === 'edit' && <button className="btn" style={{ color: 'var(--danger-text)', marginRight: 'auto' }}>Pozastaviť účet</button>}
           <button className="btn" onClick={onClose}>Zrušiť</button>
           <button className="btn btn--primary" onClick={onClose}>
             {mode === 'create' ? 'Vytvoriť a poslať pozvánku' : 'Uložiť zmeny'}
           </button>
         </>}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
      <Field label="Krstné meno" required>
        <input className="input" defaultValue={mode === 'edit' ? 'Mária' : ''} placeholder="napr. Mária" style={{ width: '100%' }} />
      </Field>
      <Field label="Priezvisko" required>
        <input className="input" defaultValue={mode === 'edit' ? 'Bieliková' : ''} placeholder="napr. Bieliková" style={{ width: '100%' }} />
      </Field>
      <Field label="E-mail" required span={2} hint={mode === 'create' ? 'Pošleme pozvánku s odkazom na nastavenie hesla.' : null}>
        <input type="email" className="input" defaultValue={mode === 'edit' ? 'maria.bielikova@atlas.sk' : ''}
               placeholder="meno.priezvisko@atlas.sk" style={{ width: '100%' }} />
      </Field>
      <Field label="Rola" required>
        <select className="select" style={{ width: '100%' }}>
          <option value="employee">Zamestnanec</option>
          <option value="lead">Project Lead</option>
          <option value="manager">Manažér</option>
          <option value="admin">Administrátor</option>
        </select>
      </Field>
      <Field label="Oddelenie">
        <select className="select" style={{ width: '100%' }}>
          <option>Design</option>
          <option>Engineering</option>
          <option>Product</option>
          <option>QA</option>
          <option>HR</option>
        </select>
      </Field>
      <Field label="Pozícia">
        <input className="input" defaultValue={mode === 'edit' ? 'Senior Designer' : ''} placeholder="napr. Senior Designer" style={{ width: '100%' }} />
      </Field>
      <Field label="Kapacita / týždeň (h)">
        <input type="number" className="input" defaultValue="40" step="0.5" style={{ width: '100%' }} />
      </Field>
      <Field label="Prístupy" span={2} hint="Vyber moduly, ku ktorým bude mať používateľ prístup.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
                       padding: 12, background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                       borderRadius: 'var(--radius-md)' }}>
          {[
            ['Projekty', true],
            ['Úlohy', true],
            ['Evidencia času', true],
            ['Kapacitné plánovanie', false],
            ['Manažérske schvaľovanie', false],
            ['Správa používateľov', false],
          ].map(([label, def]) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
              <input type="checkbox" defaultChecked={def} style={{ accentColor: 'var(--accent)' }} />
              {label}
            </label>
          ))}
        </div>
      </Field>
      {mode === 'create' && (
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 8,
                       padding: '12px 14px', background: 'var(--accent-soft)',
                       borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--accent-text)' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
            Vyžadovať dvojfaktorové overenie (2FA)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--accent-text)' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent)' }} />
            Poslať e-mail s pozvánkou hneď
          </label>
        </div>
      )}
    </div>
  </Modal>
);

window.Modal = Modal;
window.ProjectModal = ProjectModal;
window.TaskModal = TaskModal;
window.TimeEntryModal = TimeEntryModal;
window.UserModal = UserModal;
