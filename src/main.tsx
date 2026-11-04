import { createRoot } from 'react-dom/client';
import App from './App';
import AdminPage from './components/AdminPage';
import { installDomFallback } from './i18n/domFallback';
import './styles.css';
import './components/admin.css';
createRoot(document.getElementById('root')!).render(location.pathname === '/admin' || location.pathname.startsWith('/admin/') ? <AdminPage/> : <App/>);
installDomFallback();
