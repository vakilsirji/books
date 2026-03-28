import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SelectSociety() {
    const [societies, setSocieties] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', city: '', accessCode: '' });
    const [joinCode, setJoinCode] = useState('');
    const [error, setError] = useState('');

    const { token, user, logout, login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token || token === 'null' || !user) {
            navigate('/login');
            return;
        }
        if (!token || token === 'null') return;
        const headers = { 'Authorization': `Bearer ${token}` };

        fetch('/api/societies', {
            headers,
            credentials: 'include'
        })
            .then(res => res.json())
            .then(setSocieties)
            .catch(console.error);
    }, [token]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!token) {
            setError('You must be logged in to create a society. Please log out and log in again.');
            return;
        }
        try {
            console.log('--- Creating Society ---');
            console.log('Token from AuthContext:', token);
            const headers = { 'Content-Type': 'application/json' };
            if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/societies', {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            const data = await res.json().catch(() => ({ error: 'Server connection failed. Is the backend running?' }));
            if (!res.ok) throw new Error(data.error || 'Failed to create society');

            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/societies/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ accessCode: joinCode })
            });
            const data = await res.json().catch(() => ({ error: 'Server connection failed. Is the backend running?' }));
            if (!res.ok) throw new Error(data.error || 'Invalid access code');

            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="content-area animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ color: 'var(--primary)', margin: 0 }}>Connect Society</h1>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                    Logout
                </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${!isCreating ? 'btn-primary' : 'btn-secondary'} `}
                    onClick={() => setIsCreating(false)}
                >
                    Join Existing
                </button>
                <button
                    className={`btn ${isCreating ? 'btn-primary' : 'btn-secondary'} `}
                    onClick={() => setIsCreating(true)}
                >
                    Create New
                </button>
            </div>

            <div className="card">
                {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}

                {!isCreating ? (
                    <form onSubmit={handleJoin}>
                        <div className="input-group">
                            <label>Enter Society Access Code</label>
                            <input
                                type="text"
                                placeholder="E.g. BLD123"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Join Society</button>

                        <div style={{ marginTop: '2rem' }}>
                            <h3>Available Societies (For Demo)</h3>
                            <ul style={{ marginTop: '0.5rem', listStyle: 'none' }}>
                                {societies.map(s => (
                                    <li key={s.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                        <strong>{s.name}</strong> ({s.city})
                                    </li>
                                ))}
                                {societies.length === 0 && <p>No societies created yet. Be the first!</p>}
                            </ul>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleCreate}>
                        <div className="input-group">
                            <label>Society / Apartment Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Create Unique Access Code</label>
                            <input
                                type="text"
                                value={formData.accessCode}
                                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                                placeholder="To share with members"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Create & Join</button>
                    </form>
                )}
            </div>
        </div>
    );
}
