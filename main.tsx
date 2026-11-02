import {createRoot} from 'react-dom/client';
import './index.css';

// Keep operational tools out of the public site's initial JavaScript bundle.
const routePath = window.location.pathname.replace(/\/+$/, '');
const root = createRoot(document.getElementById('root')!);

if (routePath.startsWith('/admin')) {
  import('./admin/AdminApp').then(({ default: AdminApp }) => root.render(<AdminApp />));
} else if (routePath === '/pass') {
  import('./pass/PassPortal').then(({ default: PassPortal }) => root.render(<PassPortal />));
} else if (routePath === '/security-scanner') {
  import('./security/SecurityScannerApp').then(({ default: SecurityScannerApp }) => root.render(<SecurityScannerApp />));
} else {
  import('./App').then(({ default: App }) => root.render(<App />));
}
