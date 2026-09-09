import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Track Level Companion caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center text-center space-y-4 font-sans">
          <div className="text-4xl">🚂</div>
          <h1 className="text-xl font-bold text-amber-400">Track Level Companion</h1>
          <p className="text-sm text-zinc-400 max-w-md">
            Something unexpected occurred loading your saved track data. Tap below to reset and start fresh.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('track_level_companion_active');
              window.location.reload();
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl transition text-sm shadow-lg"
          >
            Reset Track Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
