import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => {
        const saved = localStorage.getItem('token');
        if (!saved || saved === 'null' || saved === 'undefined' || saved === '') return null;
        return saved;
    });

    const login = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userToken) localStorage.setItem('token', userToken);
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout request failed:', error);
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    useEffect(() => {
        if (token) {
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.id) {
                        setUser(data);
                        localStorage.setItem('user', JSON.stringify(data));
                    }
                })
                .catch(console.error);
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
