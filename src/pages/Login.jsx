import React, { useState } from 'react';
import { api } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login({ setAuthUser }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = await api.login(usuario, password);
      setAuthUser(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Verifique e intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '85vh',
        background: 'radial-gradient(circle at top right, rgba(125, 211, 252, 0.15), transparent), radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.05), transparent)'
    }}>
      <div className="glass-card" style={{ 
          maxWidth: '450px', 
          width: '100%', 
          padding: '3.5rem',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 20px rgba(125, 211, 252, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <img 
            src={logo} 
            alt="Logo Ferretería Avenida" 
            style={{ 
                maxHeight: '52px', 
                maxWidth: '100%', 
                width: 'auto', 
                objectFit: 'contain', 
                marginBottom: '1.5rem', 
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' 
            }} 
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <ShieldCheck size={24} color="#0ea5e9" />
            <h1 style={{ 
                fontSize: '2rem', 
                margin: 0, 
                background: 'linear-gradient(to right, #0ea5e9, #1d4ed8)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
            }}>
                Acceso Privado
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
            Panel de Gestión Administrativa
          </p>
        </div>

        {error && (
          <div className="animate-shake" style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: '1rem', 
              marginBottom: '2rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem', 
              color: '#dc2626', 
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '600'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.8rem' }}>
          <div className="input-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem', color: '#64748b' }}>
              <User size={18} color="#0ea5e9" /> Usuario
            </label>
            <input 
              type="text" 
              value={usuario} 
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: admin"
              required
              className="input-group"
              style={{ 
                  margin: 0, 
                  background: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '1rem'
              }}
              autoComplete="username"
            />
          </div>

          <div className="input-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem', color: '#64748b' }}>
              <Lock size={18} color="#0ea5e9" /> Contraseña
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input-group"
              style={{ 
                  margin: 0, 
                  background: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '1rem'
              }}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
                width: '100%', 
                padding: '1.2rem', 
                marginTop: '0.5rem',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #0ea5e9, #1d4ed8)',
                boxShadow: '0 10px 20px -5px rgba(29, 78, 216, 0.3)'
            }} 
            disabled={loading}
          >
            {loading ? 'Verificando...' : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem' }}>
                <LogIn size={22} /> Entrar al Sistema
              </span>
            )}
          </button>
        </form>
        
        <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1.5rem' }}>
            &copy; 2026 Cámara de Comercio - Relevamiento Económico
        </div>
      </div>
    </div>
  );
}
