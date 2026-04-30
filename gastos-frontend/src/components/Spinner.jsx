/**
 * Spinner.jsx
 * Componente de carga reutilizable con tres variantes:
 *
 *  <Spinner />               → spinner inline pequeño (dentro de botones, listas)
 *  <Spinner fullscreen />    → overlay que cubre toda la pantalla (carga inicial de datos)
 *  <Spinner splash />        → splash screen de arranque (verificación de sesión Auth)
 *
 * Uso:
 *   import Spinner from '../components/Spinner';
 *
 *   {loading && <Spinner fullscreen message="Cargando datos..." />}
 *   {saving  && <Spinner fullscreen message="Guardando..." />}
 *   <button disabled={saving}>{saving ? <Spinner /> : 'Guardar'}</button>
 */

const SPINNER_CSS = `
  /* ── Keyframes ────────────────────────────────────────────── */
  @keyframes sp-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes sp-pulse {
    0%, 100% { transform: scale(1);   opacity: 1;   }
    50%       { transform: scale(1.1); opacity: 0.7; }
  }
  @keyframes sp-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes sp-slide-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes sp-dots {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1);   opacity: 1;   }
  }

  /* ── Inline spinner (dentro de botones / filas) ──────────── */
  .sp-inline {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: sp-spin 0.65s linear infinite;
    vertical-align: middle;
  }
  .sp-inline.sp-dark {
    border-color: rgba(91,80,232,0.25);
    border-top-color: #5b50e8;
  }

  /* ── Fullscreen overlay (carga de datos / guardado) ─────── */
  .sp-overlay {
    position: fixed; inset: 0; z-index: 999;
    background: rgba(15, 14, 35, 0.55);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center;
    animation: sp-fade-in 0.2s ease;
  }
  .sp-overlay-card {
    background: #fff;
    border-radius: 20px;
    padding: 32px 36px;
    display: flex; flex-direction: column;
    align-items: center; gap: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    animation: sp-slide-up 0.25s ease;
    min-width: 180px;
  }
  .sp-ring {
    width: 52px; height: 52px; position: relative;
  }
  .sp-ring::before,
  .sp-ring::after {
    content: '';
    position: absolute; inset: 0;
    border-radius: 50%;
    border: 4px solid transparent;
  }
  .sp-ring::before {
    border-top-color: #5b50e8;
    border-right-color: #5b50e8;
    animation: sp-spin 0.8s cubic-bezier(0.4,0,0.2,1) infinite;
  }
  .sp-ring::after {
    border-bottom-color: #c7c3f9;
    border-left-color: #c7c3f9;
    animation: sp-spin 0.8s cubic-bezier(0.4,0,0.2,1) infinite reverse;
    opacity: 0.5;
  }
  .sp-overlay-msg {
    font-size: 14px; font-weight: 600;
    color: #1a1a2e; letter-spacing: 0.1px;
    text-align: center;
  }
  .sp-overlay-dots {
    display: flex; gap: 5px; margin-top: -6px;
  }
  .sp-overlay-dots span {
    width: 6px; height: 6px; border-radius: 50%;
    background: #5b50e8; display: inline-block;
    animation: sp-dots 1.2s ease-in-out infinite;
  }
  .sp-overlay-dots span:nth-child(2) { animation-delay: 0.2s; }
  .sp-overlay-dots span:nth-child(3) { animation-delay: 0.4s; }

  /* ── Splash screen (arranque de la app) ─────────────────── */
  .sp-splash {
    position: fixed; inset: 0; z-index: 9999;
    background: linear-gradient(145deg, #1a1a2e 0%, #2d2b55 60%, #1a1a2e 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 0;
    animation: sp-fade-in 0.3s ease;
  }
  .sp-splash-logo {
    font-size: 56px;
    animation: sp-pulse 2s ease-in-out infinite;
    margin-bottom: 16px;
  }
  .sp-splash-title {
    font-size: 26px; font-weight: 800;
    color: #fff; letter-spacing: -0.5px;
    margin-bottom: 4px;
    animation: sp-slide-up 0.4s ease 0.1s both;
  }
  .sp-splash-sub {
    font-size: 13px; color: rgba(200,196,245,0.7);
    margin-bottom: 40px;
    animation: sp-slide-up 0.4s ease 0.2s both;
  }
  .sp-splash-bar-wrap {
    width: 140px; height: 3px;
    background: rgba(255,255,255,0.15);
    border-radius: 2px; overflow: hidden;
    animation: sp-slide-up 0.4s ease 0.3s both;
  }
  .sp-splash-bar {
    height: 100%; width: 40%;
    background: linear-gradient(90deg, #7c6ff7, #5b50e8);
    border-radius: 2px;
    animation: sp-splash-sweep 1.4s ease-in-out infinite;
  }
  @keyframes sp-splash-sweep {
    0%   { transform: translateX(-100%); width: 40%; }
    50%  { width: 60%; }
    100% { transform: translateX(350%); width: 40%; }
  }

  /* ── Skeleton loader (filas de lista mientras carga) ─────── */
  .sp-skeleton-list { display: flex; flex-direction: column; gap: 8px; }
  .sp-skeleton-item {
    background: #fff; border-radius: 12px;
    padding: 14px 16px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .sp-skeleton-circle {
    width: 38px; height: 38px; border-radius: 50%;
    background: #eee; flex-shrink: 0;
    animation: sp-shimmer 1.4s ease-in-out infinite;
  }
  .sp-skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 7px; }
  .sp-skeleton-line {
    height: 11px; border-radius: 6px; background: #eee;
    animation: sp-shimmer 1.4s ease-in-out infinite;
  }
  .sp-skeleton-line.short { width: 50%; }
  .sp-skeleton-line.xshort { width: 30%; }
  .sp-skeleton-rect {
    width: 72px; height: 20px; border-radius: 6px; background: #eee; flex-shrink: 0;
    animation: sp-shimmer 1.4s ease-in-out infinite;
  }
  @keyframes sp-shimmer {
    0%   { background-color: #ececec; }
    50%  { background-color: #f8f8f8; }
    100% { background-color: #ececec; }
  }
`;

// Inject CSS once
function injectSpinnerCSS() {
  if (typeof document !== 'undefined' && !document.getElementById('sp-styles')) {
    const s = document.createElement('style');
    s.id = 'sp-styles';
    s.textContent = SPINNER_CSS;
    document.head.appendChild(s);
  }
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

/** Spinner inline: para usar dentro de botones o filas */
function InlineSpinner({ dark = false }) {
  return <span className={`sp-inline${dark ? ' sp-dark' : ''}`} role="status" aria-label="Cargando" />;
}

/** Skeleton: filas fantasma mientras carga una lista */
function SkeletonList({ rows = 4 }) {
  return (
    <div className="sp-skeleton-list" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="sp-skeleton-item">
          <div className="sp-skeleton-circle" />
          <div className="sp-skeleton-lines">
            <div className="sp-skeleton-line" />
            <div className="sp-skeleton-line short" />
            <div className="sp-skeleton-line xshort" />
          </div>
          <div className="sp-skeleton-rect" />
        </div>
      ))}
    </div>
  );
}

/* ── Main export ────────────────────────────────────────────────────────── */
export default function Spinner({
  fullscreen = false,
  splash = false,
  message = 'Cargando...',
  dark = false,
  skeleton = false,
  skeletonRows = 4,
}) {
  injectSpinnerCSS();

  // 1. Splash screen de arranque
  if (splash) {
    return (
      <div className="sp-splash" role="status" aria-label="Iniciando aplicación">
        <div className="sp-splash-logo">💰</div>
        <div className="sp-splash-title">Mis Gastos</div>
        <div className="sp-splash-sub">Personal Finance</div>
        <div className="sp-splash-bar-wrap">
          <div className="sp-splash-bar" />
        </div>
      </div>
    );
  }

  // 2. Overlay fullscreen (carga de datos / guardado / eliminación)
  if (fullscreen) {
    return (
      <div className="sp-overlay" role="status" aria-live="polite">
        <div className="sp-overlay-card">
          <div className="sp-ring" />
          <div className="sp-overlay-msg">{message}</div>
          <div className="sp-overlay-dots">
            <span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  // 3. Skeleton list (reemplaza el contenido de una lista)
  if (skeleton) {
    return <SkeletonList rows={skeletonRows} />;
  }

  // 4. Inline (dentro de botones)
  return <InlineSpinner dark={dark} />;
}
