import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, setAuth, checkAuth } from '../utils/auth';

const AuthContext = createContext();

// Default credentials
const DEFAULT_USERNAME = '4inDegree';
const DEFAULT_PASSWORD = '9778574627';

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            // Check session first
            const sessionAuth = sessionStorage.getItem('authenticated');
            if (sessionAuth === 'true') {
                setIsAuthenticated(true);
            }

            // Initialize Firebase credentials if not exists
            try {
                const credentials = await getAuth();
                if (!credentials || !credentials.username) {
                    await setAuth(DEFAULT_USERNAME, DEFAULT_PASSWORD);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            const credentials = await getAuth();
            
            // Check credentials against Firebase
            if (credentials && credentials.username === username && credentials.password === password) {
                sessionStorage.setItem('authenticated', 'true');
                setIsAuthenticated(true);
                return { success: true };
            }

            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
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
