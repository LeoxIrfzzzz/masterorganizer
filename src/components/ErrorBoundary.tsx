import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ff5555', background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2>Something went wrong.</h2>
          <p style={{ opacity: 0.8 }}>The application crashed due to an unexpected error.</p>
          <pre style={{ textAlign: 'left', background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '8px', maxWidth: '100%', overflowX: 'auto', marginTop: '1rem' }}>
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => {
              if (window.confirm("This will clear your local database and session. Are you sure?")) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/";
              }
            }}
            style={{ marginTop: '2rem', padding: '0.8rem 1.5rem', background: '#ff5555', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Cache & Restart
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
