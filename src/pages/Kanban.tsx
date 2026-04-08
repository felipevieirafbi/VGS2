import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { collection, query, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { LeadModal } from '../components/LeadModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, MessageCircle, Globe, Users, Clock } from 'lucide-react';

const COLUMNS = [
  "Novos Leads",
  "Análise OSINT",
  "Reunião Agendada",
  "Proposta Enviada",
  "Negociação",
  "Fechado",
  "Lixeira"
];

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'Site Orgânico': return <Globe className="w-4 h-4 text-blue-500" />;
    case 'Chatbot IA': return <MessageCircle className="w-4 h-4 text-orange-500" />;
    case 'Indicação': return <Users className="w-4 h-4 text-green-500" />;
    default: return <Building2 className="w-4 h-4 text-gray-500" />;
  }
};

export const Kanban: React.FC = () => {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'leads'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(leadsData);
    });
    return () => unsubscribe();
  }, []);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      
      try {
        await updateDoc(doc(db, 'leads', draggableId), {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          lastModifiedBy: profile?.uid
        });

        await addDoc(collection(db, 'audit_logs'), {
          userId: profile?.uid,
          action: `Moveu lead para ${newStatus}`,
          entityId: draggableId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error updating lead status:', error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
        <p className="text-sm text-gray-500">Arraste os cards para atualizar o status das negociações.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-max">
            {COLUMNS.map(columnId => {
              const columnLeads = leads.filter(l => l.status === columnId);
              
              return (
                <div key={columnId} className="w-80 flex flex-col bg-gray-100 rounded-xl">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">{columnId}</h3>
                    <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                      {columnLeads.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={columnId}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}`}
                      >
                        {columnLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedLead(lead)}
                                className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-2' : ''
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900 line-clamp-2">{lead.companyName}</h4>
                                  <div title={lead.source}>
                                    {getSourceIcon(lead.source)}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-3">CNPJ: {lead.cnpj}</p>
                                <div className="flex items-center text-xs text-gray-400 gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: ptBR })}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
};
