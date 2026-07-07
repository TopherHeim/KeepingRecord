import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import SharePage from './components/SharePage';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Public shared-vault route: /v/<username> renders the read-only page
const shareMatch = window.location.pathname.match(/^\/v\/([^/]+)\/?$/);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {shareMatch
      ? <SharePage username={decodeURIComponent(shareMatch[1])} />
      : <App />}
  </React.StrictMode>
);