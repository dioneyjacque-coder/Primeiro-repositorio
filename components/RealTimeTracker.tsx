
import React, { useState, useEffect } from 'react';
import { Boat, Stop, ArrivalLog, Direction, Route } from '../types';
import { MapPin, Clock, Save, Check, X, Trash2, CalendarDays, Calendar } from 'lucide-react';

interface RealTimeTrackerProps {
  boats: Boat[];
  stops: Stop[];
  setStops: React.Dispatch<React.SetStateAction<Stop[]>>;
  logs: ArrivalLog[];
  setLogs: React.Dispatch<React.SetStateAction<ArrivalLog[]>>;
  routes: Route[];
}

const RealTimeTracker: React.FC<RealTimeTrackerProps> = ({ boats, stops, setStops, logs, setLogs, routes }) => {
  const [boatId, setBoatId] = useState(boats[0]?.id || '');
  const [stopId, setStopId] = useState('');
  const [direction, setDirection] = useState<Direction>(Direction.UPSTREAM);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');
  const [currentDayLabel, setCurrentDayLabel] = useState('');

  useEffect(() => {
    const now = new Date();
    const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    setCurrentDayLabel(day.charAt(0).toUpperCase() + day.slice(1));
  }, []);

  // New Stop State
  const [isAddingNewStop, setIsAddingNewStop] = useState(false);
  const [newStopName, setNewStopName] = useState('');

  const handleStopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'NEW_STOP_OPTION') {
      setIsAddingNewStop(true);
      setStopId('');
    } else {
      setStopId(value);
      setIsAddingNewStop(false);
    }
  };

  const addNewStop = () => {
    if (!newStopName.trim()) return;

    const defaultRouteId = routes.find(r => r.id === 'solimoes')?.id || routes[0]?.id || 'unknown';
    
    const newStop: Stop = {
      id: crypto.randomUUID(),
      name: newStopName,
      distanceFromManausKm: 0, 
      routeIds: [defaultRouteId],
      mapX: 50, 
      mapY: 50
    };

    setStops([...stops, newStop]);
    setStopId(newStop.id);
    setNewStopName('');
    setIsAddingNewStop(false);
  };

  const handleSave = () => {
    if (!boatId || !stopId) {
      alert("Selecione uma lancha e uma localidade.");
      return;
    }

    const newLog: ArrivalLog = {
      id: crypto.randomUUID(),
      boatId,
      stopId,
      direction,
      timestamp: Date.now(),
      notes: `${time} - ${notes}`
    };

    setLogs([newLog, ...logs]);
    setNotes('');
    alert('Chegada registrada com sucesso!');
  };

  const removeLog = (id: string) => {
    if (window.confirm('Tem certeza que deseja apagar este registro?')) {
      setLogs(logs.filter(l => l.id !== id));
    }
  };

  const clearAllLogs = () => {
    if (window.confirm('ATENÇÃO: Tem certeza que deseja apagar TODO o histórico? Esta ação não pode ser desfeita.')) {
      setLogs([]);
    }
  };

  const getBoatName = (id: string) => boats.find(b => b.id === id)?.name || 'Desconhecida';
  const getStopName = (id: string) => stops.find(s => s.id === id)?.name || 'Desconhecido';

  const getWeekday = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatDateOnly = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:pl-64">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
          <MapPin className="mr-2 text-teal-600" /> Registrar Chegada
        </h2>
        <div className="mb-6 flex items-center text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 w-fit">
          <Calendar size={16} className="mr-2" />
          <span className="text-xs font-bold uppercase tracking-wider">Hoje é {currentDayLabel}</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Qual Lancha?</label>
            <select 
              value={boatId}
              onChange={e => setBoatId(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {boats.length === 0 && <option value="">Nenhuma lancha cadastrada</option>}
              {boats.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="relative">
             <label className="block text-sm font-medium text-slate-700 mb-1">Em qual localidade?</label>
             {isAddingNewStop ? (
                <div className="flex items-center space-x-2">
                  <input type="text" value={newStopName} onChange={(e) => setNewStopName(e.target.value)} placeholder="Nome..." className="w-full p-2.5 rounded-lg border border-teal-500 bg-white" autoFocus />
                  <button onClick={addNewStop} className="p-3 bg-teal-600 text-white rounded-lg"><Check size={18} /></button>
                  <button onClick={() => setIsAddingNewStop(false)} className="p-3 bg-slate-200 text-slate-600 rounded-lg"><X size={18} /></button>
                </div>
             ) : (
                <select value={stopId} onChange={handleStopChange} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
                    <option value="">Selecione...</option>
                    {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="NEW_STOP_OPTION" className="font-semibold text-teal-600">+ Cadastrar Nova Localidade</option>
                </select>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Sentido</label>
               <select value={direction} onChange={e => setDirection(e.target.value as Direction)} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white">
                  <option value={Direction.UPSTREAM}>{Direction.UPSTREAM}</option>
                  <option value={Direction.DOWNSTREAM}>{Direction.DOWNSTREAM}</option>
               </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
               <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
             <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white" placeholder="Ex: Rio muito seco..." rows={2} />
          </div>

          <button onClick={handleSave} disabled={isAddingNewStop} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-all flex justify-center items-center shadow-md active:scale-95">
            <Save size={18} className="mr-2" /> SALVAR REGISTRO
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Clock className="mr-2 text-teal-600" /> Histórico Recente
          </h2>
          {logs.length > 0 && (
            <button onClick={clearAllLogs} className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-100">
              Limpar Histórico
            </button>
          )}
        </div>

        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-slate-400 italic text-center py-10">Nenhum registro ainda.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="relative pl-6 pb-6 border-l-2 border-slate-100 last:pb-0">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-sm"></div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 group relative">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2">
                          <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-sm">
                            {getWeekday(log.timestamp)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{formatDateOnly(log.timestamp)}</span>
                       </div>
                       <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">{getBoatName(log.boatId)}</h3>
                    </div>
                    <button onClick={() => removeLog(log.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Chegou em:</p>
                      <p className="text-base font-bold text-teal-700">{getStopName(log.stopId)}</p>
                    </div>
                    <div className="text-right">
                       <div className={`text-[10px] font-bold px-2 py-1 rounded-full mb-1 inline-block ${log.direction === Direction.UPSTREAM ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {log.direction.toUpperCase()}
                       </div>
                    </div>
                  </div>

                  {log.notes && (
                    <div className="mt-3 text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-slate-200 italic shadow-sm">
                      {log.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTracker;
