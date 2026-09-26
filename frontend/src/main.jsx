import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Quelle UI caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF9',
          padding: '24px',
          fontFamily: "'Space Grotesk', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            border: '2.5px solid #1C1917',
            borderRadius: '12px',
            background: 'white',
            boxShadow: '4px 4px 0px #1C1917',
            padding: '28px'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '6px 12px',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: '2px solid #1C1917',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              APPLICATION ERROR
            </div>
            <h2 style={{
              fontSize: '22px',
              fontWeight: 700,
              margin: '0 0 12px 0',
              color: '#1C1917'
            }}>
              Something went wrong loading Quelle
            </h2>
            <pre style={{
              backgroundColor: '#F5F5F4',
              border: '1.5px solid #D6D3D1',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#DC2626',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                border: '2.5px solid #1C1917',
                borderRadius: '8px',
                background: '#FFD60A',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '2px 2px 0px #1C1917'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
