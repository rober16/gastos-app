import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { CATEGORIES, INCOME_TYPES, getCategoryById, getIncomeTypeById } from '../categories';
import Spinner from '../components/Spinner';
import SavingsPage from '../components/SavingsPage';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n ?? 0);

const fmtDate = (d) => {
  if (!d) return '';
  const clean = String(d).slice(0, 10);
  const [year, month, day] = clean.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const today        = () => new Date().toISOString().split('T')[0];
const currentMonth = () => today().slice(0, 7);

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { overflow-x: hidden; max-width: 100vw; }
  html { font-size: 16px; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f0f2f8; color: #1a1a2e; -webkit-font-smoothing: antialiased; }
  .gapp-header { background: linear-gradient(135deg, #5b50e8 0%, #7c6ff7 100%); color: #fff; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(91,80,232,0.3); }
  .gapp-header-inner { max-width: 960px; margin: 0 auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
  .gapp-header-top { display: flex; align-items: center; justify-content: space-between; }
  .gapp-logo { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .gapp-logo span { opacity: 0.75; font-weight: 400; font-size: 14px; margin-left: 6px; }
  .gapp-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .gapp-email { font-size: 12px; opacity: 0.8; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .gapp-month-input { padding: 5px 10px; border-radius: 8px; border: none; font-size: 13px; font-weight: 600; background: rgba(255,255,255,0.2); color: #fff; cursor: pointer; outline: none; -webkit-appearance: none; }
  .gapp-month-input::-webkit-calendar-picker-indicator { filter: invert(1); }
  .gapp-btn-logout { padding: 5px 12px; border-radius: 8px; background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.25); font-size: 12px; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
  .gapp-btn-logout:hover { background: rgba(255,255,255,0.25); }
  /* Privacy toggle */
  .gapp-privacy-btn { padding: 5px 10px; border-radius: 8px; background: rgba(255,255,255,0.15); color: #fff; border: 1px solid rgba(255,255,255,0.25); font-size: 14px; cursor: pointer; transition: background 0.2s; line-height: 1; }
  .gapp-privacy-btn:hover { background: rgba(255,255,255,0.25); }
  .gapp-nav { background: #fff; border-bottom: 1px solid #e8e5f5; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .gapp-nav::-webkit-scrollbar { display: none; }
  .gapp-nav-inner { max-width: 960px; margin: 0 auto; display: flex; padding: 0 8px; }
  .gapp-tab { padding: 13px 16px; border: none; background: none; font-size: 13px; font-weight: 500; color: #888; cursor: pointer; white-space: nowrap; border-bottom: 3px solid transparent; transition: color 0.2s, border-color 0.2s; flex-shrink: 0; }
  .gapp-tab.active { color: #5b50e8; border-bottom-color: #5b50e8; font-weight: 700; }
  .gapp-main { max-width: 960px; margin: 0 auto; padding: 16px; }
  .gapp-cards { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; }
  @media (min-width: 480px) { .gapp-cards { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 720px) { .gapp-cards { grid-template-columns: repeat(3, 1fr); } }
  .gapp-card { background: #fff; border-radius: 14px; padding: 18px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border-left: 4px solid transparent; transition: transform 0.15s, box-shadow 0.15s; }
  .gapp-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
  .gapp-card-label { font-size: 12px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .gapp-card-value { font-size: 24px; font-weight: 800; line-height: 1.1; }
  @media (max-width: 479px) { .gapp-card-value { font-size: 20px; } }
  /* Privacy blur */
  .gapp-card-value.blurred { filter: blur(8px); user-select: none; transition: filter 0.3s; }
  .gapp-card-skeleton { background: #fff; border-radius: 14px; padding: 18px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); border-left: 4px solid #eee; }
  .sk-line { height: 11px; border-radius: 6px; background: #ececec; margin-bottom: 10px; animation: sk-shimmer 1.4s ease-in-out infinite; }
  .sk-line.tall { height: 28px; margin-bottom: 0; width: 70%; }
  .sk-line.short { width: 40%; }
  @keyframes sk-shimmer { 0%,100% { background-color: #ececec; } 50% { background-color: #f5f5f5; } }
  .gapp-cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
  @media (min-width: 480px) { .gapp-cat-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 720px) { .gapp-cat-grid { grid-template-columns: repeat(4, 1fr); } }
  .gapp-cat-card { background: #fff; border-radius: 12px; padding: 14px 10px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border-top: 3px solid transparent; transition: transform 0.15s, box-shadow 0.15s; position: relative; }
  .gapp-cat-card.clickable { cursor: pointer; }
  .gapp-cat-card.clickable:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.11); }
  .gapp-cat-card.clickable:active { transform: translateY(-1px); }
  .gapp-cat-icon { font-size: 26px; margin-bottom: 6px; }
  .gapp-cat-label { font-size: 11px; color: #888; margin-bottom: 4px; line-height: 1.3; }
  .gapp-cat-amount { font-size: 13px; font-weight: 700; }
  .gapp-cat-badge { position: absolute; top: 7px; right: 7px; font-size: 10px; font-weight: 700; color: #fff; border-radius: 20px; padding: 2px 6px; line-height: 1.5; min-width: 18px; text-align: center; }
  .gapp-cat-hint { font-size: 10px; color: #bbb; margin-top: 5px; display: flex; align-items: center; justify-content: center; gap: 3px; }
  .gapp-quick-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
  .gapp-btn-add { flex: 1; min-width: 140px; padding: 13px 16px; border-radius: 10px; border: none; font-size: 14px; font-weight: 700; color: #fff; cursor: pointer; transition: opacity 0.2s, transform 0.15s; box-shadow: 0 3px 10px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; gap: 8px; }
  .gapp-btn-add:hover { opacity: 0.9; transform: translateY(-1px); }
  .gapp-btn-add:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .gapp-list { display: flex; flex-direction: column; gap: 8px; }
  .gapp-list-item { background: #fff; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); transition: box-shadow 0.15s, opacity 0.2s; }
  .gapp-list-item:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.09); }
  .gapp-list-item.deleting { opacity: 0.4; pointer-events: none; }
  .gapp-list-icon { font-size: 22px; flex-shrink: 0; }
  .gapp-list-info { flex: 1; min-width: 0; }
  .gapp-list-title { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gapp-list-sub { font-size: 12px; color: #888; margin-top: 1px; }
  .gapp-list-date { font-size: 11px; color: #bbb; }
  .gapp-list-amount { font-weight: 800; font-size: 15px; flex-shrink: 0; }
  .gapp-list-actions { display: flex; gap: 5px; flex-shrink: 0; min-width: 72px; justify-content: flex-end; }
  .gapp-btn-icon { width: 32px; height: 32px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: background 0.15s, transform 0.1s; }
  .gapp-btn-icon:hover { transform: scale(1.1); }
  .gapp-btn-icon:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .gapp-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
  .gapp-section-title { font-size: 16px; font-weight: 800; color: #1a1a2e; display: flex; align-items: center; gap: 8px; }
  .gapp-modal-overlay { position: fixed; inset: 0; background: rgba(10,10,30,0.5); display: flex; align-items: flex-end; justify-content: center; z-index: 200; padding: 0; animation: fadeIn 0.15s ease; }
  @media (min-width: 600px) { .gapp-modal-overlay { align-items: center; padding: 16px; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .gapp-modal { background: #fff; width: 100%; max-width: 460px; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; max-height: 92vh; overflow-y: auto; animation: slideUp 0.2s ease; }
  @media (min-width: 600px) { .gapp-modal { border-radius: 20px; padding: 28px 24px; } }
  @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .gapp-modal-title { font-size: 18px; font-weight: 800; margin-bottom: 16px; color: #1a1a2e; }
  .gapp-modal-drag { width: 36px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto 16px; }
  @media (min-width: 600px) { .gapp-modal-drag { display: none; } }
  .gapp-label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.4px; }
  .gapp-input, .gapp-select { width: 100%; padding: 11px 13px; border-radius: 10px; border: 1.5px solid #e0ddf5; font-size: 15px; margin-bottom: 14px; outline: none; background: #fafafe; transition: border-color 0.2s, box-shadow 0.2s; -webkit-appearance: none; }
  .gapp-input:focus, .gapp-select:focus { border-color: #5b50e8; box-shadow: 0 0 0 3px rgba(91,80,232,0.12); }
  .gapp-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; }
  .gapp-form-actions { display: flex; gap: 8px; margin-top: 4px; }
  .gapp-btn-submit { flex: 1; padding: 13px; border-radius: 10px; border: none; font-size: 15px; font-weight: 700; color: #fff; cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .gapp-btn-submit:hover:not(:disabled) { opacity: 0.88; }
  .gapp-btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
  .gapp-btn-cancel { flex: 1; padding: 13px; border-radius: 10px; background: #f0f0f5; color: #555; border: none; font-size: 15px; font-weight: 600; cursor: pointer; }
  .gapp-empty { text-align: center; padding: 40px 20px; color: #aaa; font-size: 14px; }
  .gapp-empty-icon { font-size: 40px; margin-bottom: 10px; }
  .gapp-chart-card { background: #fff; border-radius: 14px; padding: 20px 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-bottom: 16px; }
  .gapp-chart-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; color: #1a1a2e; }
  .gapp-cat-modal-list { display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto; padding-right: 2px; scrollbar-width: thin; scrollbar-color: #e0ddf5 transparent; }
  .gapp-cat-modal-list::-webkit-scrollbar { width: 4px; }
  .gapp-cat-modal-list::-webkit-scrollbar-thumb { background: #e0ddf5; border-radius: 4px; }
  /* Privacy notice banner */
  .gapp-privacy-banner {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px;
    padding: 10px 14px; font-size: 13px; color: #92400e;
    margin-bottom: 12px; cursor: pointer; transition: background 0.15s;
  }
  .gapp-privacy-banner:hover { background: #fef3c7; }
`;

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const [month, setMonth]                 = useState(currentMonth());
  const [expenses, setExpenses]           = useState([]);
  const [incomes, setIncomes]             = useState([]);
  const [view, setView]                   = useState('dashboard');
  const [showExpForm, setShowExpForm]     = useState(false);
  const [showIncForm, setShowIncForm]     = useState(false);
  const [editItem, setEditItem]           = useState(null);
  const [loadingData, setLoadingData]     = useState(true);
  const [saving, setSaving]               = useState(false);
  const [deletingId, setDeletingId]       = useState(null);
  const [categoryModal, setCategoryModal] = useState(null);
  // 👁 Privacy: persiste en localStorage
  const [private_, setPrivate_] = useState(() => {
    try { return localStorage.getItem('gapp_private') === 'true'; } catch { return false; }
  });

  const togglePrivacy = () => {
    setPrivate_(p => {
      const next = !p;
      try { localStorage.setItem('gapp_private', String(next)); } catch {}
      return next;
    });
  };

  const [expForm, setExpForm] = useState({ amount: '', category: 'credit_card', subcategory: '', description: '', date: today() });
  const [incForm, setIncForm] = useState({ amount: '', type: 'salary', description: '', date: today() });

  useEffect(() => {
    const id = 'gapp-styles';
    if (!document.getElementById(id)) {
      const s = document.createElement('style');
      s.id = id; s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [expRes, incRes] = await Promise.all([
        api.get(`/expenses?month=${month}`),
        api.get(`/incomes?month=${month}`)
      ]);
      setExpenses(expRes.data);
      setIncomes(incRes.data);
    } catch (e) { console.error(e); }
    finally { setLoadingData(false); }
  }, [month]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalIncome  = incomes.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const balance      = totalIncome - totalExpense;

  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  })).filter(c => c.total > 0);

  const saveExpense = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await api.put(`/expenses/${editItem.id}`, expForm);
      else          await api.post('/expenses', expForm);
      closeExpForm(); await loadData();
    } finally { setSaving(false); }
  };

  const saveIncome = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editItem) await api.put(`/incomes/${editItem.id}`, incForm);
      else          await api.post('/incomes', incForm);
      closeIncForm(); await loadData();
    } finally { setSaving(false); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    setDeletingId(id);
    try { await api.delete(`/expenses/${id}`); await loadData(); }
    finally { setDeletingId(null); }
  };

  const deleteIncome = async (id) => {
    if (!window.confirm('¿Eliminar este ingreso?')) return;
    setDeletingId(id);
    try { await api.delete(`/incomes/${id}`); await loadData(); }
    finally { setDeletingId(null); }
  };

  const openEditExpense = (item) => {
    setEditItem(item);
    setExpForm({ amount: item.amount, category: item.category, subcategory: item.subcategory || '', description: item.description || '', date: item.date });
    setShowExpForm(true);
  };
  const openEditIncome = (item) => {
    setEditItem(item);
    setIncForm({ amount: item.amount, type: item.type, description: item.description || '', date: item.date });
    setShowIncForm(true);
  };
  const closeExpForm = () => { setShowExpForm(false); setEditItem(null); setExpForm({ amount: '', category: 'credit_card', subcategory: '', description: '', date: today() }); };
  const closeIncForm = () => { setShowIncForm(false); setEditItem(null); setIncForm({ amount: '', type: 'salary', description: '', date: today() }); };

  const SkeletonCards = () => (
    <div className="gapp-cards">
      {[0,1,2].map(i => (
        <div key={i} className="gapp-card-skeleton">
          <div className="sk-line short" /><div className="sk-line tall" />
        </div>
      ))}
    </div>
  );

  // Valor mostrado según privacidad
  const display = (val) => private_ ? '••••••' : fmt(val);

  return (
    <>
      {saving && <Spinner fullscreen message={editItem ? 'Actualizando...' : 'Guardando...'} />}
      {loadingData && expenses.length === 0 && incomes.length === 0 && (
        <Spinner fullscreen message="Cargando datos del mes..." />
      )}

      {/* HEADER */}
      <header className="gapp-header">
        <div className="gapp-header-inner">
          <div className="gapp-header-top">
            <div className="gapp-logo">💰 Mis Gastos<span>Personal Finance</span></div>
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Botón privacidad */}
              <button
                className="gapp-privacy-btn"
                onClick={togglePrivacy}
                title={private_ ? 'Mostrar montos' : 'Ocultar montos'}
              >
                {private_ ? '🙈' : '👁'}
              </button>
              <button className="gapp-btn-logout" onClick={logout}>Salir</button>
            </div>
          </div>
          <div className="gapp-header-actions">
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="gapp-month-input" />
            <span className="gapp-email">{user.email}</span>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="gapp-nav">
        <div className="gapp-nav-inner">
          {[
            { key: 'dashboard', label: '📊 Resumen'  },
            { key: 'expenses',  label: '💸 Gastos'   },
            { key: 'incomes',   label: '💰 Ingresos' },
            { key: 'savings',   label: '🏦 Ahorros'  },
            { key: 'charts',    label: '📈 Gráficos' },
          ].map(t => (
            <button key={t.key} className={`gapp-tab${view === t.key ? ' active' : ''}`} onClick={() => setView(t.key)}>{t.label}</button>
          ))}
        </div>
      </nav>

      <main className="gapp-main">

        {/* DASHBOARD */}
        {view === 'dashboard' && (
          <>
            {/* Banner de privacidad activa */}
            {private_ && (
              <div className="gapp-privacy-banner" onClick={togglePrivacy}>
                🔒 Modo privado activado — tocá para mostrar los montos
              </div>
            )}

            {loadingData ? <SkeletonCards /> : (
              <div className="gapp-cards">
                <div className="gapp-card" style={{ borderLeftColor: '#27ae60' }}>
                  <div className="gapp-card-label">Total ingresos</div>
                  <div className={`gapp-card-value${private_ ? ' blurred' : ''}`} style={{ color: '#27ae60' }}>{display(totalIncome)}</div>
                </div>
                <div className="gapp-card" style={{ borderLeftColor: '#e74c3c' }}>
                  <div className="gapp-card-label">Total gastos</div>
                  <div className={`gapp-card-value${private_ ? ' blurred' : ''}`} style={{ color: '#e74c3c' }}>{display(totalExpense)}</div>
                </div>
                <div className="gapp-card" style={{ borderLeftColor: balance >= 0 ? '#27ae60' : '#e74c3c' }}>
                  <div className="gapp-card-label">Saldo disponible</div>
                  <div className={`gapp-card-value${private_ ? ' blurred' : ''}`} style={{ color: balance >= 0 ? '#27ae60' : '#e74c3c' }}>{display(balance)}</div>
                </div>
              </div>
            )}

            <div className="gapp-section-header">
              <h2 className="gapp-section-title">
                Gastos por categoría {loadingData && <Spinner dark />}
              </h2>
            </div>

            {loadingData ? (
              <div className="gapp-cat-grid">
                {CATEGORIES.map((_, i) => (
                  <div key={i} className="gapp-cat-card" style={{ borderTopColor: '#eee' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ececec', margin: '0 auto 8px', animation: 'sk-shimmer 1.4s ease-in-out infinite' }} />
                    <div className="sk-line short" style={{ margin: '0 auto 6px' }} />
                    <div className="sk-line" style={{ width: '60%', height: 14, margin: '0 auto' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="gapp-cat-grid">
                {CATEGORIES.map(cat => {
                  const catExpenses = expenses.filter(e => e.category === cat.id);
                  const total = catExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                  const count = catExpenses.length;
                  const hasData = total > 0;
                  return (
                    <div
                      key={cat.id}
                      className={`gapp-cat-card${hasData ? ' clickable' : ''}`}
                      style={{ borderTopColor: cat.color }}
                      onClick={() => hasData && setCategoryModal(cat)}
                      title={hasData ? `Ver ${count} gasto${count !== 1 ? 's' : ''} de ${cat.label}` : undefined}
                    >
                      {count > 0 && <div className="gapp-cat-badge" style={{ background: cat.color }}>{count}</div>}
                      <div className="gapp-cat-icon">{cat.icon}</div>
                      <div className="gapp-cat-label">{cat.label}</div>
                      <div className={`gapp-cat-amount${private_ ? ' blurred' : ''}`} style={{ color: hasData ? cat.color : '#ccc' }}>
                        {hasData ? (private_ ? '••••' : fmt(total)) : '—'}
                      </div>
                      {hasData && <div className="gapp-cat-hint"><span>👆</span> ver detalle</div>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="gapp-quick-actions" style={{ marginTop: 8 }}>
              <button className="gapp-btn-add" style={{ background: 'linear-gradient(135deg,#e74c3c,#c0392b)' }} onClick={() => setShowExpForm(true)} disabled={loadingData}>+ Agregar gasto</button>
              <button className="gapp-btn-add" style={{ background: 'linear-gradient(135deg,#27ae60,#1e8449)' }} onClick={() => setShowIncForm(true)} disabled={loadingData}>+ Agregar ingreso</button>
            </div>
          </>
        )}

        {/* GASTOS */}
        {view === 'expenses' && (
          <>
            <div className="gapp-section-header">
              <h2 className="gapp-section-title">Gastos del mes {loadingData && <Spinner dark />}</h2>
              <button className="gapp-btn-add" style={{ background: 'linear-gradient(135deg,#e74c3c,#c0392b)', flex: 'none', minWidth: 'auto', padding: '10px 16px' }} onClick={() => { setEditItem(null); setShowExpForm(true); }} disabled={loadingData}>+ Nuevo</button>
            </div>
            {loadingData ? <Spinner skeleton skeletonRows={5} /> : expenses.length === 0 ? (
              <div className="gapp-empty"><div className="gapp-empty-icon">💸</div>No hay gastos cargados este mes.</div>
            ) : (
              <div className="gapp-list">
                {expenses.map(exp => {
                  const cat = getCategoryById(exp.category);
                  const isDeleting = deletingId === exp.id;
                  return (
                    <div key={exp.id} className={`gapp-list-item${isDeleting ? ' deleting' : ''}`}>
                      <span className="gapp-list-icon">{cat?.icon || '📦'}</span>
                      <div className="gapp-list-info">
                        <div className="gapp-list-title">{cat?.label || exp.category}{exp.subcategory && <span style={{ fontWeight: 400, color: '#888' }}> · {exp.subcategory}</span>}</div>
                        {exp.description && <div className="gapp-list-sub">{exp.description}</div>}
                        <div className="gapp-list-date">{fmtDate(exp.date)}</div>
                      </div>
                      <div className={`gapp-list-amount${private_ ? ' blurred' : ''}`} style={{ color: '#e74c3c' }}>{private_ ? '••••' : fmt(exp.amount)}</div>
                      <div className="gapp-list-actions">
                        {isDeleting ? <Spinner dark /> : (
                          <>
                            <button className="gapp-btn-icon" style={{ background: '#ede9ff', color: '#5b50e8' }} onClick={() => openEditExpense(exp)} disabled={!!deletingId}>✏️</button>
                            <button className="gapp-btn-icon" style={{ background: '#fdecea', color: '#e74c3c' }} onClick={() => deleteExpense(exp.id)} disabled={!!deletingId}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* INGRESOS */}
        {view === 'incomes' && (
          <>
            <div className="gapp-section-header">
              <h2 className="gapp-section-title">Ingresos del mes {loadingData && <Spinner dark />}</h2>
              <button className="gapp-btn-add" style={{ background: 'linear-gradient(135deg,#27ae60,#1e8449)', flex: 'none', minWidth: 'auto', padding: '10px 16px' }} onClick={() => { setEditItem(null); setShowIncForm(true); }} disabled={loadingData}>+ Nuevo</button>
            </div>
            {loadingData ? <Spinner skeleton skeletonRows={3} /> : incomes.length === 0 ? (
              <div className="gapp-empty"><div className="gapp-empty-icon">💰</div>No hay ingresos cargados este mes.</div>
            ) : (
              <div className="gapp-list">
                {incomes.map(inc => {
                  const type = getIncomeTypeById(inc.type);
                  const isDeleting = deletingId === inc.id;
                  return (
                    <div key={inc.id} className={`gapp-list-item${isDeleting ? ' deleting' : ''}`}>
                      <span className="gapp-list-icon">{type?.icon || '💰'}</span>
                      <div className="gapp-list-info">
                        <div className="gapp-list-title">{type?.label || inc.type}</div>
                        {inc.description && <div className="gapp-list-sub">{inc.description}</div>}
                        <div className="gapp-list-date">{fmtDate(inc.date)}</div>
                      </div>
                      <div className={`gapp-list-amount${private_ ? ' blurred' : ''}`} style={{ color: '#27ae60' }}>{private_ ? '••••' : fmt(inc.amount)}</div>
                      <div className="gapp-list-actions">
                        {isDeleting ? <Spinner dark /> : (
                          <>
                            <button className="gapp-btn-icon" style={{ background: '#ede9ff', color: '#5b50e8' }} onClick={() => openEditIncome(inc)} disabled={!!deletingId}>✏️</button>
                            <button className="gapp-btn-icon" style={{ background: '#fdecea', color: '#e74c3c' }} onClick={() => deleteIncome(inc.id)} disabled={!!deletingId}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* AHORROS */}
        {/* {view === 'savings' && <SavingsPage />} */}

        {/* GRAFICOS */}
        {view === 'charts' && (
          <>
            <h2 className="gapp-section-title" style={{ marginBottom: 16 }}>Análisis del mes {loadingData && <Spinner dark />}</h2>
            {loadingData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[240, 280, 200].map((h, i) => (
                  <div key={i} className="gapp-chart-card">
                    <div className="sk-line short" style={{ marginBottom: 16 }} />
                    <div style={{ height: h, background: '#f5f5f5', borderRadius: 8, animation: 'sk-shimmer 1.4s ease-in-out infinite' }} />
                  </div>
                ))}
              </div>
            ) : byCategory.length === 0 ? (
              <div className="gapp-empty"><div className="gapp-empty-icon">📈</div>No hay datos para graficar este mes.</div>
            ) : (
              <>
                <div className="gapp-chart-card">
                  <div className="gapp-chart-title">Resumen financiero</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Ingresos totales', value: totalIncome,  color: '#27ae60', pct: 100 },
                      { label: 'Gastos totales',   value: totalExpense, color: '#e74c3c', pct: totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0 },
                    ].map(row => (
                      <div key={row.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#666' }}>{row.label}</span>
                          <span className={private_ ? 'blurred' : ''} style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{private_ ? '••••' : fmt(row.value)}</span>
                        </div>
                        <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#666' }}>Saldo disponible</span>
                      <span className={private_ ? 'blurred' : ''} style={{ fontSize: 18, fontWeight: 800, color: balance >= 0 ? '#27ae60' : '#e74c3c' }}>{private_ ? '••••' : fmt(balance)}</span>
                    </div>
                  </div>
                </div>
                <div className="gapp-chart-card">
                  <div className="gapp-chart-title">Distribución por categoría</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>
                        {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => private_ ? '••••' : fmt(v)} />
                      <Legend iconType="circle" iconSize={10} formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="gapp-chart-card">
                  <div className="gapp-chart-title">Gastos por categoría</div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={byCategory} margin={{ top: 4, right: 8, left: 0, bottom: 70 }}>
                      <XAxis dataKey="label" angle={-40} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis tickFormatter={v => private_ ? '••' : `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#888' }} width={48} />
                      <Tooltip formatter={v => private_ ? '••••' : fmt(v)} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Bar dataKey="total" radius={[6,6,0,0]}>
                        {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="gapp-chart-card">
                  <div className="gapp-chart-title">Detalle por categoría</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {byCategory.sort((a, b) => b.total - a.total).map(cat => {
                      const pct = totalExpense > 0 ? (cat.total / totalExpense * 100) : 0;
                      return (
                        <div key={cat.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{cat.icon}</span><span style={{ color: '#444' }}>{cat.label}</span>
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>
                              <span className={private_ ? 'blurred' : ''}>{private_ ? '••••' : fmt(cat.total)}</span>
                              <span style={{ fontSize: 11, fontWeight: 400, color: '#aaa', marginLeft: 4 }}>({pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: cat.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* MODAL GASTO */}
      {showExpForm && (
        <div className="gapp-modal-overlay" onClick={e => e.target === e.currentTarget && closeExpForm()}>
          <div className="gapp-modal">
            <div className="gapp-modal-drag" />
            <h3 className="gapp-modal-title">{editItem ? '✏️ Editar gasto' : '➕ Nuevo gasto'}</h3>
            <form onSubmit={saveExpense}>
              <label className="gapp-label">Categoría</label>
              <select className="gapp-select" value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <label className="gapp-label">Monto ($)</label>
              <input className="gapp-input" type="number" step="0.01" min="0.01" required placeholder="0,00" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} />
              <label className="gapp-label">Subcategoría <span style={{ color:'#bbb', fontWeight:400 }}>(opcional)</span></label>
              <input className="gapp-input" placeholder="ej: Visa, Naranja, Uber..." value={expForm.subcategory} onChange={e => setExpForm({ ...expForm, subcategory: e.target.value })} />
              <label className="gapp-label">Descripción <span style={{ color:'#bbb', fontWeight:400 }}>(opcional)</span></label>
              <input className="gapp-input" placeholder="ej: Asado del sábado" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} />
              <label className="gapp-label">Fecha</label>
              <input className="gapp-input" type="date" required value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} />
              <div className="gapp-form-actions">
                <button type="submit" disabled={saving} className="gapp-btn-submit" style={{ background: 'linear-gradient(135deg,#e74c3c,#c0392b)' }}>
                  {saving ? <><Spinner />{editItem ? 'Actualizando...' : 'Guardando...'}</> : editItem ? 'Guardar cambios' : 'Agregar gasto'}
                </button>
                <button type="button" className="gapp-btn-cancel" onClick={closeExpForm} disabled={saving}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INGRESO */}
      {showIncForm && (
        <div className="gapp-modal-overlay" onClick={e => e.target === e.currentTarget && closeIncForm()}>
          <div className="gapp-modal">
            <div className="gapp-modal-drag" />
            <h3 className="gapp-modal-title">{editItem ? '✏️ Editar ingreso' : '➕ Nuevo ingreso'}</h3>
            <form onSubmit={saveIncome}>
              <label className="gapp-label">Tipo de ingreso</label>
              <select className="gapp-select" value={incForm.type} onChange={e => setIncForm({ ...incForm, type: e.target.value })}>
                {INCOME_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              <label className="gapp-label">Monto ($)</label>
              <input className="gapp-input" type="number" step="0.01" min="0.01" required placeholder="0,00" value={incForm.amount} onChange={e => setIncForm({ ...incForm, amount: e.target.value })} />
              <label className="gapp-label">Descripción <span style={{ color:'#bbb', fontWeight:400 }}>(opcional)</span></label>
              <input className="gapp-input" placeholder="ej: Freelance diseño web" value={incForm.description} onChange={e => setIncForm({ ...incForm, description: e.target.value })} />
              <label className="gapp-label">Fecha</label>
              <input className="gapp-input" type="date" required value={incForm.date} onChange={e => setIncForm({ ...incForm, date: e.target.value })} />
              <div className="gapp-form-actions">
                <button type="submit" disabled={saving} className="gapp-btn-submit" style={{ background: 'linear-gradient(135deg,#27ae60,#1e8449)' }}>
                  {saving ? <><Spinner />{editItem ? 'Actualizando...' : 'Guardando...'}</> : editItem ? 'Guardar cambios' : 'Agregar ingreso'}
                </button>
                <button type="button" className="gapp-btn-cancel" onClick={closeIncForm} disabled={saving}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE CATEGORÍA */}
      {categoryModal && (() => {
        const catExpenses = expenses.filter(e => e.category === categoryModal.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const catTotal = catExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
        return (
          <div className="gapp-modal-overlay" onClick={e => e.target === e.currentTarget && setCategoryModal(null)}>
            <div className="gapp-modal" style={{ maxWidth: 520 }}>
              <div className="gapp-modal-drag" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: `2px solid ${categoryModal.color}22` }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: `${categoryModal.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{categoryModal.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e' }}>{categoryModal.label}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 1 }}>{catExpenses.length} gasto{catExpenses.length !== 1 ? 's' : ''} este mes</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 2 }}>Total</div>
                  <div className={private_ ? 'blurred' : ''} style={{ fontSize: 17, fontWeight: 800, color: categoryModal.color }}>{private_ ? '••••' : fmt(catTotal)}</div>
                </div>
                <button onClick={() => setCategoryModal(null)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f0f0f5', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#666', lineHeight: 1 }}>×</button>
              </div>
              <div className="gapp-cat-modal-list">
                {catExpenses.map(exp => {
                  const isDeleting = deletingId === exp.id;
                  return (
                    <div key={exp.id} className={`gapp-list-item${isDeleting ? ' deleting' : ''}`} style={{ borderLeft: `3px solid ${categoryModal.color}` }}>
                      <div className="gapp-list-info">
                        <div className="gapp-list-title">{exp.subcategory ? <span>{exp.subcategory}</span> : <span style={{ color: '#bbb', fontStyle: 'italic', fontWeight: 400 }}>Sin subcategoría</span>}</div>
                        {exp.description && <div className="gapp-list-sub">{exp.description}</div>}
                        <div className="gapp-list-date">{fmtDate(exp.date)}</div>
                      </div>
                      <div className={`gapp-list-amount${private_ ? ' blurred' : ''}`} style={{ color: categoryModal.color }}>{private_ ? '••••' : fmt(exp.amount)}</div>
                      <div className="gapp-list-actions">
                        {isDeleting ? <Spinner dark /> : (
                          <>
                            <button className="gapp-btn-icon" style={{ background: '#ede9ff', color: '#5b50e8' }} disabled={!!deletingId} onClick={() => { setCategoryModal(null); setTimeout(() => openEditExpense(exp), 150); }}>✏️</button>
                            <button className="gapp-btn-icon" style={{ background: '#fdecea', color: '#e74c3c' }} disabled={!!deletingId} onClick={async () => {
                              if (!window.confirm('¿Eliminar este gasto?')) return;
                              setDeletingId(exp.id);
                              try {
                                await api.delete(`/expenses/${exp.id}`);
                                await loadData();
                                const remaining = expenses.filter(e => e.category === categoryModal.id && e.id !== exp.id);
                                if (remaining.length === 0) setCategoryModal(null);
                              } finally { setDeletingId(null); }
                            }}>🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
                <button className="gapp-btn-add" style={{ background: `linear-gradient(135deg, ${categoryModal.color}ee, ${categoryModal.color}aa)`, width: '100%', minWidth: 'auto' }} onClick={() => { setCategoryModal(null); setTimeout(() => { setExpForm(prev => ({ ...prev, category: categoryModal.id })); setEditItem(null); setShowExpForm(true); }, 150); }}>
                  + Agregar gasto en {categoryModal.label}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
