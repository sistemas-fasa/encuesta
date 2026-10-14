import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import SurveyForm from './pages/SurveyForm';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { api } from './services/api';
import { ClipboardList, BarChart3, Settings, LogOut, User as UserIcon } from 'lucide-react';
import logo from './assets/logo.png';

// Protected Route Component
const ProtectedRoute = ({ user, children }) => {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cache busting: detectar si hay una versión nueva del build
  useEffect(() => {
    const checkVersion = async () => {
      const version = localStorage.getItem('app_version');
      if (version && version !== '__BUILD_VERSION__') {
        localStorage.clear();
        window.location.reload(true);
      }
      localStorage.setItem('app_version', '__BUILD_VERSION__');
    };
    checkVersion();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await api.getCurrentUser();
        setAuthUser(user);
      } catch (err) {
        console.error('Session check failed', err);
        setAuthUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setAuthUser(null);
    } catch (error) {
        console.error('Logout error', error);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-gradient)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '3px solid var(--glass-border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p>Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <nav className="glass-card no-print" style={{ 
        borderRadius: 0, 
        border: 'none', 
        borderBottom: '1px solid var(--glass-border)', 
        padding: '0.8rem 2rem', 
        display: 'grid', 
        gridTemplateColumns: '1fr auto 1fr', 
        alignItems: 'center', 
        boxShadow: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div style={{ visibility: 'hidden' }}>{/* Spacer para balancear el grid */}</div>
        
        <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <img src={logo} alt="Logo Ferretería Avenida" style={{ height: '75px', objectFit: 'contain' }} />
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', justifyContent: 'flex-end' }}>
            <div className="nav-links">
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={18} /> Encuestas
              </Link>
              {authUser && (
                <>
                  <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BarChart3 size={18} /> Análisis
                  </Link>
                  <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} /> Admin
                  </Link>
                </>
              )}
            </div>

            {authUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{authUser.nombre}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{authUser.rol.toUpperCase()}</span>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={handleLogout} title="Cerrar Sesión">
                        <LogOut size={18} color="#ef4444" />
                    </button>
                </div>
            )}
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<SurveyForm />} />
          <Route path="/encuesta/:id" element={<SurveyForm />} />
          <Route path="/login" element={<Login setAuthUser={setAuthUser} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute user={authUser}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute user={authUser}>
              <Admin />
            </ProtectedRoute>
          } />
        </Routes>
      </main>

      <footer className="no-print" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5, fontSize: '0.9rem' }}>
        &copy; 2026 SurveyFlow Analytics - Diseñado con precisión para la gestión de datos.
      </footer>
    </Router>
  );
}

export default App;
