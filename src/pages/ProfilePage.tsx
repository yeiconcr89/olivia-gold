import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    if (!user) {
        return (
            <div className="min-h-screen pt-32 pb-12 container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Inicia sesión para ver tu perfil</h2>
                <button
                    onClick={() => navigate('/')}
                    className="bg-amber-500 text-white px-6 py-2 rounded-full font-medium hover:bg-amber-600 transition-colors"
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen pt-32 pb-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-2xl">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <User className="h-8 w-8 text-amber-500" />
                    Mi Perfil
                </h1>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-10 text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold text-amber-600 shadow-lg">
                            {(user.profile?.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {user.profile?.name || 'Usuario'}
                        </h2>
                        <p className="text-amber-100 mt-1">{user.email}</p>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Correo Electrónico</p>
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Rol de Usuario</p>
                                    <p className="font-medium text-gray-900">
                                        {user.role === 'ADMIN' ? 'Administrador' :
                                            user.role === 'MANAGER' ? 'Gerente' : 'Cliente'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-3 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="h-5 w-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
