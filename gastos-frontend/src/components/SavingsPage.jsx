// gastos-frontend/src/pages/SavingsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0);

const fmtDate = (d) => {
  if (!d) return '';
  const clean = String(d).slice(0, 10);
  const [year, month, day] = clean.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const today = () => new Date().toISOString().split('T')[0];

/* ── Preset icons & colors ────────────────────────────────────────────────── */
const ICONS   = ['🎯','🏠','✈️','🚗','💻','📱','🎓','💍','🏖️','🐶','💪','🎁','🏋️','🌍','⚽'];
const COLORS  = [
  '#5b50e8','#27ae60','#e74c3c','#f39c12','#3498db',
  '#9b59b6','#1abc9c','#e67e22','#e91e63','#00bcd4',
];

/* ── CSS ──────────────────────────────────────────────────────────────────── */
const SAVINGS_CSS = `
  .sav-grid { display: flex; flex-direction: column; gap: 16px; }

  /* Goal card */
  .sav-goal-card {
    background: #fff; border-radius: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.07);
    overflow: hidden; transition: box-shadow 0.2s;
  }
  .sav-goal-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.11); }
  .sav-goal-header {
    padding: 16px 18px 12px;
    display: flex; align-items: flex-start; gap: 12;
  }
  .sav-goal-icon {
    width: 48px; height: 48px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px;
  }
  .sav-goal-info { flex: 1; min-width: 0; }
  .sav-goal-name { font-size: 16px; font-weight: 800; color: #1a1a2e; margin-bottom: 2px; }
  .sav-goal-meta { font-size: 12px; color: #888; }
  .sav-goal-actions { display: flex; gap: 6px; flex-shrink: 0; }

  /* Progress bar */
  .sav-progress-wrap { padding: 0 18px 6px; }
  .sav-progress-labels {
    display: flex; justify-content: space-between; align-items: baseline;
    margin-bottom: 7px;
  }
  .sav-progress-saved { font-size: 20px; font-weight: 800; }
  .sav-progress-target { font-size: 13px; color: #888; }
  .sav-bar-bg {
    height: 12px; background: #f0f0f0; border-radius: 8px; overflow: hidden;
  }
  .sav-bar-fill {
    height: 100%; border-radius: 8px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative; overflow: hidden;
  }
  .sav-bar-fill::after {
    content: '';
    position: absolute; top: 0; left: -100%; right: 0; bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
    animation: sav-shine 2s ease-in-out infinite;
  }
  @keyframes sav-shine {
    0% { left: -100%; } 60%,100% { left: 100%; }
  }
  .sav-progress-pct {
    text-align: right; font-size: 11px; font-weight: 700; margin-top: 5px;
  }

  /* Milestones */
  .sav-milestones {
    display: flex; gap: 4px; padding: 8px 18px 0;
  }
  .sav-milestone {
    flex: 1; height: 4px; border-radius: 2px; background: #f0f0f0;
    position: relative;
  }
  .sav-milestone.reached { background: currentColor; }
  .sav-milestone-label {
    position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
    font-size: 9px; color: #bbb; white-space: nowrap;
  }

  /* Footer */
  .sav-goal-footer {
    padding: 12px 18px 16px;
    display: flex; gap: 8px; align-items: center;
  }
  .sav-btn-deposit {
    flex: 1; padding: 11px 14px; border-radius: 10px; border: none;
    font-size: 14px; font-weight: 700; color: #fff; cursor: pointer;
    transition: opacity 0.2s, transform 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .sav-btn-deposit:hover { opacity: 0.88; transform: translateY(-1px); }
  .sav-btn-history {
    padding: 11px 14px; border-radius: 10px;
    background: #f5f5f5; color: #555; border: none;
    font-size: 13px; font-weight: 600; cursor: pointer;
    white-space: nowrap; transition: background 0.15s;
  }
  .sav-btn-history:hover { background: #eee; }

  /* Completed badge */
  .sav-completed-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #eafaf1; color: #27ae60;
    font-size: 12px; font-weight: 700;
    padding: 4px 10px; border-radius: 20px;
    margin: 0 18px 12px;
  }

  /* New goal card */
  .sav-new-card {
    background: #fff; border-radius: 16px;
    border: 2px dashed #e0ddf5;
    padding: 28px; text-align: center;
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .sav-new-card:hover { border-color: #5b50e8; background: #faf9ff; }
  .sav-new-icon { font-size: 32px; }
  .sav-new-label { font-size: 14px; font-weight: 700; color: #5b50e8; }
  .sav-new-sub { font-size: 12px; color: #bbb; }

  /* Summary card */
  .sav-summary {
    background: linear-gradient(135deg, #5b50e8, #7c6ff7);
    border-radius: 16px; padding: 20px 18px;
    color: #fff; margin-bottom: 4px;
    display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
  }
  @media (max-width: 479px) { .sav-summary { grid-template-columns: 1fr; gap: 8px; } }
  .sav-summary-item { text-align: center; }
  .sav-summary-label { font-size: 11px; opacity: 0.75; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .sav-summary-value { font-size: 18px; font-weight: 800; }

  /* Icon & color pickers */
  .sav-picker-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .sav-icon-btn {
    width: 40px; height: 40px; border-radius: 10px; border: 2px solid #f0f0f0;
    background: #fafafe; cursor: pointer; font-size: 20px;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s, transform 0.1s;
  }
  .sav-icon-btn.selected { border-color: #5b50e8; transform: scale(1.1); }
  .sav-color-btn {
    width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent;
    cursor: pointer; transition: border-color 0.15s, transform 0.1s;
  }
  .sav-color-btn.selected { border-color: #1a1a2e; transform: scale(1.15); }

  /* Deposit history */
  .sav-deposit-list { display: flex; flex-direction: column; gap: 8px; max-height: 48vh; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e0ddf5 transparent; }
  .sav-deposit-list::-webkit-scrollbar { width: 4px; }
  .sav-deposit-list::-webkit-scrollbar-thumb { background: #e0ddf5; border-radius: 4px; }
  .sav-deposit-item {
    display: flex; align-items: center; gap: 10px;
    background: #fafafe; border-radius: 10px; padding: 10px 12px;
    border-left: 3px solid currentColor;
  }
  .sav-deposit-info { flex: 1; min-width: 0; }
  .sav-deposit-amount { font-weight: 800; font-size: 15px; flex-shrink: 0; }
  .sav-deposit-note { font-size: 12px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sav-deposit-date { font-size: 11px; color: #bbb; }
`;

function injectCSS() {
  if (!document.getElementById('sav-styles')) {
    const s = document.createElement('style');
    s.id = 'sav-styles'; s.textContent = SAVINGS_CSS;
    document.head.appendChild(s);
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function SavingsPage() {
  useEffect(() => { injectCSS(); }, []);

  const [goals, setGoals]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [deletingId, setDeletingId]   = useState(null);

  // Modal estados
  const [showGoalForm, setShowGoalForm]       = useState(false);
  const [editGoal, setEditGoal]               = useState(null);
  const [showDepositForm, setShowDepositForm] = useState(null); // goal object
  const [showHistory, setShowHistory]         = useState(null); // goal object
  const [deposits, setDeposits]               = useState([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  // Goal form
  const [goalForm, setGoalForm] = useState({ name: '', target: '', icon: '🎯', color: '#5b50e8' });
  // Deposit form
  const [depForm, setDepForm]   = useState({ amount: '', note: '', date: today() });

  /* ── Load goals ── */
  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/savings/goals');
      setGoals(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadGoals(); }, [loadGoals]);

  /* ── Load deposits for a goal ── */
  const loadDeposits = async (goalId) => {
    setLoadingDeposits(true);
    try {
      const res = await api.get(`/savings/deposits/${goalId}`);
      setDeposits(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingDeposits(false); }
  };

  /* ── Summary ── */
  const totalSaved  = goals.reduce((s, g) => s + parseFloat(g.saved || 0), 0);
  const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target || 0), 0);
  const completed   = goals.filter(g => parseFloat(g.saved) >= parseFloat(g.target)).length;

  /* ── Save goal ── */
  const saveGoal = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editGoal) await api.put(`/savings/goals/${editGoal.id}`, goalForm);
      else          await api.post('/savings/goals', goalForm);
      closeGoalForm(); await loadGoals();
    } finally { setSaving(false); }
  };

  /* ── Save deposit ── */
  const saveDeposit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/savings/deposits', { ...depForm, goal_id: showDepositForm.id });
      setShowDepositForm(null);
      setDepForm({ amount: '', note: '', date: today() });
      await loadGoals();
    } finally { setSaving(false); }
  };

  /* ── Delete goal ── */
  const deleteGoal = async (id) => {
    if (!window.confirm('¿Archivar esta meta? Los depósitos se conservan.')) return;
    setDeletingId(id);
    try { await api.delete(`/savings/goals/${id}`); await loadGoals(); }
    finally { setDeletingId(null); }
  };

  /* ── Delete deposit ── */
  const deleteDeposit = async (id, goalId) => {
    if (!window.confirm('¿Eliminar este depósito?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/savings/deposits/${id}`);
      await loadDeposits(goalId);
      await loadGoals();
    } finally { setDeletingId(null); }
  };

  const openEditGoal = (goal) => {
    setEditGoal(goal);
    setGoalForm({ name: goal.name, target: goal.target, icon: goal.icon, color: goal.color });
    setShowGoalForm(true);
  };
  const closeGoalForm = () => {
    setShowGoalForm(false); setEditGoal(null);
    setGoalForm({ name: '', target: '', icon: '🎯', color: '#5b50e8' });
  };

  /* ── Render ── */
  if (loading) return <Spinner skeleton skeletonRows={3} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Overlay guardar */}
      {saving && <Spinner fullscreen message="Guardando..." />}

      {/* Summary */}
      {goals.length > 0 && (
        <div className="sav-summary">
          <div className="sav-summary-item">
            <div className="sav-summary-label">Total ahorrado</div>
            <div className="sav-summary-value">{fmt(totalSaved)}</div>
          </div>
          <div className="sav-summary-item">
            <div className="sav-summary-label">Meta total</div>
            <div className="sav-summary-value">{fmt(totalTarget)}</div>
          </div>
          <div className="sav-summary-item">
            <div className="sav-summary-label">Metas cumplidas</div>
            <div className="sav-summary-value">{completed} / {goals.length}</div>
          </div>
        </div>
      )}

      {/* Goal cards */}
      <div className="sav-grid">
        {goals.map(goal => {
          const saved     = parseFloat(goal.saved || 0);
          const target    = parseFloat(goal.target);
          const pct       = Math.min(100, target > 0 ? (saved / target) * 100 : 0);
          const remaining = Math.max(0, target - saved);
          const done      = saved >= target;
          const isDeleting = deletingId === goal.id;

          return (
            <div key={goal.id} className="sav-goal-card" style={{ opacity: isDeleting ? 0.5 : 1 }}>

              {/* Header */}
              <div className="sav-goal-header" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 18px 12px' }}>
                <div className="sav-goal-icon" style={{ background: `${goal.color}18` }}>
                  {goal.icon}
                </div>
                <div className="sav-goal-info">
                  <div className="sav-goal-name">{goal.name}</div>
                  <div className="sav-goal-meta">
                    {done ? 'Meta alcanzada 🎉' : `Faltan ${fmt(remaining)}`}
                  </div>
                </div>
                <div className="sav-goal-actions">
                  <button
                    className="gapp-btn-icon" style={{ background: '#ede9ff', color: '#5b50e8' }}
                    onClick={() => openEditGoal(goal)} disabled={isDeleting}
                  >✏️</button>
                  <button
                    className="gapp-btn-icon" style={{ background: '#fdecea', color: '#e74c3c' }}
                    onClick={() => deleteGoal(goal.id)} disabled={isDeleting}
                  >🗑️</button>
                </div>
              </div>

              {/* Completed badge */}
              {done && (
                <div className="sav-completed-badge">✅ ¡Meta completada!</div>
              )}

              {/* Progress */}
              <div className="sav-progress-wrap">
                <div className="sav-progress-labels">
                  <span className="sav-progress-saved" style={{ color: goal.color }}>{fmt(saved)}</span>
                  <span className="sav-progress-target">de {fmt(target)}</span>
                </div>
                <div className="sav-bar-bg">
                  <div
                    className="sav-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: done
                        ? `linear-gradient(90deg, ${goal.color}, #27ae60)`
                        : `linear-gradient(90deg, ${goal.color}cc, ${goal.color})`,
                    }}
                  />
                </div>
                <div className="sav-progress-pct" style={{ color: goal.color }}>
                  {pct.toFixed(1)}%
                </div>
              </div>

              {/* Milestone markers 25/50/75/100 */}
              <div className="sav-milestones">
                {[25, 50, 75, 100].map(m => (
                  <div
                    key={m}
                    className={`sav-milestone${pct >= m ? ' reached' : ''}`}
                    style={{ color: goal.color }}
                  >
                    <span className="sav-milestone-label">{m}%</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="sav-goal-footer" style={{ marginTop: 18 }}>
                <button
                  className="sav-btn-deposit"
                  style={{ background: `linear-gradient(135deg, ${goal.color}ee, ${goal.color}aa)` }}
                  onClick={() => { setShowDepositForm(goal); setDepForm({ amount: '', note: '', date: today() }); }}
                  disabled={isDeleting}
                >
                  + Depositar
                </button>
                <button
                  className="sav-btn-history"
                  onClick={async () => {
                    setShowHistory(goal);
                    await loadDeposits(goal.id);
                  }}
                  disabled={isDeleting}
                >
                  📋 Historial
                </button>
              </div>
            </div>
          );
        })}

        {/* Nueva meta */}
        <div className="sav-new-card" onClick={() => setShowGoalForm(true)}>
          <div className="sav-new-icon">➕</div>
          <div className="sav-new-label">Nueva meta de ahorro</div>
          <div className="sav-new-sub">Definí un objetivo y empezá a ahorrar</div>
        </div>
      </div>

      {/* ══ MODAL NUEVA / EDITAR META ══ */}
      {showGoalForm && (
        <div className="gapp-modal-overlay" onClick={e => e.target === e.currentTarget && closeGoalForm()}>
          <div className="gapp-modal" style={{ maxWidth: 480 }}>
            <div className="gapp-modal-drag" />
            <h3 className="gapp-modal-title">{editGoal ? '✏️ Editar meta' : '🎯 Nueva meta de ahorro'}</h3>
            <form onSubmit={saveGoal}>
              <label className="gapp-label">Nombre de la meta</label>
              <input
                className="gapp-input" required
                placeholder="ej: Viaje a Europa, Auto nuevo..."
                value={goalForm.name}
                onChange={e => setGoalForm({ ...goalForm, name: e.target.value })}
              />

              <label className="gapp-label">Monto objetivo ($)</label>
              <input
                className="gapp-input" type="number" step="0.01" min="1" required
                placeholder="0,00"
                value={goalForm.target}
                onChange={e => setGoalForm({ ...goalForm, target: e.target.value })}
              />

              <label className="gapp-label">Ícono</label>
              <div className="sav-picker-row">
                {ICONS.map(ic => (
                  <button
                    key={ic} type="button"
                    className={`sav-icon-btn${goalForm.icon === ic ? ' selected' : ''}`}
                    onClick={() => setGoalForm({ ...goalForm, icon: ic })}
                  >{ic}</button>
                ))}
              </div>

              <label className="gapp-label">Color</label>
              <div className="sav-picker-row">
                {COLORS.map(cl => (
                  <button
                    key={cl} type="button"
                    className={`sav-color-btn${goalForm.color === cl ? ' selected' : ''}`}
                    style={{ background: cl }}
                    onClick={() => setGoalForm({ ...goalForm, color: cl })}
                  />
                ))}
              </div>

              {/* Preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fafafe', borderRadius: 12, padding: '12px 14px',
                marginBottom: 16, border: `2px solid ${goalForm.color}22`,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `${goalForm.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>{goalForm.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>
                    {goalForm.name || 'Nombre de la meta'}
                  </div>
                  <div style={{ fontSize: 12, color: goalForm.color, fontWeight: 600 }}>
                    Meta: {goalForm.target ? fmt(goalForm.target) : '$0,00'}
                  </div>
                </div>
              </div>

              <div className="gapp-form-actions">
                <button type="submit" disabled={saving} className="gapp-btn-submit"
                  style={{ background: `linear-gradient(135deg, ${goalForm.color}ee, ${goalForm.color}aa)` }}>
                  {saving ? <><Spinner /> Guardando...</> : editGoal ? 'Guardar cambios' : 'Crear meta'}
                </button>
                <button type="button" className="gapp-btn-cancel" onClick={closeGoalForm}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL DEPOSITAR ══ */}
      {showDepositForm && (
        <div className="gapp-modal-overlay" onClick={e => e.target === e.currentTarget && setShowDepositForm(null)}>
          <div className="gapp-modal" style={{ maxWidth: 420 }}>
            <div className="gapp-modal-drag" />
            {/* Header con info de la meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, fontSize: 22,
                background: `${showDepositForm.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{showDepositForm.icon}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>{showDepositForm.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  Ahorrado: <b style={{ color: showDepositForm.color }}>{fmt(showDepositForm.saved)}</b>
                  {' '}/ {fmt(showDepositForm.target)}
                </div>
              </div>
            </div>
            <form onSubmit={saveDeposit}>
              <label className="gapp-label">Monto a depositar ($)</label>
              <input
                className="gapp-input" type="number" step="0.01" min="0.01" required
                placeholder="0,00" autoFocus
                value={depForm.amount}
                onChange={e => setDepForm({ ...depForm, amount: e.target.value })}
              />
              <label className="gapp-label">Nota <span style={{ color:'#bbb', fontWeight:400 }}>(opcional)</span></label>
              <input
                className="gapp-input"
                placeholder="ej: Saldo del mes, bonus..."
                value={depForm.note}
                onChange={e => setDepForm({ ...depForm, note: e.target.value })}
              />
              <label className="gapp-label">Fecha</label>
              <input
                className="gapp-input" type="date" required
                value={depForm.date}
                onChange={e => setDepForm({ ...depForm, date: e.target.value })}
              />
              <div className="gapp-form-actions">
                <button type="submit" disabled={saving} className="gapp-btn-submit"
                  style={{ background: `linear-gradient(135deg, ${showDepositForm.color}ee, ${showDepositForm.color}aa)` }}>
                  {saving ? <><Spinner /> Guardando...</> : '💾 Guardar depósito'}
                </button>
                <button type="button" className="gapp-btn-cancel" onClick={() => setShowDepositForm(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL HISTORIAL ══ */}
      {showHistory && (
        <div className="gapp-modal-overlay" onClick={e => e.target === e.currentTarget && setShowHistory(null)}>
          <div className="gapp-modal" style={{ maxWidth: 480 }}>
            <div className="gapp-modal-drag" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, fontSize: 22,
                background: `${showHistory.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{showHistory.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#1a1a2e' }}>{showHistory.name}</div>
                <div style={{ fontSize: 12, color: '#888' }}>Historial de depósitos</div>
              </div>
              <button
                onClick={() => setShowHistory(null)}
                style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f0f0f5', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}
              >×</button>
            </div>

            {loadingDeposits ? <Spinner skeleton skeletonRows={4} /> : deposits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa', fontSize: 14 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💸</div>
                Todavía no hay depósitos en esta meta.
              </div>
            ) : (
              <div className="sav-deposit-list">
                {deposits.map(dep => {
                  const isDeleting = deletingId === dep.id;
                  return (
                    <div
                      key={dep.id}
                      className="sav-deposit-item"
                      style={{ color: showHistory.color, opacity: isDeleting ? 0.4 : 1 }}
                    >
                      <div className="sav-deposit-info">
                        {dep.note
                          ? <div className="sav-deposit-note">{dep.note}</div>
                          : <div className="sav-deposit-note" style={{ fontStyle: 'italic', color: '#ccc' }}>Sin nota</div>
                        }
                        <div className="sav-deposit-date">{fmtDate(dep.date)}</div>
                      </div>
                      <div className="sav-deposit-amount" style={{ color: showHistory.color }}>
                        {fmt(dep.amount)}
                      </div>
                      {isDeleting ? <Spinner dark /> : (
                        <button
                          className="gapp-btn-icon"
                          style={{ background: '#fdecea', color: '#e74c3c', flexShrink: 0 }}
                          onClick={() => deleteDeposit(dep.id, showHistory.id)}
                        >🗑️</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
              <button
                className="sav-btn-deposit"
                style={{ background: `linear-gradient(135deg, ${showHistory.color}ee, ${showHistory.color}aa)`, width: '100%', borderRadius: 10 }}
                onClick={() => {
                  setShowHistory(null);
                  setTimeout(() => {
                    setShowDepositForm(showHistory);
                    setDepForm({ amount: '', note: '', date: today() });
                  }, 150);
                }}
              >+ Agregar depósito</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
