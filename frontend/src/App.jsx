import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';

import Login from './pages/Login';
import SelectSociety from './pages/SelectSociety';
import Dashboard from './pages/Dashboard';
import AddBook from './pages/AddBook';
import Requests from './pages/Requests';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import PendingApproval from './pages/PendingApproval';
import Navigation from './components/Navigation';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') {
    return (
      <>
        <div className="content-area animate-in">{children}</div>
        <Navigation />
      </>
    );
  }
  if (!user.societyId) return <Navigate to="/society" replace />;
  if (user.status === 'PENDING') return <Navigate to="/pending" replace />;

  return (
    <>
      <div className="content-area animate-in">{children}</div>
      <Navigation />
    </>
  );
};

const HomeRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <ProtectedRoute><Dashboard /></ProtectedRoute>;
};

const MemberRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const SocietyRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SOCIETY_ADMIN' && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (user.role !== 'ADMIN') {
    if (!user.societyId) return <Navigate to="/society" replace />;
    if (user.status === 'PENDING') return <Navigate to="/pending" replace />;
  }
  return (
    <>
      <div className="content-area animate-in">{children}</div>
      <Navigation />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <div className="app-shell-glow app-shell-glow-one" />
        <div className="app-shell-glow app-shell-glow-two" />
        <Router>
          <PWAInstallPrompt />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/society" element={<SocietyRoute><SelectSociety /></SocietyRoute>} />
            <Route path="/pending" element={<PendingApproval />} />

            <Route path="/" element={<HomeRoute />} />
            <Route path="/add" element={<MemberRoute><AddBook /></MemberRoute>} />
            <Route path="/requests" element={<MemberRoute><Requests /></MemberRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
