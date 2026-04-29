import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { CATEGORIES, INCOME_TYPES, getCategoryById, getIncomeTypeById } from '../categories';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
         ResponsiveContainer, Legend } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS' }).format(n);
const today = () => new Date().toISOString().split('T')[0];
const currentMonth = () => today().slice(0, 7);

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [month, setMonth]         = useState(currentMonth());
  const [expenses, setExpenses]   = useState([]);
  const [incomes, setIncomes]     = useState([]);
  const [view, setView]           = useState('dashboard'); // 'dashboard' | 'expenses' | 'incomes' | 'charts'
  const [showExpForm, setShowExpForm] = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);
  const [editItem, setEditItem]   = useState(null);

  const [expForm, setExpForm] = useState({ amount:'', category:'credit_card', subcategory:'', description:'', date:today() });
  const [incForm, setIncForm] = useState({ amount:'', type:'salary', description:'', date:today() });

  const loadData = useCallback(async () => {
    const [expRes, incRes] = await Promise.all([
      api.get(`/expenses?month=${month}`),
      api.get(`/incomes?month=${month}`)
    ]);
    setExpenses(expRes.data);
    setIncomes(incRes.data);
  }, [month]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalIncome  = incomes.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const balance      = totalIncome - totalExpense;

  // Gastos agrupados por categoría
  const byCategory = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s,e) => s + parseFloat(e.amount), 0)
  })).filter(c => c.total > 0);

  const saveExpense = async (e) => {
    e.preventDefault();
    if (editItem) {
      await api.put(`/expenses/${editItem.id}`, expForm);
    } else {
      await api.post('/expenses', expForm);
    }
    setShowExpForm(false); setEditItem(null);
    setExpForm({ amount:'', category:'credit_card', subcategory:'', description:'', date:today() });
    loadData();
  };

  const saveIncome = async (e) => {
    e.preventDefault();
    if (editItem) {
      await api.put(`/incomes/${editItem.id}`, incForm);
    } else {
      await api.post('/incomes', incForm);
    }
    setShowIncForm(false); setEditItem(null);
    setIncForm({ amount:'', type:'salary', description:'', date:today() });
    loadData();
  };

  const deleteExpense = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await api.delete(`/expenses/${id}`);
    loadData();
  };

  const deleteIncome = async (id) => {
    if (!confirm('¿Eliminar este ingreso?')) return;
    await api.delete(`/incomes/${id}`);
    loadData();
  };

  const startEditExpense = (item) => {
    setEditItem(item);
    setExpForm({ amount: item.amount, category: item.category,
                 subcategory: item.subcategory || '', description: item.description || '', date: item.date });
    setShowExpForm(true);
  };

  const startEditIncome = (item) => {
    setEditItem(item);
    setIncForm({ amount: item.amount, type: item.type,
                 description: item.description || '', date: item.date });
    setShowIncForm(true);
  };

  const inputStyle = {
    width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #ddd',
    marginBottom:12, fontSize:14, boxSizing:'border-box'
  };
  const btnPrimary = {
    padding:'10px 20px', borderRadius:8, background:'#6c63ff', color:'#fff',
    border:'none', fontSize:14, cursor:'pointer', fontWeight:'bold'
  };
  const btnDanger = {
    padding:'6px 12px', borderRadius:6, background:'#fee', color:'#e74c3c',
    border:'1px solid #fcc', fontSize:13, cursor:'pointer'
  };
  const btnEdit = {
    padding:'6px 12px', borderRadius:6, background:'#f0f0ff', color:'#6c63ff',
    border:'1px solid #d0cfff', fontSize:13, cursor:'pointer'
  };

  const navItems = [
    { key:'dashboard', label:'📊 Resumen' },
    { key:'expenses',  label:'💸 Gastos' },
    { key:'incomes',   label:'💰 Ingresos' },
    { key:'charts',    label:'📈 Gráficos' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f4f6fb', fontFamily:'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background:'#6c63ff', color:'#fff', padding:'14px 20px',
                    display:'flex', alignItems:'center', justifyContent:'space-between',
                    position:'sticky', top:0, zIndex:100 }}>
        <span style={{ fontWeight:'bold', fontSize:18 }}>💰 Mis Gastos</span>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            style={{ padding:'5px 10px', borderRadius:6, border:'none', fontSize:13 }} />
          <span style={{ fontSize:13, opacity:0.85 }}>{user.email}</span>
          <button onClick={logout}
            style={{ padding:'6px 14px', borderRadius:6, background:'rgba(255,255,255,0.2)',
                     color:'#fff', border:'none', cursor:'pointer', fontSize:13 }}>
            Salir
          </button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:'#fff', borderBottom:'1px solid #eee', display:'flex',
                    overflowX:'auto', padding:'0 12px' }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setView(n.key)}
            style={{ padding:'14px 18px', border:'none', background:'none', cursor:'pointer',
                     fontSize:14, fontWeight: view===n.key ? 'bold' : 'normal',
                     color: view===n.key ? '#6c63ff' : '#666',
                     borderBottom: view===n.key ? '3px solid #6c63ff' : '3px solid transparent',
                     whiteSpace:'nowrap' }}>
            {n.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'20px 16px' }}>

        {/* ── DASHBOARD ── */}
        {view === 'dashboard' && (
          <div>
            {/* Cards de resumen */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:24 }}>
              {[
                { label:'Total ingresos', value: fmt(totalIncome),  color:'#27ae60', bg:'#eafaf1' },
                { label:'Total gastos',   value: fmt(totalExpense), color:'#e74c3c', bg:'#fef0f0' },
                { label:'Saldo disponible', value: fmt(balance),
                  color: balance >= 0 ? '#27ae60' : '#e74c3c',
                  bg: balance >= 0 ? '#eafaf1' : '#fef0f0' },
              ].map(c => (
                <div key={c.label} style={{ background:c.bg, borderRadius:12, padding:'20px 18px',
                                             borderLeft:`4px solid ${c.color}` }}>
                  <div style={{ fontSize:13, color:'#888', marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:22, fontWeight:'bold', color:c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Categorías */}
            <h3 style={{ marginBottom:14, color:'#1a1a2e' }}>Gastos por categoría</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, marginBottom:24 }}>
              {CATEGORIES.map(cat => {
                const total = expenses.filter(e => e.category === cat.id).reduce((s,e) => s + parseFloat(e.amount), 0);
                return (
                  <div key={cat.id} style={{ background:'#fff', borderRadius:12, padding:'16px 14px',
                                              boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                                              borderTop:`3px solid ${cat.color}`, textAlign:'center' }}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{cat.icon}</div>
                    <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>{cat.label}</div>
                    <div style={{ fontSize:16, fontWeight:'bold', color: total > 0 ? '#1a1a2e' : '#ccc' }}>
                      {total > 0 ? fmt(total) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Acciones rápidas */}
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => setShowExpForm(true)} style={{ ...btnPrimary, background:'#e74c3c' }}>
                + Agregar gasto
              </button>
              <button onClick={() => setShowIncForm(true)} style={{ ...btnPrimary, background:'#27ae60' }}>
                + Agregar ingreso
              </button>
            </div>
          </div>
        )}

        {/* ── GASTOS ── */}
        {view === 'expenses' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0 }}>Gastos del mes</h3>
              <button onClick={() => { setEditItem(null); setShowExpForm(true); }} style={btnPrimary}>
                + Nuevo gasto
              </button>
            </div>
            {expenses.length === 0 && <p style={{ color:'#888' }}>No hay gastos cargados este mes.</p>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {expenses.map(exp => {
                const cat = getCategoryById(exp.category);
                return (
                  <div key={exp.id} style={{ background:'#fff', borderRadius:10, padding:'14px 16px',
                                              display:'flex', alignItems:'center', gap:12,
                                              boxShadow:'0 2px 6px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize:24 }}>{cat?.icon || '📦'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'bold', color:'#1a1a2e' }}>
                        {cat?.label || exp.category}
                        {exp.subcategory && <span style={{ color:'#888', fontWeight:'normal' }}> — {exp.subcategory}</span>}
                      </div>
                      {exp.description && <div style={{ fontSize:13, color:'#888' }}>{exp.description}</div>}
                      <div style={{ fontSize:12, color:'#aaa' }}>{exp.date}</div>
                    </div>
                    <div style={{ fontWeight:'bold', color:'#e74c3c', fontSize:16 }}>{fmt(exp.amount)}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => startEditExpense(exp)} style={btnEdit}>✏️</button>
                      <button onClick={() => deleteExpense(exp.id)} style={btnDanger}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── INGRESOS ── */}
        {view === 'incomes' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ margin:0 }}>Ingresos del mes</h3>
              <button onClick={() => { setEditItem(null); setShowIncForm(true); }} style={{ ...btnPrimary, background:'#27ae60' }}>
                + Nuevo ingreso
              </button>
            </div>
            {incomes.length === 0 && <p style={{ color:'#888' }}>No hay ingresos cargados este mes.</p>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {incomes.map(inc => {
                const type = getIncomeTypeById(inc.type);
                return (
                  <div key={inc.id} style={{ background:'#fff', borderRadius:10, padding:'14px 16px',
                                              display:'flex', alignItems:'center', gap:12,
                                              boxShadow:'0 2px 6px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize:24 }}>{type?.icon || '💰'}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:'bold', color:'#1a1a2e' }}>{type?.label || inc.type}</div>
                      {inc.description && <div style={{ fontSize:13, color:'#888' }}>{inc.description}</div>}
                      <div style={{ fontSize:12, color:'#aaa' }}>{inc.date}</div>
                    </div>
                    <div style={{ fontWeight:'bold', color:'#27ae60', fontSize:16 }}>{fmt(inc.amount)}</div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => startEditIncome(inc)} style={btnEdit}>✏️</button>
                      <button onClick={() => deleteIncome(inc.id)} style={btnDanger}>🗑️</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── GRÁFICOS ── */}
        {view === 'charts' && (
          <div>
            <h3>Distribución de gastos</h3>
            {byCategory.length === 0
              ? <p style={{ color:'#888' }}>Sin datos para mostrar.</p>
              : <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={110} label>
                        {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <h3 style={{ marginTop:32 }}>Gastos por categoría (barras)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byCategory} margin={{ top:5, right:20, left:20, bottom:60 }}>
                      <XAxis dataKey="label" angle={-35} textAnchor="end" interval={0} tick={{ fontSize:11 }} />
                      <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Bar dataKey="total" radius={[4,4,0,0]}>
                        {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
            }
          </div>
        )}
      </div>

      {/* ── MODAL GASTO ── */}
      {showExpForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex',
                      alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'28px 24px',
                        width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ marginTop:0 }}>{editItem ? 'Editar gasto' : 'Nuevo gasto'}</h3>
            <form onSubmit={saveExpense}>
              <label style={{ fontSize:13, color:'#555' }}>Categoría</label>
              <select value={expForm.category} onChange={e => setExpForm({...expForm, category:e.target.value})}
                style={{ ...inputStyle }}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
              <label style={{ fontSize:13, color:'#555' }}>Monto ($)</label>
              <input type="number" step="0.01" required value={expForm.amount}
                onChange={e => setExpForm({...expForm, amount:e.target.value})} style={inputStyle} placeholder="0.00" />
              <label style={{ fontSize:13, color:'#555' }}>Subcategoría (opcional)</label>
              <input value={expForm.subcategory} onChange={e => setExpForm({...expForm, subcategory:e.target.value})}
                style={inputStyle} placeholder="ej: Visa, Naranja, Uber..." />
              <label style={{ fontSize:13, color:'#555' }}>Descripción (opcional)</label>
              <input value={expForm.description} onChange={e => setExpForm({...expForm, description:e.target.value})}
                style={inputStyle} placeholder="ej: Asado del sábado" />
              <label style={{ fontSize:13, color:'#555' }}>Fecha</label>
              <input type="date" required value={expForm.date}
                onChange={e => setExpForm({...expForm, date:e.target.value})} style={inputStyle} />
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" style={{ ...btnPrimary, background:'#e74c3c', flex:1 }}>
                  {editItem ? 'Guardar cambios' : 'Agregar gasto'}
                </button>
                <button type="button" onClick={() => { setShowExpForm(false); setEditItem(null); }}
                  style={{ ...btnPrimary, background:'#aaa', flex:1 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL INGRESO ── */}
      {showIncForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex',
                      alignItems:'center', justifyContent:'center', zIndex:200, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:'28px 24px',
                        width:'100%', maxWidth:440 }}>
            <h3 style={{ marginTop:0 }}>{editItem ? 'Editar ingreso' : 'Nuevo ingreso'}</h3>
            <form onSubmit={saveIncome}>
              <label style={{ fontSize:13, color:'#555' }}>Tipo de ingreso</label>
              <select value={incForm.type} onChange={e => setIncForm({...incForm, type:e.target.value})}
                style={{ ...inputStyle }}>
                {INCOME_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
              <label style={{ fontSize:13, color:'#555' }}>Monto ($)</label>
              <input type="number" step="0.01" required value={incForm.amount}
                onChange={e => setIncForm({...incForm, amount:e.target.value})} style={inputStyle} placeholder="0.00" />
              <label style={{ fontSize:13, color:'#555' }}>Descripción (opcional)</label>
              <input value={incForm.description} onChange={e => setIncForm({...incForm, description:e.target.value})}
                style={inputStyle} placeholder="ej: Freelance diseño web" />
              <label style={{ fontSize:13, color:'#555' }}>Fecha</label>
              <input type="date" required value={incForm.date}
                onChange={e => setIncForm({...incForm, date:e.target.value})} style={inputStyle} />
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" style={{ ...btnPrimary, background:'#27ae60', flex:1 }}>
                  {editItem ? 'Guardar cambios' : 'Agregar ingreso'}
                </button>
                <button type="button" onClick={() => { setShowIncForm(false); setEditItem(null); }}
                  style={{ ...btnPrimary, background:'#aaa', flex:1 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}