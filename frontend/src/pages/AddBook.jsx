import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

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

export default function AddBook() {
    const [formData, setFormData] = useState({
        title: '', author: '', category: 'Fiction', condition: 'GOOD', imageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(
                `/api/books?title=${encodeURIComponent(formData.title)}&author=${encodeURIComponent(formData.author)}&category=${encodeURIComponent(formData.category)}&condition=${encodeURIComponent(formData.condition)}&imageUrl=${encodeURIComponent(formData.imageUrl)}`,
                {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: formBody(formData)
            });
            if (!res.ok) throw new Error((await res.json()).error);

            alert('Book listed successfully!');
            navigate('/');
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in" style={{ padding: '1rem', paddingBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>List a Book</h2>
            <form onSubmit={handleSubmit} className="card">
                <div className="input-group">
                    <label>Book Title</label>
                    <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="input-group">
                    <label>Author</label>
                    <input required type="text" value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} />
                </div>
                <div className="input-group">
                    <label>Category</label>
                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                        <option>Fiction</option>
                        <option>Non-Fiction</option>
                        <option>Academic</option>
                        <option>Kids</option>
                        <option>Competitive Exams</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>Condition</label>
                    <select value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                        <option value="NEW">New</option>
                        <option value="GOOD">Good</option>
                        <option value="OLD">Old</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>Image URL (Optional)</label>
                    <input type="url" placeholder="https://..." value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Listing...' : 'List Book'}</button>
            </form>
        </div>
    );
}
