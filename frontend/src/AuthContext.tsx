import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface User {
    id: number;
    email: string;
    admin: boolean;
    // Add other user properties if needed
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true); // To indicate auth check is in progress
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                // Try to fetch current user data using the cookie
                const response = await axios.get(
                    "http://localhost:8000/users/me",
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
                navigate("/login"); // Redirect to login if auth check fails
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []); // Run once on component mount

    const login = async (email: string, password: string): Promise<User> => {
        try {
            // 1. Send login credentials to the backend
            await axios.post(
                "http://localhost:8000/users/login",
                {
                    email,
                    password,
                },
                {
                    withCredentials: true,
                }
            );

            // 2. After a successful login, fetch the user's details
            const userResponse = await axios.get(
                "http://localhost:8000/users/me",
                { withCredentials: true }
            );

            const userData = userResponse.data;

            // 3. Update the state with the correct user data
            setIsAuthenticated(true);
            setUser(userData);
            
            // 4. Return the user data object
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
                "http://localhost:8000/users/logout",
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

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, user, login, logout, isLoading }}
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
