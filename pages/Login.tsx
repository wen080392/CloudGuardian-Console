import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const Login = ({ onLogin, onBack }: { onLogin?: () => void, onBack?: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithGoogle, register, loading } = useAuth();

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
      if (onLogin) onLogin();
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação com o Google');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        // Registra e envia para o backend Neon
        await register(email, password, name, companyName);
      } else {
        // Login normal via Firebase
        await login(email, password);
      }
      
      // Notify parent to switch view
      if (onLogin) onLogin();
    } catch (err: any) {
      setError(err.message || 'Erro na autenticação');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-800">
        <h1 className="text-3xl font-bold text-center mb-6 text-white tracking-tight">
          CloudGuardian
        </h1>
        <h2 className="text-slate-400 text-center mb-8 text-sm uppercase tracking-widest font-bold">
          {isRegister ? 'Criar Conta' : 'Entrar no Console'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center text-xs font-bold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              required
              placeholder="admin@empresa.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
              required
              placeholder="••••••••"
            />
          </div>

          {isRegister && (
            <>
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Nome Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                  required
                  placeholder="Acme Inc."
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl font-bold transition-all text-white mt-6 uppercase text-[11px] tracking-widest shadow-lg shadow-primary-900/20"
          >
            {loading ? 'Processando...' : (isRegister ? 'Criar Conta' : 'Entrar')}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-4">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Ou</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-6 py-4 bg-white hover:bg-gray-100 text-slate-900 disabled:opacity-50 rounded-xl font-bold transition-all uppercase text-[11px] tracking-widest shadow-lg flex items-center justify-center gap-3"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com Google
        </button>

        <div className="mt-8 flex flex-col items-center gap-4 text-xs font-medium text-slate-500">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest text-[10px] font-bold"
          >
            {isRegister ? 'Já tenho uma conta' : 'Criar nova conta'}
          </button>
          
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold"
            >
              ← Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
