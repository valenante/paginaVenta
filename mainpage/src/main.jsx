import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { ConfigProvider } from './context/ConfigContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TenantProvider>
    <AuthProvider>
      <ConfigProvider>
      <App />
      </ConfigProvider>
    </AuthProvider>
    </TenantProvider>
  </React.StrictMode>
);
