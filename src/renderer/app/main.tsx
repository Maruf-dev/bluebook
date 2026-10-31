import React from 'react';
import ReactDOM from 'react-dom/client';
// HashRouter: the packaged app is loaded from file://, where BrowserRouter paths do not resolve.
import { HashRouter } from 'react-router-dom';
import 'katex/dist/katex.min.css';
import './index.css';
import App from './App';
import { applyTheme, useAppStore } from '../store/useAppStore';

applyTheme(useAppStore.getState().theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
