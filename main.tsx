import {createRoot} from 'react-dom/client';
import './src/index.css';

// Keep operational tools out of the public site's initial JavaScript bundle.
const routePath = (window.location.pathname.replace(/\/+$/, '') || '/').toLowerCase();
const root = createRoot(document.getElementById('root')!);

if (routePath === '/admin' || routePath.startsWith('/admin/')) {
  import('./src/admin/AdminApp').then(({ default: AdminApp }) => root.render(<AdminApp />));
} else if (routePath === '/pass' || routePath.startsWith('/pass/')) {
  import('./pass/PassPortal').then(({ default: PassPortal }) => root.render(<PassPortal />));
} else if (routePath === '/security-scanner' || routePath.startsWith('/security-scanner/')) {
  import('./security/SecurityScannerApp').then(({ default: SecurityScannerApp }) => root.render(<SecurityScannerApp />));
} else {
  import('./src/App').then(({ default: App }) => root.render(<App />));
}

