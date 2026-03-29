import { createElement } from 'react';
import { ArrowRight, BookHeart, Building2, MessageCircleMore, ShieldCheck, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const featureCards = [
    {
        icon: BookHeart,
        title: 'Share books locally',
        copy: 'List your books, discover nearby readers, and exchange inside your own society.'
    },
    {
        icon: Building2,
        title: 'Built for societies',
        copy: 'Members can join the correct society, add room details, and connect with nearby book owners.'
    },
    {
        icon: MessageCircleMore,
        title: 'Quick contact',
        copy: 'Use WhatsApp or direct calling to coordinate requests and pickups in one tap.'
    },
    {
        icon: ShieldCheck,
        title: 'Admin managed',
        copy: 'Society admins and platform admins can keep approvals, users, and communities organized.'
    }
];

const steps = [
    'Join your society or create one if it is not listed yet.',
    'Add books you want to share with your community.',
    'Request available books and track them from the Requests tab.'
];

export default function LandingPage() {
    return (
        <div className="landing-page animate-in">
            <section className="landing-hero">
                <div className="landing-copy">
                    <span className="landing-kicker">BookCircle for Communities</span>
                    <h1>Exchange books inside your society, not across the whole internet.</h1>
                    <p>
                        BookCircle helps apartment communities and gated societies create a trusted hyperlocal
                        book-sharing network where neighbors can list books, request titles, and stay connected.
                    </p>
                    <div className="landing-actions">
                        <Link to="/login" className="btn btn-primary landing-cta">
                            Start Using BookCircle
                            <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn btn-secondary landing-cta">
                            Society Admin Login
                        </Link>
                    </div>
                    <div className="landing-mini-points">
                        <span>Society based access</span>
                        <span>WhatsApp contact</span>
                        <span>Installable mobile app</span>
                    </div>
                </div>

                <div className="landing-showcase">
                    <div className="landing-phone-card">
                        <span className="landing-phone-badge">
                            <Smartphone size={14} />
                            PWA Ready
                        </span>
                        <strong>Hyperlocal reading, simplified</strong>
                        <p>Browse, request, approve, and coordinate book pickup directly from your phone.</p>
                        <div className="landing-stat-grid">
                            <div>
                                <span>For readers</span>
                                <strong>Easy requests</strong>
                            </div>
                            <div>
                                <span>For owners</span>
                                <strong>Quick approvals</strong>
                            </div>
                            <div>
                                <span>For admins</span>
                                <strong>Simple control</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-section">
                <div className="landing-section-head">
                    <span>Why BookCircle</span>
                    <h2>Built for real community sharing</h2>
                    <p>Everything is designed around apartment societies, neighborhood trust, and quick communication.</p>
                </div>
                <div className="landing-feature-grid">
                    {featureCards.map(({ icon, title, copy }) => (
                        <article key={title} className="landing-feature-card">
                            <div className="landing-feature-icon">
                                {createElement(icon, { size: 20 })}
                            </div>
                            <h3>{title}</h3>
                            <p>{copy}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-section">
                <div className="landing-section-head">
                    <span>How It Works</span>
                    <h2>Start in minutes</h2>
                </div>
                <div className="landing-steps">
                    {steps.map((step, index) => (
                        <article key={step} className="landing-step-card">
                            <span className="landing-step-number">0{index + 1}</span>
                            <p>{step}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-footer-card">
                <div>
                    <span className="landing-kicker">Ready to launch in your community?</span>
                    <h2>Open BookCircle and start sharing books today.</h2>
                </div>
                <Link to="/login" className="btn btn-primary landing-cta landing-footer-btn">
                    Continue to Login
                </Link>
            </section>
        </div>
    );
}
