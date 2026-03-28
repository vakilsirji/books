import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApproval() {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="content-area animate-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⏳</div>
            <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Awaiting Approval</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Hi <strong>{user?.name}</strong>, your request to join
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                <strong>{user?.society?.name || 'the society'}</strong> is pending admin approval.
            </p>

            <div className="card" style={{ width: '100%', maxWidth: '320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <Clock size={18} color="var(--primary)" />
                    The society admin will review your request. You'll be able to access the app once approved.
                </div>
            </div>

            <button
                onClick={() => { logout(); navigate('/login'); }}
                className="btn btn-secondary"
                style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <LogOut size={16} /> Logout
            </button>
        </div>
    );
}
