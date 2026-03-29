import { NavLink } from 'react-router-dom';
import { BookOpen, PlusCircle, Bell, User, Shield } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Navigation() {
    const { user } = useAuth();
    const isPlatformAdmin = user?.role === 'ADMIN';
    const isAdmin = user?.role === 'SOCIETY_ADMIN' || user?.role === 'ADMIN';

    return (
        <nav className="bottom-nav">
            <NavLink to={isPlatformAdmin ? "/admin" : "/"} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                {isPlatformAdmin ? <Shield size={24} /> : <BookOpen size={24} />}
                <span>{isPlatformAdmin ? 'Platform' : 'Books'}</span>
            </NavLink>

            {!isPlatformAdmin && (
                <NavLink to="/add" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PlusCircle size={24} />
                    <span>Add</span>
                </NavLink>
            )}

            {!isPlatformAdmin && (
                <NavLink to="/requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Bell size={24} />
                    <span>Requests</span>
                </NavLink>
            )}

            {isAdmin && !isPlatformAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Shield size={24} />
                    <span>Admin</span>
                </NavLink>
            )}

            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <User size={24} />
                <span>Profile</span>
            </NavLink>
        </nav>
    );
}
