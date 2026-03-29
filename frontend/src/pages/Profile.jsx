import { useAuth } from '../context/useAuth';
import { User, MapPin, Phone, LogOut } from 'lucide-react';

export default function Profile() {
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await logout();
            window.location.href = '/login';
        }
    };

    return (
        <div className="animate-in" style={{ padding: '1rem', paddingBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Your Profile</h2>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <User size={30} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.25rem' }}>{user.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user.role.replace('_', ' ')}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Phone size={18} color="var(--primary)" />
                        <span>{user.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MapPin size={18} color="var(--primary)" />
                        <span>{[user.wing, user.roomNumber].filter(Boolean).join(', ') || 'Add wing and room while joining a society'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <MapPin size={18} color="var(--primary)" />
                        <span>{user.society?.name ? `${user.society.name}${user.society.city ? `, ${user.society.city}` : ''}` : 'No Society Joined'}</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem',
                        color: 'var(--error)',
                        borderColor: 'var(--error)'
                    }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>About BookCircle</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    A hyperlocal platform for gated communities to share and exchange books within their society.
                </p>
            </div>
        </div>
    );
}
