import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LeadModal } from '../components/LeadModal';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';

export const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('actionDate', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const tasksData = await Promise.all(snapshot.docs.map(async (taskDoc) => {
        const task = { id: taskDoc.id, ...taskDoc.data() } as any;
        // Fetch lead info
        if (task.leadId) {
          const leadDoc = await getDoc(doc(db, 'leads', task.leadId));
          if (leadDoc.exists()) {
            task.lead = { id: leadDoc.id, ...leadDoc.data() };
          }
        }
        return task;
      }));
      setTasks(tasksData);
    });
    return () => unsubscribe();
  }, []);

  const handleTaskClick = (task: any) => {
    if (task.lead) {
      setSelectedLead(task.lead);
    }
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    if (task.completed) return acc; // Hide completed tasks from calendar view
    
    const date = new Date(task.actionDate);
    if (isPast(date) && !isToday(date)) {
      acc.atrasadas.push(task);
    } else if (isToday(date)) {
      acc.hoje.push(task);
    } else if (isTomorrow(date)) {
      acc.amanha.push(task);
    } else if (isFuture(date)) {
      acc.futuras.push(task);
    }
    return acc;
  }, { atrasadas: [], hoje: [], amanha: [], futuras: [] } as Record<string, any[]>);

  const TaskGroup = ({ title, tasks, bgColor, iconColor }: { title: string, tasks: any[], bgColor: string, iconColor: string }) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CalendarIcon className={`w-5 h-5 ${iconColor}`} />
        {title} <span className="text-sm font-normal text-gray-500">({tasks.length})</span>
      </h3>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map(task => (
          <div 
            key={task.id} 
            onClick={() => handleTaskClick(task)}
            className={`${bgColor} border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900 line-clamp-1">{task.title}</h4>
              <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </div>
            {task.lead && (
              <p className="text-sm text-gray-600 mb-3 font-medium">{task.lead.companyName}</p>
            )}
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(task.actionDate), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="col-span-full p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-500 text-sm">
            Nenhuma tarefa para este período.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Calendário de Ações</h1>
        <p className="text-sm text-gray-500">Acompanhe suas tarefas e follow-ups agendados.</p>
      </div>

      <TaskGroup title="Atrasadas" tasks={groupedTasks.atrasadas} bgColor="bg-red-50" iconColor="text-red-500" />
      <TaskGroup title="Hoje" tasks={groupedTasks.hoje} bgColor="bg-blue-50" iconColor="text-blue-500" />
      <TaskGroup title="Amanhã" tasks={groupedTasks.amanha} bgColor="bg-white" iconColor="text-gray-500" />
      <TaskGroup title="Futuras" tasks={groupedTasks.futuras} bgColor="bg-white" iconColor="text-gray-500" />

      {selectedLead && (
        <LeadModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
};
