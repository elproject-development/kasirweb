import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartContext';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
              color: '#e9d5ff',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              padding: '20px 28px',
              fontSize: '16px',
              fontWeight: '500',
              borderRadius: '16px',
              minWidth: '320px',
              boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.25)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #14532d 0%, #312e81 100%)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #7f1d1d 0%, #312e81 100%)',
              },
            },
          }}
        />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>,
)