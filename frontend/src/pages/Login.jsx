import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [userStatus, setUserStatus] = useState({ exists: false, hasPassword: false });
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Phone, 2: Auth (Password or OTP)
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleCheckUser = async (e) => {
        e.preventDefault();
        if (!phone) return setError('Phone is required');
        try {
            const res = await fetch('/api/auth/check-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setUserStatus(data);
            if (data.name) setName(data.name);

            if (data.exists && data.hasPassword) {
                // Known user with password -> Just ask for password
                setStep(2);
            } else {
                // New user or legacy user -> Need OTP to set password
                const otpRes = await fetch('/api/auth/request-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, name: data.name || name })
                });
                const otpData = await otpRes.json();
                if (!otpRes.ok) throw new Error(otpData.error);

                setOtp(otpData.mockOtp); // Auto-fill for MVP
                setStep(2);
            }
            error && setError('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            login(data.user, data.token);
            navigate(data.user.role === 'ADMIN' ? '/admin' : (data.user.societyId ? '/' : '/society'));
        } catch (err) {
            setError(err.message);
        }
    };

    const handleVerifyOtpFlow = async (e) => {
        e.preventDefault();
        if (!userStatus.exists || !userStatus.hasPassword) {
            if (!name) return setError('Name is required');
            if (!password) return setError('Password is required');
        }
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ phone, otp, name, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.details || data.error || 'Verification failed');

            login(data.user, data.token);
            navigate(data.user.role === 'ADMIN' ? '/admin' : (data.user.societyId ? '/' : '/society'));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="content-area animate-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--primary)', fontSize: '2rem' }}>BookCircle</h1>
                <p>Your hyperlocal book exchange platform.</p>
            </div>

            <div className="card">
                <h2>{step === 1 ? 'Login / Signup' : (userStatus.hasPassword ? 'Welcome Back' : 'Complete Setup')}</h2>
                {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}

                {step === 1 ? (
                    <form onSubmit={handleCheckUser}>
                        <div className="input-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                name="username"
                                autoComplete="username"
                                placeholder="Enter your 10-digit number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary">Continue</button>
                    </form>
                ) : (
                    userStatus.hasPassword ? (
                        <form onSubmit={handlePasswordLogin}>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Login</button>
                            <button type="button" className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => setStep(1)}>Back</button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtpFlow}>
                            {(!userStatus.exists || !userStatus.name) && (
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="E.g., John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className="input-group">
                                <label>Set Password</label>
                                <input
                                    type="password"
                                    name="new-password"
                                    autoComplete="new-password"
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Verify OTP</label>
                                <input
                                    type="text"
                                    placeholder="123456"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                                    OTP sent to {phone}. (Demo: 123456)
                                </small>
                            </div>
                            <button type="submit" className="btn btn-primary">Verify & Signup</button>
                            <button type="button" className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={() => setStep(1)}>Back</button>
                        </form>
                    )
                )}
            </div>
        </div>
    );
}
