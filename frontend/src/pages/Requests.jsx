import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';

export default function Requests() {
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [tab, setTab] = useState('incoming');
    const { token } = useAuth();

    const formBody = (values) => new URLSearchParams(
        Object.entries(values).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                acc[key] = value;
            }
            return acc;
        }, {})
    ).toString();

    const fetchRequests = useCallback(async () => {
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch('/api/requests', { headers, credentials: 'include' });
            const data = await res.json();
            if (res.ok) {
                setIncoming(data.incoming);
                setOutgoing(data.outgoing);
            }
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchRequests();
        }, 0);

        return () => clearTimeout(timer);
    }, [fetchRequests]);

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/requests/${id}?status=${encodeURIComponent(status)}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: formBody({ status })
            });
            if (res.ok) {
                fetchRequests();
            } else {
                const errorData = await res.json();
                alert(errorData.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-in" style={{ padding: '1rem', paddingBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Your Requests</h2>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className={`btn ${tab === 'incoming' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('incoming')}>
                    Incoming ({incoming.length})
                </button>
                <button className={`btn ${tab === 'outgoing' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('outgoing')}>
                    Outgoing ({outgoing.length})
                </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {tab === 'incoming' && incoming.length === 0 && <p className="card" style={{ textAlign: 'center' }}>No incoming requests.</p>}
                {tab === 'incoming' && incoming.map(req => (
                    <div key={req.id} className="card">
                        <h4 style={{ color: 'var(--primary)' }}>{req.book.title}</h4>
                        <p style={{ marginTop: '0.5rem' }}><strong>Requested by:</strong> {req.requester.name} ({req.requester.phone})</p>
                        <p><strong>Status:</strong> <span className="badge">{req.status}</span></p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {req.status === 'REQUESTED' && (
                                <>
                                    <button className="btn btn-primary" onClick={() => updateStatus(req.id, 'APPROVED')} style={{ padding: '0.5rem' }}>Approve</button>
                                    <button className="btn btn-secondary" onClick={() => updateStatus(req.id, 'REJECTED')} style={{ padding: '0.5rem' }}>Reject</button>
                                </>
                            )}
                            {req.status === 'PICKED' && (
                                <button className="btn btn-primary" onClick={() => updateStatus(req.id, 'RETURNED')} style={{ padding: '0.5rem' }}>Mark Returned</button>
                            )}
                        </div>
                    </div>
                ))}

                {tab === 'outgoing' && outgoing.length === 0 && <p className="card" style={{ textAlign: 'center' }}>No outgoing requests.</p>}
                {tab === 'outgoing' && outgoing.map(req => (
                    <div key={req.id} className="card">
                        <h4 style={{ color: 'var(--primary)' }}>{req.book.title}</h4>
                        <p style={{ marginTop: '0.5rem' }}><strong>Owner:</strong> {req.book.owner.name} ({req.book.owner.phone})</p>
                        <p><strong>Status:</strong> <span className="badge">{req.status}</span></p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {req.status === 'APPROVED' && (
                                <button className="btn btn-primary" onClick={() => updateStatus(req.id, 'PICKED')} style={{ padding: '0.5rem' }}>Mark Picked Up</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
