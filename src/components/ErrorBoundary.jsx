import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Error capturado:', error?.message || error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container animate-fade-in" style={{ padding: '4rem 1rem' }}>
          <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
            <AlertCircle size={64} color="#dc2626" style={{ marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
              Algo salió mal
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
              Ocurrió un error inesperado. Por favor intentá de nuevo.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={this.handleReload}>
                <RefreshCw size={18} /> Recargar página
              </button>
            </div>
            {this.state.error && (
              <details style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600' }}>Detalles del error</summary>
                <pre style={{ marginTop: '0.5rem', padding: '1rem', background: '#1e1e1e', borderRadius: '8px', overflow: 'auto', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
