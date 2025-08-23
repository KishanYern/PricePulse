import React, {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "./apiConfig";

// types
import type { User } from "./types/User";
import type { Notification } from "./types/Notification";

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;

    // Admin or normal user
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    isLoading: boolean;
    notifications: Notification[];
    fetchNotifications: () => void;
    markAsRead: (notificationId: number) => void;
    markAsUnread: (notificationId: number) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
    undefined
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // To indicate auth check is in progress
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const response = await axios.get(
                `${API_URL}/notifications/`,
                {
                    withCredentials: true,
                }
            );
            setNotifications(response.data);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Check for a valid authentication cookie
                const response = await axios.get(
                    `${API_URL}/users/me`,
                    {
                        withCredentials: true,
                    }
                );
                if (response.status === 200) {
                    setIsAuthenticated(true);
                    setUser(response.data); // Store user details in state
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, [navigate]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated, fetchNotifications]);

    const login = async (email: string, password: string): Promise<User> => {
        try {
            // 1. Send login credentials to the backend
            const response = await axios.post(
                `${API_URL}/users/login`,
                {
                    email,
                    password,
                },
                {
                    withCredentials: true,
                }
            );

            const userData = response.data.user
            setIsAuthenticated(true);
            setUser(userData);

            return userData;
        } catch (error) {
            console.error("Login failed:", error);
            setIsAuthenticated(false);
            setUser(null);
            throw error; // Re-throw the error so the component can handle it
        }
    };

    const logout = async () => {
        try {
            await axios.post(
                `${API_URL}/users/logout`,
                {},
                { withCredentials: true }
            );
            setIsAuthenticated(false);
            setUser(null);
            navigate("/login"); // Redirect to login after logout
        } catch (error) {
            console.error("Logout failed:", error);
            setIsAuthenticated(false);
            setUser(null);
            navigate("/login"); // Redirect to login if logout fails
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await axios.patch(
                `${API_URL}/notifications/${notificationId}/update_read`,
                { new_is_read: true },
                { withCredentials: true }
            );
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAsUnread = async (notificationId: number) => {
        try {
            await axios.patch(
                `${API_URL}/notifications/${notificationId}/update_read`,
                { new_is_read: false },
                { withCredentials: true }
            );
            fetchNotifications();
        } catch (error) {
            console.error("Failed to mark notification as unread:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                user,
                isAdmin: user?.admin || false,
                login,
                logout,
                isLoading,
                notifications,
                fetchNotifications,
                markAsRead,
                markAsUnread,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};