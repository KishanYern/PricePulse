import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className='loading loading-spinner'>
                Loading authentication...
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to='/login' replace />;
};

export default ProtectedRoute;
