import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/spinner/spinner';

export const ProtectedRoute: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { status } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Spinner size="large" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export const AdminRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { user } = useAuth();

    return (
        <ProtectedRoute>
            {user?.role === 'ADMIN' ? children : <Navigate to="/" replace />}
        </ProtectedRoute>
    );
};
