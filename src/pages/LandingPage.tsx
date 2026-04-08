import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, ShieldCheck, TrendingUp, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    cnpj: ''
  });
  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [showLgpdBanner, setShowLgpdBanner] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem('vgs_lgpd_accepted');
    if (accepted) {
      setLgpdAccepted(true);
      setShowLgpdBanner(false);
    }
  }, []);

  const handleLgpdAccept = () => {
    localStorage.setItem('vgs_lgpd_accepted', 'true');
    setLgpdAccepted(true);
    setShowLgpdBanner(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdAccepted) {
      toast.error('Você precisa aceitar os termos de privacidade para continuar.');
      return;
    }

    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        source: 'Site Orgânico',
        status: 'Novos Leads',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Solicitação enviada com sucesso! Entraremos em contato em breve.');
      setFormData({ name: '', email: '', phone: '', companyName: '', cnpj: '' });
    } catch (error) {
      console.error('Error adding document: ', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-blue-900">VGS Licitações</span>
          </div>
          <Link
            to="/login"
            className="text-sm font-medium text-blue-900 hover:text-orange-600 transition-colors"
          >
            Área Restrita
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-4 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/50 text-blue-200 text-sm font-medium border border-blue-700">
              <ShieldCheck className="w-4 h-4" /> Conformidade Legal
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/50 text-blue-200 text-sm font-medium border border-blue-700">
              <TrendingUp className="w-4 h-4" /> Contratos de até 10 anos
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Aumente as receitas da sua empresa<br />vendendo para o Governo
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 max-w-3xl mx-auto mb-10">
            Sem precisar criar um departamento interno. Operamos todo o processo licitatório — do SICAF ao pagamento — para que você foque na sua operação.
          </p>
          <a
            href="#formulario"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Falar com um Especialista
          </a>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Operação Completa</h3>
              <p className="text-gray-600">
                Do cadastro no SICAF à montagem de documentos, análise de editais e acompanhamento até o pagamento.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Receita Previsível</h3>
              <p className="text-gray-600">
                Contratos públicos de 2 a 10 anos via Sistema de Registro de Preços. Estabilidade para sua operação.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Zero Burocracia</h3>
              <p className="text-gray-600">
                Nós cuidamos de impugnações, recursos administrativos e defesas. Você só entrega o serviço.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="formulario" className="py-20 bg-gray-50 flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 sm:p-12">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
                Solicite uma Análise de Viabilidade Gratuita
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail Corporativo</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                    <input
                      type="text"
                      required
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!lgpdAccepted}
                  className="w-full py-4 px-8 text-lg font-bold rounded-lg text-white bg-blue-900 hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Quero Vender para o Governo
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* LGPD Banner */}
      {showLgpdBanner && (
        <div className="fixed bottom-0 inset-x-0 pb-2 sm:pb-5 z-50">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="p-2 rounded-lg bg-gray-900 shadow-lg sm:p-3">
              <div className="flex items-center justify-between flex-wrap">
                <div className="w-0 flex-1 flex items-center">
                  <p className="ml-3 font-medium text-white truncate">
                    <span className="md:hidden">Usamos cookies essenciais.</span>
                    <span className="hidden md:inline">Utilizamos cookies essenciais e analíticos para melhorar sua experiência. Ao continuar, você concorda com nossa Política de Privacidade.</span>
                  </p>
                </div>
                <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
                  <button
                    onClick={handleLgpdAccept}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Aceitar e Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
