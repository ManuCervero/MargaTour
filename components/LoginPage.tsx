import React, { useState } from 'react';
import { api, setToken, setStoredUser } from '../lib/api';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
      const result = await api.auth.login(email.trim(), password);
      setToken(result.token);
      setStoredUser(result.user);
      onLogin();
    } catch {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
    };

    return (
        <div className="min-h-screen bg-marga-wine flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background pin pattern */}
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4C17.4 4 12 9.4 12 16c0 8.4 12 28 12 28s12-19.6 12-28c0-6.6-5.4-12-12-12zm0 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z' fill='%23EDEDDD'/%3E%3C/svg%3E")`,
                    backgroundSize: '48px 48px'
                }}
            />

            <div className="relative w-full max-w-sm">
                {/* Card */}
                <div className="bg-marga-cream rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-marga-wine px-8 py-10 text-center">
                        <div className="w-16 h-16 bg-marga-cream rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4A1C2D"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-marga-cream tracking-tight font-display uppercase leading-none">Marga Tour</h1>
                        <p className="text-marga-cream/60 text-xs mt-2 font-medium tracking-widest uppercase">Sistema de Gestión</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <h2 className="text-xl font-bold text-marga-wine mb-1">Bienvenido/a</h2>
                        <p className="text-sm text-marga-dark/50 mb-6">Ingresá con tu cuenta para continuar</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-marga-dark mb-1.5">
                                    Usuario
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin"
                                    className="w-full px-4 py-3 border border-marga-creamDark rounded-xl focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent text-sm transition-all bg-white/70 focus:bg-white text-marga-dark placeholder-marga-dark/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-marga-dark mb-1.5">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••••"
                                        className="w-full px-4 py-3 border border-marga-creamDark rounded-xl focus:outline-none focus:ring-2 focus:ring-marga-wine focus:border-transparent text-sm transition-all bg-white/70 focus:bg-white pr-12 text-marga-dark placeholder-marga-dark/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-marga-dark/40 hover:text-marga-wine transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                                    <AlertCircle size={16} className="shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email || !password}
                                className="w-full bg-marga-wine hover:bg-marga-wineLight text-marga-cream font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-marga-cream/30 border-t-marga-cream rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <LogIn size={16} />
                                        Ingresar al Sistema
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="text-center text-marga-cream/40 text-xs mt-6">
                    v1.0.4 · Marga Tour CRM · Acceso restringido
                </p>
            </div>
        </div>
    );
};
