import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
