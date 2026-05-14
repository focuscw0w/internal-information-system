/* global React */
const { useState: useStateLogin } = React;

const LoginPage = ({ onSuccess }) => {
  const [email, setEmail] = useStateLogin('adam.kovac@atlas.sk');
  const [password, setPassword] = useStateLogin('');
  const [remember, setRemember] = useStateLogin(true);
  const [showPassword, setShowPassword] = useStateLogin(false);
  const [loading, setLoading] = useStateLogin(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onSuccess && onSuccess(); }, 700);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--bg-app)',
    }}>
      {/* Left — form */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '40px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-mark">C</div>
          <div className="brand-name">Cogitator
            <span className="brand-name__sub">Internal Information System</span>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
              Prihlásenie
            </h1>
            <p style={{ margin: '8px 0 28px', color: 'var(--text-tertiary)', fontSize: 14 }}>
              Zadaj svoj firemný e-mail a heslo.
            </p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lblStyle}>E-mail</label>
                <input className="input" type="email" required autoFocus
                       value={email} onChange={e => setEmail(e.target.value)}
                       style={{ width: '100%', height: 38 }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <label style={{ ...lblStyle, marginBottom: 0 }}>Heslo</label>
                  <button type="button" className="link-btn" style={{ fontSize: 12 }}
                          onClick={() => alert('Reset link sent')}>
                    Zabudli ste heslo?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassword ? 'text' : 'password'} required
                         value={password} onChange={e => setPassword(e.target.value)}
                         placeholder="••••••••"
                         style={{ width: '100%', height: 38, paddingRight: 38 }} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                          style={{ position: 'absolute', right: 6, top: 5, background: 'none',
                                    border: 'none', padding: 6, cursor: 'pointer',
                                    color: 'var(--text-tertiary)' }}>
                    {showPassword ? <I.eyeOff /> : <I.eye />}
                  </button>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                       style={{ accentColor: 'var(--accent)' }} />
                Zapamätať si ma na tomto zariadení
              </label>

              <button type="submit" className="btn btn--primary"
                      disabled={loading}
                      style={{ width: '100%', justifyContent: 'center', height: 40, fontSize: 14 }}>
                {loading ? <><I.loader style={{ animation: 'spin 0.8s linear infinite' }} /> Prihlasujem...</> : 'Prihlásiť sa'}
              </button>
            </form>

            <div style={{ marginTop: 28, padding: '14px 16px', background: 'var(--bg-subtle)',
                           border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                           fontSize: 12, color: 'var(--text-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-secondary)' }}>
                <I.lock style={{ width: 12, height: 12 }} /> Single sign-on
              </div>
              Alebo sa prihlás cez <a href="#" style={{ color: 'var(--accent-text)' }}>firemný SSO</a>.
            </div>

            <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-quaternary)', textAlign: 'center' }}>
              © 2026 Cogitator · v2.4.1
            </p>
          </div>
        </div>
      </div>

      {/* Right — visual */}
      <div style={{
        background: 'linear-gradient(135deg, oklch(0.18 0.03 264), oklch(0.10 0.02 264))',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative grid */}
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.07 }} width="100%" height="100%">
          <defs>
            <pattern id="loginGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginGrid)" />
        </svg>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                         background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                         borderRadius: 'var(--radius-pill)', fontSize: 11, letterSpacing: '0.04em',
                         textTransform: 'uppercase', fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, background: oklchVar('success'), borderRadius: '50%' }} />
            Verzia 2.4 · Apríl 2026
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            Tím, projekty a kapacita<br />v jednom systéme.
          </h2>
          <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.55, maxWidth: 420 }}>
            Plánuj projekty, sleduj odpracované hodiny, schvaľuj výkazy a prezeraj si reporty bez prepínania medzi nástrojmi.
          </p>

          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, maxWidth: 460 }}>
            {[
              ['Aktívnych projektov', '12'],
              ['Členov tímu', '34'],
              ['Záznamov za apríl', '1 247'],
              ['Priemerná utilizácia', '78 %'],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.04)',
                                     border: '1px solid rgba(255,255,255,0.10)',
                                     borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, fontSize: 12, color: 'rgba(255,255,255,0.45)',
                       display: 'flex', justifyContent: 'space-between' }}>
          <span>focuscw0w · internal-information-system</span>
          <span style={{ display: 'inline-flex', gap: 14 }}>
            <a href="#" style={{ color: 'inherit' }}>Súkromie</a>
            <a href="#" style={{ color: 'inherit' }}>Podmienky</a>
            <a href="#" style={{ color: 'inherit' }}>Podpora</a>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .link-btn { background: none; border: none; padding: 0; color: var(--accent-text); cursor: pointer; font-family: inherit; }
        .link-btn:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
};

const lblStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

const oklchVar = (n) => `var(--${n})`;

window.LoginPage = LoginPage;
