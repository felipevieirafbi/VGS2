import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Olá! Sou o assistente da VGS Licitações. Como posso ajudar sua empresa a vender para o governo hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interactionCount, setInteractionCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    
    const newInteractionCount = interactionCount + 1;
    setInteractionCount(newInteractionCount);

    try {
      // Check if user provided contact info (simple regex for email or CNPJ)
      const emailMatch = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/);
      const cnpjMatch = userMessage.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);

      if (emailMatch || cnpjMatch) {
        await addDoc(collection(db, 'leads'), {
          companyName: 'Lead via Chatbot',
          cnpj: cnpjMatch ? cnpjMatch[0] : '',
          email: emailMatch ? emailMatch[0] : '',
          phone: '',
          name: '',
          source: 'Chatbot IA',
          status: 'Novos Leads',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setMessages(prev => [...prev, { role: 'model', content: 'Excelente! Recebi seus dados. Um de nossos especialistas entrará em contato em breve para agendar uma reunião.' }]);
        setIsLoading(false);
        return;
      }

      const systemInstruction = `Você é um SDR (Sales Development Representative) da VGS Licitações, empresa especializada em terceirização completa de departamentos de licitação. A VGS opera todo o processo licitatório para empresas que querem vender para o governo — desde o cadastro no SICAF, análise de editais, cadastro de propostas, robô de lances, defesas administrativas, até o acompanhamento do pagamento. O modelo é: mensalidade fixa + comissão sobre contratos homologados. Os contratos públicos podem durar de 2 a 10 anos, gerando receita previsível. Seu objetivo é qualificar o lead. Faça perguntas naturais sobre: qual o ramo de atuação da empresa, há quanto tempo está no mercado, se já tentou vender para o governo, e qual o faturamento médio mensal. Após entender o perfil, solicite Nome, E-mail, Telefone, Nome da Empresa e CNPJ para agendar uma reunião com um especialista. Seja cordial, profissional e conciso (máximo 3 frases por resposta). Não mencione valores de mensalidade. ${newInteractionCount >= 2 ? 'O lead já interagiu algumas vezes. Peça agora os dados de contato (E-mail ou CNPJ) para agendarmos uma reunião.' : ''}`;

      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: 'Entendido.' }] },
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
      });

      setMessages(prev => [...prev, { role: 'model', content: response.text || 'Desculpe, não consegui processar sua mensagem.' }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      toast.error('Erro ao enviar mensagem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 transition-transform hover:scale-105 z-40 ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-blue-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Especialista VGS</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
