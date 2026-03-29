import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { Building2, CheckCircle, Clock3, CreditCard, Phone, Shield, Sparkles, Users, XCircle } from 'lucide-react';

const requestColors = { REQUESTED: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', PICKED: '#0f766e', RETURNED: '#64748b' };
const approvalColors = { PENDING: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444' };
const subColors = { TRIALING: '#0f766e', ACTIVE: '#10b981', PAST_DUE: '#f59e0b', CANCELED: '#64748b' };
const fmt = (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

function formBody(values) {
    return new URLSearchParams(
        Object.entries(values).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
                acc[key] = value;
            }
            return acc;
        }, {})
    );
}

function SocietyAdminView({ token, user }) {
    const [stats, setStats] = useState(null);
    const [members, setMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [tab, setTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const statsRes = await fetch('/api/societies/admin/stats', { headers, credentials: 'include' });
            const membersRes = await fetch('/api/societies/admin/members', { headers, credentials: 'include' });
            const requestsRes = await fetch('/api/societies/admin/requests', { headers, credentials: 'include' });
            setStats(await statsRes.json());
            setMembers(await membersRes.json());
            setRequests(await requestsRes.json());
        } finally {
            setLoading(false);
        }
    }, [headers]);

    useEffect(() => { load(); }, [load]);
    const pending = members.filter((m) => m.status === 'PENDING');
    const active = members.filter((m) => m.status === 'ACTIVE');

    const act = async (url, body) => {
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: formBody(body)
        });
        if (res.ok) load();
    };

    if (loading) return <div className="admin-loading">Loading admin data...</div>;

    return (
        <div className="admin-dashboard animate-in">
            <section className="admin-hero">
                <div>
                    <span className="admin-kicker"><Sparkles size={14} />Society Operations</span>
                    <h1>Admin command center</h1>
                    <p>Approve members and manage activity for {user?.society?.name || 'your society'}.</p>
                </div>
                <div className="admin-hero-meta">
                    <div className="admin-pill"><Shield size={16} />Society Admin</div>
                    {user?.society && <div className="admin-pill muted">{user.society.approvalStatus} • {user.society.subscriptionPlan} • {user.society.subscriptionStatus}</div>}
                </div>
            </section>

            <section className="admin-stats-grid">
                <article className="stat-card stat-card-primary"><div className="stat-card-label">Members</div><div className="stat-card-value">{stats?.memberCount ?? 0}</div><div className="stat-card-note">{pending.length} pending</div></article>
                <article className="stat-card"><div className="stat-card-label">Books</div><div className="stat-card-value">{stats?.bookCount ?? 0}</div><div className="stat-card-note">Listed now</div></article>
                <article className="stat-card"><div className="stat-card-label">Requests</div><div className="stat-card-value">{stats?.requestCount ?? 0}</div><div className="stat-card-note">Live exchanges</div></article>
                <article className="stat-card"><div className="stat-card-label">Plan ends</div><div className="stat-card-value admin-stat-small">{fmt(user?.society?.subscriptionEndsAt)}</div><div className="stat-card-note">Billing cycle</div></article>
            </section>

            <section className="admin-tabs">
                <button className={`admin-tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>Pending {pending.length}</button>
                <button className={`admin-tab ${tab === 'members' ? 'active' : ''}`} onClick={() => setTab('members')}>Members {active.length}</button>
                <button className={`admin-tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Requests {requests.length}</button>
            </section>

            {tab === 'pending' && <section className="admin-panel"><div className="panel-head"><div><h2>Pending approvals</h2><p>Review new members.</p></div></div>{pending.length === 0 ? <div className="empty-state">No pending approvals right now.</div> : <div className="table-like">{pending.map((m) => <div key={m.id} className="table-row"><div className="table-main"><strong>{m.name || 'Unnamed member'}</strong><span><Phone size={13} /> {m.phone}</span></div><div className="table-actions"><button className="btn btn-primary" onClick={() => act(`/api/societies/admin/members/${m.id}/approve`, { action: 'approve' })}><CheckCircle size={16} />Approve</button><button className="btn btn-secondary danger-outline" onClick={() => act(`/api/societies/admin/members/${m.id}/approve`, { action: 'reject' })}><XCircle size={16} />Reject</button></div></div>)}</div>}</section>}

            {tab === 'members' && <section className="admin-panel"><div className="panel-head"><div><h2>Member directory</h2><p>Promote trusted members.</p></div></div><div className="table-like">{active.map((m) => <div key={m.id} className="table-row"><div className="table-main"><strong>{m.name || 'Unnamed member'}</strong><span><Phone size={13} /> {m.phone}</span></div><div className="table-meta"><span>{m.role.replace('_', ' ')}</span><span>{m._count.books} books</span></div><div className="table-actions">{m.id !== user?.id && <button className="btn btn-secondary" onClick={() => act(`/api/societies/admin/members/${m.id}/role`, { role: m.role === 'SOCIETY_ADMIN' ? 'MEMBER' : 'SOCIETY_ADMIN' })}>{m.role === 'SOCIETY_ADMIN' ? 'Demote' : 'Make Admin'}</button>}</div></div>)}</div></section>}

            {tab === 'requests' && <section className="admin-panel"><div className="panel-head"><div><h2>Request timeline</h2><p>See borrowing demand.</p></div></div><div className="table-like">{requests.map((r) => <div key={r.id} className="table-row"><div className="table-main"><strong>{r.book.title}</strong><span>by {r.book.author}</span></div><div className="table-meta"><span>{r.requester.name}</span><span>{fmt(r.createdAt)}</span></div><div className="table-actions"><span className="status-badge" style={{ backgroundColor: `${requestColors[r.status]}1a`, color: requestColors[r.status] }}>{r.status}</span></div></div>)}</div></section>}
        </div>
    );
}

function PlatformAdminView({ token }) {
    const [stats, setStats] = useState(null);
    const [societies, setSocieties] = useState([]);
    const [tab, setTab] = useState('approvals');
    const [loading, setLoading] = useState(true);
    const [actionError, setActionError] = useState('');
    const [savingId, setSavingId] = useState('');
    const [createForm, setCreateForm] = useState({
        name: '',
        city: '',
        accessCode: '',
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'TRIALING',
        approvalStatus: 'APPROVED',
        adminName: '',
        adminPhone: '',
        adminPassword: ''
    });
    const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/societies/admin/platform/overview', { headers, credentials: 'include' });
            if (!res.ok) {
                throw new Error('Failed to load platform admin data');
            }
            const data = await res.json();
            setStats(data.stats);
            setSocieties(data.societies || []);
            setActionError('');
        } catch (error) {
            setActionError(error.message || 'Failed to load platform admin data');
        } finally {
            setLoading(false);
        }
    }, [headers]);

    useEffect(() => { load(); }, [load]);
    const pending = societies.filter((s) => s.approvalStatus === 'PENDING');

    const patch = async (societyId, url, body) => {
        setSavingId(societyId);
        setActionError('');
        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
                credentials: 'include',
                body: formBody(body)
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Failed to update society' }));
                throw new Error(data.error || 'Failed to update society');
            }
            await load();
        } catch (error) {
            setActionError(error.message || 'Failed to update society');
        } finally {
            setSavingId('');
        }
    };

    const createSociety = async (e) => {
        e.preventDefault();
        const res = await fetch('/api/societies/admin/platform/societies', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
            credentials: 'include',
            body: formBody(createForm)
        });

        if (res.ok) {
            setCreateForm({
                name: '',
                city: '',
                accessCode: '',
                subscriptionPlan: 'FREE',
                subscriptionStatus: 'TRIALING',
                approvalStatus: 'APPROVED',
                adminName: '',
                adminPhone: '',
                adminPassword: ''
            });
            await load();
        } else {
            const data = await res.json().catch(() => ({ error: 'Failed to create society' }));
            alert(data.error);
        }
    };

    if (loading) return <div className="admin-loading">Loading platform admin data...</div>;

    return (
        <div className="admin-dashboard animate-in">
            <section className="admin-hero">
                <div>
                    <span className="admin-kicker"><Sparkles size={14} />SaaS Control Room</span>
                    <h1>Platform admin dashboard</h1>
                    <p>Approve societies and manage subscriptions across the entire BookCircle SaaS platform.</p>
                </div>
                <div className="admin-hero-meta">
                    <div className="admin-pill"><Shield size={16} />Platform Admin</div>
                    <div className="admin-pill muted"><Clock3 size={16} />{stats?.pendingSocieties ?? 0} waiting</div>
                </div>
            </section>

            <section className="admin-stats-grid">
                <article className="stat-card stat-card-primary"><div className="stat-card-icon"><Building2 size={18} /></div><div className="stat-card-label">Societies</div><div className="stat-card-value">{stats?.totalSocieties ?? 0}</div><div className="stat-card-note">{stats?.approvedSocieties ?? 0} approved</div></article>
                <article className="stat-card"><div className="stat-card-icon accent-amber"><CheckCircle size={18} /></div><div className="stat-card-label">Pending</div><div className="stat-card-value">{stats?.pendingSocieties ?? 0}</div><div className="stat-card-note">Approval queue</div></article>
                <article className="stat-card"><div className="stat-card-icon accent-green"><CreditCard size={18} /></div><div className="stat-card-label">Active subs</div><div className="stat-card-value">{stats?.activeSubscriptions ?? 0}</div><div className="stat-card-note">Billing live</div></article>
                <article className="stat-card"><div className="stat-card-icon"><Users size={18} /></div><div className="stat-card-label">Network users</div><div className="stat-card-value">{stats?.totalUsers ?? 0}</div><div className="stat-card-note">{stats?.totalBooks ?? 0} books</div></article>
            </section>

            <section className="admin-tabs">
                <button className={`admin-tab ${tab === 'approvals' ? 'active' : ''}`} onClick={() => setTab('approvals')}>Approvals {pending.length}</button>
                <button className={`admin-tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>Create Society</button>
                <button className={`admin-tab ${tab === 'subscriptions' ? 'active' : ''}`} onClick={() => setTab('subscriptions')}>Subscriptions</button>
                <button className={`admin-tab ${tab === 'directory' ? 'active' : ''}`} onClick={() => setTab('directory')}>Societies</button>
            </section>

            {actionError && <div className="card" style={{ marginBottom: '1rem', color: 'var(--error)' }}>{actionError}</div>}

            {tab === 'approvals' && <section className="admin-panel"><div className="panel-head"><div><h2>Society approval queue</h2><p>Review new tenant applications.</p></div></div>{pending.length === 0 ? <div className="empty-state">No society approvals are waiting right now.</div> : <div className="table-like">{pending.map((s) => <div key={s.id} className="table-row"><div className="table-main"><strong>{s.name}</strong><span>{s.city} • Code {s.accessCode}</span><span>Admin: {s.users?.[0]?.name || 'Unknown'} {s.users?.[0]?.phone ? `(${s.users[0].phone})` : ''}</span></div><div className="table-meta"><span>{s._count.users} users</span><span>{fmt(s.createdAt)}</span></div><div className="table-actions"><button className="btn btn-primary" disabled={savingId === s.id} onClick={() => patch(s.id, `/api/societies/admin/platform/societies/${s.id}/approval`, { approvalStatus: 'APPROVED' })}><CheckCircle size={16} />{savingId === s.id ? 'Saving...' : 'Approve'}</button><button className="btn btn-secondary danger-outline" disabled={savingId === s.id} onClick={() => patch(s.id, `/api/societies/admin/platform/societies/${s.id}/approval`, { approvalStatus: 'REJECTED' })}><XCircle size={16} />{savingId === s.id ? 'Saving...' : 'Reject'}</button></div></div>)}</div>}</section>}

            {tab === 'create' && <section className="admin-panel"><div className="panel-head"><div><h2>Create society</h2><p>Add a new society and its first society admin from the SaaS admin panel.</p></div></div><form className="platform-form-grid" onSubmit={createSociety}><div className="input-group"><label>Society name</label><input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required /></div><div className="input-group"><label>City</label><input value={createForm.city} onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })} required /></div><div className="input-group"><label>Access code</label><input value={createForm.accessCode} onChange={(e) => setCreateForm({ ...createForm, accessCode: e.target.value.toUpperCase() })} placeholder="Optional" /></div><div className="input-group"><label>Approval</label><select value={createForm.approvalStatus} onChange={(e) => setCreateForm({ ...createForm, approvalStatus: e.target.value })}><option value="APPROVED">APPROVED</option><option value="PENDING">PENDING</option><option value="REJECTED">REJECTED</option></select></div><div className="input-group"><label>Plan</label><select value={createForm.subscriptionPlan} onChange={(e) => setCreateForm({ ...createForm, subscriptionPlan: e.target.value })}><option value="FREE">FREE</option><option value="PRO">PRO</option><option value="ENTERPRISE">ENTERPRISE</option></select></div><div className="input-group"><label>Subscription</label><select value={createForm.subscriptionStatus} onChange={(e) => setCreateForm({ ...createForm, subscriptionStatus: e.target.value })}><option value="TRIALING">TRIALING</option><option value="ACTIVE">ACTIVE</option><option value="PAST_DUE">PAST_DUE</option><option value="CANCELED">CANCELED</option></select></div><div className="input-group"><label>Admin name</label><input value={createForm.adminName} onChange={(e) => setCreateForm({ ...createForm, adminName: e.target.value })} required /></div><div className="input-group"><label>Admin phone</label><input value={createForm.adminPhone} onChange={(e) => setCreateForm({ ...createForm, adminPhone: e.target.value })} required /></div><div className="input-group"><label>Admin password</label><input type="password" value={createForm.adminPassword} onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })} required /></div><button className="btn btn-primary" type="submit">Create Society + Admin</button></form></section>}

            {tab === 'subscriptions' && <section className="admin-panel"><div className="panel-head"><div><h2>Subscription management</h2><p>Control plan and billing state for every society.</p></div></div><div className="table-like">{societies.map((s) => <div key={s.id} className="table-row"><div className="table-main"><strong>{s.name}</strong><span>{s.city}</span><span>Ends {fmt(s.subscriptionEndsAt)}</span></div><div className="table-meta"><span className="status-badge" style={{ backgroundColor: `${approvalColors[s.approvalStatus]}1a`, color: approvalColors[s.approvalStatus] }}>{s.approvalStatus}</span><span className="status-badge" style={{ backgroundColor: `${subColors[s.subscriptionStatus]}1a`, color: subColors[s.subscriptionStatus] }}>{s.subscriptionStatus}</span></div><div className="table-actions table-actions-wrap"><select className="table-select" disabled={savingId === s.id} value={s.subscriptionPlan} onChange={(e) => patch(s.id, `/api/societies/admin/platform/societies/${s.id}/subscription`, { subscriptionPlan: e.target.value, subscriptionStatus: s.subscriptionStatus, subscriptionEndsAt: s.subscriptionEndsAt })}><option value="FREE">FREE</option><option value="PRO">PRO</option><option value="ENTERPRISE">ENTERPRISE</option></select><select className="table-select" disabled={savingId === s.id} value={s.subscriptionStatus} onChange={(e) => patch(s.id, `/api/societies/admin/platform/societies/${s.id}/subscription`, { subscriptionPlan: s.subscriptionPlan, subscriptionStatus: e.target.value, subscriptionEndsAt: s.subscriptionEndsAt })}><option value="TRIALING">TRIALING</option><option value="ACTIVE">ACTIVE</option><option value="PAST_DUE">PAST_DUE</option><option value="CANCELED">CANCELED</option></select></div></div>)}</div></section>}

            {tab === 'directory' && <section className="admin-panel"><div className="panel-head"><div><h2>Society directory</h2><p>Live tenant view across the platform.</p></div></div><div className="table-like">{societies.map((s) => <div key={s.id} className="table-row"><div className="table-main"><strong>{s.name}</strong><span>{s.city} • Access {s.accessCode}</span><span>Admin: {s.users?.[0]?.name || 'Unknown'}</span></div><div className="table-meta"><span>{s._count.users} users</span><span>{s._count.books} books</span></div><div className="table-actions table-actions-column"><span className="status-badge" style={{ backgroundColor: `${approvalColors[s.approvalStatus]}1a`, color: approvalColors[s.approvalStatus] }}>{s.approvalStatus}</span><span className="status-badge" style={{ backgroundColor: `${subColors[s.subscriptionStatus]}1a`, color: subColors[s.subscriptionStatus] }}>{s.subscriptionPlan} • {s.subscriptionStatus}</span></div></div>)}</div></section>}
        </div>
    );
}

export default function AdminDashboard() {
    const { token, user } = useAuth();
    return user?.role === 'ADMIN' ? <PlatformAdminView token={token} /> : <SocietyAdminView token={token} user={user} />;
}

