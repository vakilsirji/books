import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { ArrowRight, BookOpen, MessageCircle, Search, Sparkles, Users } from 'lucide-react';

export default function Dashboard() {
    const [books, setBooks] = useState([]);
    const [search, setSearch] = useState('');
    const [loadingMsg, setLoadingMsg] = useState('');
    const { user, token } = useAuth();

    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const path = '/api/books' + (search ? `?search=${encodeURIComponent(search)}` : '');
                const headers = {};
                if (token) headers.Authorization = `Bearer ${token}`;

                const res = await fetch(path, { headers, credentials: 'include' });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Server connection failed' }));
                    throw new Error(errorData.error || 'Failed to fetch books');
                }

                setBooks(await res.json());
            } catch (error) {
                console.error('Fetch Books Error:', error);
            }
        };

        fetchBooks();
    }, [search, token]);

    const handleRequest = async (bookId) => {
        setLoadingMsg('Sending request...');
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({ bookId }),
            });

            const data = await res.json();
            if (res.ok) {
                alert('Request sent to owner!');
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setLoadingMsg('');
        }
    };

    const getWhatsAppLink = (book) => {
        const phone = (book.owner?.phone || '').replace(/\D/g, '');
        if (!phone) return null;

        const ownerLocation = [book.owner?.wing, book.owner?.roomNumber].filter(Boolean).join(', ');
        const requesterLocation = [user?.wing, user?.roomNumber].filter(Boolean).join(', ');
        const message = [
            `Hi ${book.owner?.name || 'there'}, I want the book "${book.title}" by ${book.author}.`,
            user?.name ? `My name is ${user.name}.` : '',
            requesterLocation ? `I stay in ${requesterLocation}.` : '',
            ownerLocation ? `I saw that you are in ${ownerLocation}.` : '',
            `Can we coordinate for this book in ${user?.society?.name || 'our society'}?`
        ].filter(Boolean).join(' ');

        return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    };

    const ownBooks = useMemo(
        () => books.filter((book) => book.ownerId === user?.id).length,
        [books, user]
    );
    const availableBooks = books.length;
    const communityOwners = useMemo(
        () => new Set(books.map((book) => book.owner?.id).filter(Boolean)).size,
        [books]
    );

    return (
        <div className="dashboard-shell animate-in">
            <section className="dashboard-hero">
                <div>
                    <span className="dashboard-kicker">
                        <Sparkles size={14} />
                        BookCircle Workspace
                    </span>
                    <h1>Welcome back, {user?.name || 'Reader'}</h1>
                    <p>
                        Discover books in {user?.society?.name || 'your society'}, track what is available, and request your next read in seconds.
                    </p>
                </div>
                <div className="dashboard-hero-card">
                    <span>Community</span>
                    <strong>{user?.society?.name || 'Not assigned yet'}</strong>
                    <small>{availableBooks} titles live in the exchange right now</small>
                </div>
            </section>

            <section className="dashboard-stats">
                <article className="dashboard-stat-card">
                    <div className="dashboard-stat-icon"><BookOpen size={18} /></div>
                    <span>Available now</span>
                    <strong>{availableBooks}</strong>
                </article>
                <article className="dashboard-stat-card">
                    <div className="dashboard-stat-icon alt"><Users size={18} /></div>
                    <span>Active owners</span>
                    <strong>{communityOwners}</strong>
                </article>
                <article className="dashboard-stat-card">
                    <div className="dashboard-stat-icon warm"><ArrowRight size={18} /></div>
                    <span>Your listings</span>
                    <strong>{ownBooks}</strong>
                </article>
            </section>

            <section className="dashboard-toolbar">
                <div className="dashboard-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by title or author"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
                <div className="dashboard-toolbar-copy">
                    <strong>Browse library</strong>
                    <span>Filter instantly and request any available title.</span>
                </div>
            </section>

            {loadingMsg && <div className="dashboard-inline-note">{loadingMsg}</div>}

            <section className="dashboard-books-grid">
                {books.length === 0 ? (
                    <div className="empty-state">No books found right now. Be the first to share one.</div>
                ) : (
                    books.map((book) => (
                        <article key={book.id} className="book-dashboard-card">
                            <div className="book-dashboard-top">
                                {book.imageUrl ? (
                                    <img src={book.imageUrl} alt={book.title} className="book-dashboard-cover" />
                                ) : (
                                    <div className="book-dashboard-cover book-dashboard-cover-placeholder">
                                        <BookOpen size={24} />
                                    </div>
                                )}

                                <div className="book-dashboard-copy">
                                    <span className="badge">{book.category}</span>
                                    <h3>{book.title}</h3>
                                    <p>by {book.author}</p>
                                    <div className="book-dashboard-meta">
                                        <span>Owner</span>
                                        <strong>{book.owner?.name || 'Unknown'}</strong>
                                    </div>
                                    {(book.owner?.wing || book.owner?.roomNumber) && (
                                        <div className="book-dashboard-meta">
                                            <span>Location</span>
                                            <strong>{[book.owner?.wing, book.owner?.roomNumber].filter(Boolean).join(', ')}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {book.ownerId !== user?.id ? (
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleRequest(book.id)}
                                    >
                                        Request Book
                                    </button>
                                    {getWhatsAppLink(book) && (
                                        <a
                                            className="btn btn-secondary"
                                            href={getWhatsAppLink(book)}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <MessageCircle size={16} />
                                            WhatsApp Owner
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="book-dashboard-self">This is your listing</div>
                            )}
                        </article>
                    ))
                )}
            </section>
        </div>
    );
}
