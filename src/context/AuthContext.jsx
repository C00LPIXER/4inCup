import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, setAuth, checkAuth } from '../utils/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth().then(result => {
            setIsAuthenticated(result);
            setLoading(false);
        });
    }, []);

    const login = async (username, password) => {
        const credentials = await getAuth();
        
        // First time setup - no credentials exist
        if (!credentials || !credentials.username) {
            await setAuth(username, password);
            setIsAuthenticated(true);
            return { success: true, firstTime: true };
        }

        // Check credentials
        if (credentials.username === username && credentials.password === password) {
            sessionStorage.setItem('authenticated', 'true');
            setIsAuthenticated(true);
            return { success: true, firstTime: false };
        }

        return { success: false, message: 'Invalid credentials' };
    };

    const logout = () => {
        sessionStorage.removeItem('authenticated');
        setIsAuthenticated(false);
    };

    const changePassword = async (currentPassword, newPassword) => {
        const credentials = await getAuth();
        if (credentials.password === currentPassword) {
            await setAuth(credentials.username, newPassword);
            return { success: true };
        }
        return { success: false, message: 'Current password is incorrect' };
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, changePassword, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
