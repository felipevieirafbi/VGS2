import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Mail, Calendar, Search, CheckCircle2, Circle } from 'lucide-react';
import { doc, updateDoc, collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { handleFirestoreError, OperationType } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface LeadModalProps {
  lead: any;
  onClose: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({ lead, onClose }) => {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isGeneratingOsint, setIsGeneratingOsint] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  useEffect(() => {
    if (!lead?.id) return;
    const q = query(collection(db, 'tasks'), where('leadId', '==', lead.id), orderBy('actionDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [lead?.id]);

  const handleWhatsApp = () => {
    const text = `Olá, sou consultor da VGS Licitações. Analisamos o perfil da ${lead.companyName} e identificamos um excelente potencial para fornecer ao governo. Gostaríamos de agendar uma breve reunião para apresentar como podemos operar todo o processo licitatório para vocês — do SICAF ao pagamento — sem que precisem montar um departamento interno.`;
    window.open(`https://wa.me/${lead.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    logAction('Enviou WhatsApp');
  };

  const handleEmail = () => {
    const subject = `Oportunidade de Receita Governamental para ${lead.companyName}`;
    const body = `Olá,\n\nAnalisamos o perfil da ${lead.companyName} e identificamos um excelente potencial para fornecer ao governo.\n\nGostaríamos de agendar uma breve reunião para apresentar como podemos operar todo o processo licitatório para vocês — do SICAF ao pagamento — sem que precisem montar um departamento interno.\n\nAtenciosamente,\nEquipe VGS Licitações`;
    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    logAction('Enviou E-mail');
  };

  const logAction = async (action: string) => {
    await addDoc(collection(db, 'audit_logs'), {
      userId: profile?.uid || 'unknown',
      action: `${action} para o lead ${lead.companyName}`,
      entityId: lead.id,
      timestamp: new Date().toISOString()
    });
  };

  const generateOsint = async () => {
    setIsGeneratingOsint(true);
    try {
      const prompt = `Você é um analista de inteligência comercial da VGS Licitações, empresa que terceiriza departamentos de licitação para empresas que querem vender para o governo brasileiro. Analise a empresa ${lead.companyName} (CNPJ: ${lead.cnpj}). Produza um relatório executivo em Markdown:

## 1. Perfil da Empresa
Porte estimado, setor de atuação, principais produtos/serviços, tempo de mercado provável.

## 2. Potencial em Licitações
Avalie se os produtos/serviços desta empresa têm demanda em compras públicas. Identifique quais órgãos governamentais (municipais, estaduais, federais) tipicamente compram neste segmento. Estime se a empresa já participou de licitações ou se é um player inexplorado.

## 3. Oportunidade de Registro de Preços
Analise se o segmento permite contratos via Sistema de Registro de Preços (SRP), que possibilitam contratos de 2 a 10 anos com fornecimento recorrente.

## 4. Possíveis Decisores
Com base no porte e setor, sugira os cargos dos prováveis tomadores de decisão (proprietário, diretor comercial, gerente de vendas).

## 5. Dores Prováveis
Liste as barreiras que provavelmente impedem esta empresa de licitar: falta de equipe especializada, complexidade do SICAF, medo de desclassificação por erro documental, desconhecimento da Lei 14.133/2021.

## 6. Script de Abordagem Personalizado
Escreva um texto persuasivo para o primeiro contato (WhatsApp ou ligação), posicionando a VGS como parceira que opera TODO o processo licitatório. Foque nos benefícios: receita previsível, contratos longos, zero burocracia. Mencione que a VGS cuida do SICAF, análise de editais, propostas, robô de lances, defesas administrativas e acompanhamento até o pagamento.`;

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
        throw new Error('A chave da API do Gemini não está configurada ou é inválida. Por favor, configure a variável GEMINI_API_KEY no painel de Secrets (ícone de cadeado).');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const osintData = response.text;
      
      await updateDoc(doc(db, 'leads', lead.id), {
        osintData,
        updatedAt: new Date().toISOString()
      });

      await logAction('Gerou Relatório OSINT');
      toast.success('Relatório OSINT gerado com sucesso!');
    } catch (error: any) {
      console.error('OSINT error:', error);
      
      let errorMessage = 'Erro desconhecido.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Formata a mensagem para ser mais amigável se for erro do Firestore
      if (errorMessage.includes('Missing or insufficient permissions')) {
        errorMessage = 'Permissão negada no banco de dados. Verifique as regras do Firestore (tamanho do texto ou campos obrigatórios).';
      }
      
      toast.error(`Erro ao gerar relatório: ${errorMessage}`, { duration: 8000 });
    } finally {
      setIsGeneratingOsint(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDate) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        leadId: lead.id,
        title: newTaskTitle,
        actionDate: new Date(newTaskDate).toISOString(),
        completed: false
      });
      setNewTaskTitle('');
      setNewTaskDate('');
      toast.success('Tarefa adicionada!');
      await logAction('Adicionou nova tarefa');
    } catch (error) {
      toast.error('Erro ao adicionar tarefa.');
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), {
        completed: !currentStatus
      });
    } catch (error) {
      toast.error('Erro ao atualizar tarefa.');
    }
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{lead.companyName}</h2>
            <p className="text-sm text-gray-500">CNPJ: {lead.cnpj} • Origem: {lead.source}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column (2/3) */}
          <div className="w-full md:w-2/3 border-r border-gray-200 flex flex-col overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Contact Actions */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleWhatsApp}
                  disabled={!lead.phone}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={handleEmail}
                  disabled={!lead.email}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  E-mail
                </button>
              </div>

              {/* OSINT Section */}
              <div className="bg-slate-900 rounded-xl p-6 text-slate-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-orange-500" />
                    Inteligência OSINT
                  </h3>
                  {!lead.osintData && (
                    <button
                      onClick={generateOsint}
                      disabled={isGeneratingOsint}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      {isGeneratingOsint ? 'Analisando...' : 'Pesquisa Completa da Empresa'}
                    </button>
                  )}
                </div>
                
                {lead.osintData ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Markdown>{lead.osintData}</Markdown>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    Nenhum relatório gerado ainda. Clique no botão acima para a IA analisar o CNPJ e gerar insights comerciais.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="w-full md:w-1/3 bg-gray-50 flex flex-col overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Próximas Ações
              </h3>

              {/* Add Task Form */}
              <form onSubmit={addTask} className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Nova tarefa..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 text-sm font-medium"
                  >
                    Agendar
                  </button>
                </div>
              </form>

              {/* Tasks List */}
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`p-3 rounded-lg border ${task.completed ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 shadow-sm'} flex gap-3 items-start`}>
                    <button onClick={() => toggleTask(task.id, task.completed)} className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(task.actionDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma tarefa agendada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
