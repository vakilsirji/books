import { createContext, useEffect, useState } from 'react';

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
            const controller = new AbortController();
            let active = true;

            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
                signal: controller.signal
            })
                .then(res => res.json())
                .then(data => {
                    if (active && data.id) {
                        setUser(data);
                        localStorage.setItem('user', JSON.stringify(data));
                    }
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error(error);
                    }
                });

            return () => {
                active = false;
                controller.abort();
            };
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
