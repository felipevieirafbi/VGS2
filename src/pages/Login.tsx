import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, AlertTriangle } from 'lucide-react';
import { loginWithGoogle } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [isIframe, setIsIframe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setIsIframe(window.self !== window.top);
  }, []);

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/kanban';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async () => {
    if (isIframe) return;
    try {
      setError('');
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Building2 className="w-16 h-16 text-orange-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          VGS Licitações
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Área Restrita para Consultores e Administradores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isIframe ? (
            <div className="rounded-md bg-yellow-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Atenção</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Para fazer login com o Google, você precisa abrir o aplicativo em uma nova aba.</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={openInNewTab}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Abrir em Nova Aba
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {error && (
                <div className="mb-4 text-sm text-red-600 text-center">{error}</div>
              )}
              <button
                onClick={handleLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <img
                  className="h-5 w-5 mr-2"
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google logo"
                />
                Entrar com Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
