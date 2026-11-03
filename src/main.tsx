import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Keep operational tools out of the public site's initial JavaScript bundle.
const rawPath = window.location.pathname.replace(/\/+$/, '') || '/';
const routePath = rawPath.toLowerCase();
const root = createRoot(document.getElementById('root')!);

const renderError = (title: string, err: unknown) => {
  console.error(title, err);
  root.render(
    <div className="min-h-screen bg-[#100609] text-[#FFF3D6] flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md p-8 border border-[#D4AF6A]/30 rounded-2xl bg-black/50 backdrop-blur">
        <h1 className="font-cinzel text-xl font-bold mb-3 text-[#E8CBA4]">{title}</h1>
        <p className="text-sm text-[#A89D8A] mb-6">An error occurred while loading this section. Please check your internet connection and try reloading.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-xl border border-[#D4AF6A]/40 bg-[#D4AF6A]/10 text-[#FFF3D6] hover:bg-[#D4AF6A]/20 transition-all font-cinzel text-sm"
        >
          Reload page
        </button>
      </div>
    </div>
  );
};

if (routePath === '/admin' || routePath.startsWith('/admin/')) {
  import('./admin/AdminApp')
    .then(({ default: AdminApp }) => root.render(<AdminApp />))
    .catch((err) => renderError('Failed to load Organiser console', err));
} else if (routePath === '/pass' || routePath.startsWith('/pass/') || routePath === '/portal' || routePath.startsWith('/portal/')) {
  import('../pass/PassPortal')
    .then(({ default: PassPortal }) => root.render(<PassPortal />))
    .catch((err) => renderError('Failed to load Delegate Pass Portal', err));
} else if (routePath === '/security-scanner' || routePath.startsWith('/security-scanner/')) {
  import('../security/SecurityScannerApp')
    .then(({ default: SecurityScannerApp }) => root.render(<SecurityScannerApp />))
    .catch((err) => renderError('Failed to load Security Scanner', err));
} else if (routePath === '/privacy' || routePath.startsWith('/privacy/')) {
  import('./components/LegalPages')
    .then(({ LegalPages }) => root.render(<LegalPages initialTab="privacy" onBack={() => window.location.assign('/')} />))
    .catch((err) => renderError('Failed to load Privacy Policy', err));
} else if (routePath === '/terms' || routePath.startsWith('/terms/')) {
  import('./components/LegalPages')
    .then(({ LegalPages }) => root.render(<LegalPages initialTab="terms" onBack={() => window.location.assign('/')} />))
    .catch((err) => renderError('Failed to load Terms of Participation', err));
} else {
  root.render(<App />);
}
