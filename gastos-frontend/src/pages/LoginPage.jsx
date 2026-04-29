import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const fn = isSignup ? signup : login;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (!isSignup) navigate('/');
    else setError('Revisá tu email para confirmar la cuenta.');
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f0f2f5', display:'flex',
                  alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:12, padding:'40px 36px',
                    boxShadow:'0 4px 24px rgba(0,0,0,0.08)', width:'100%', maxWidth:380 }}>
        <h1 style={{ textAlign:'center', color:'#6c63ff', marginBottom:4 }}>💰</h1>
        <br></br>
        <h2 style={{ textAlign:'center', marginBottom:24, color:'#1a1a2e' }}>
          {isSignup ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>
        <form onSubmit={handleSubmit}>
          <label style={{ display:'block', marginBottom:4, fontSize:13, color:'#555' }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ddd',
                     marginBottom:14, fontSize:14, boxSizing:'border-box' }} />
          <label style={{ display:'block', marginBottom:4, fontSize:13, color:'#555' }}>Contraseña</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
            style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1px solid #ddd',
                     marginBottom:20, fontSize:14, boxSizing:'border-box' }} />
          {error && <p style={{ color:'#e74c3c', fontSize:13, marginBottom:12 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'12px', borderRadius:8, background:'#6c63ff',
                     color:'#fff', border:'none', fontSize:15, fontWeight:'bold', cursor:'pointer' }}>
            {loading ? 'Cargando...' : isSignup ? 'Registrarme' : 'Entrar'}
          </button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#888' }}>
          {isSignup ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}{' '}
          <span onClick={() => setIsSignup(!isSignup)}
            style={{ color:'#6c63ff', cursor:'pointer', textDecoration:'underline' }}>
            {isSignup ? 'Iniciá sesión' : 'Registrate'}
          </span>
        </p>
      </div>
    </div>
  );
}