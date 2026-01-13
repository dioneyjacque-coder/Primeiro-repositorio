
import React, { useState } from 'react';
import { Boat, Stop, ArrivalLog, Direction, Route } from '../types';
import { MapPin, Clock, Save, Check, X, Trash2, CalendarDays } from 'lucide-react';

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

    // Use the first available route ID as a default, or 'solimoes' if available
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

  const formatLogDateWithDay = (timestamp: number) => {
    const date = new Date(timestamp);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const fullDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    // Capitalize first letter of weekday
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${fullDate}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:pl-64">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <MapPin className="mr-2 text-teal-600" /> Registrar Chegada (Tempo Real)
        </h2>

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
                  <input 
                    type="text" 
                    value={newStopName}
                    onChange={(e) => setNewStopName(e.target.value)}
                    placeholder="Nome da nova localidade..."
                    className="w-full p-2.5 rounded-lg border border-teal-500 ring-1 ring-teal-500 bg-white focus:outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={addNewStop} 
                    className="p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    title="Salvar Localidade"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    onClick={() => { setIsAddingNewStop(false); setStopId(stops[0]?.id || ''); }} 
                    className="p-3 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                    title="Cancelar"
                  >
                    <X size={18} />
                  </button>
                </div>
             ) : (
                <select 
                    value={stopId}
                    onChange={handleStopChange}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                    <option value="">Selecione...</option>
                    {stops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option disabled>──────────</option>
                    <option value="NEW_STOP_OPTION" className="font-semibold text-teal-600">+ Outros (Cadastrar Nova)</option>
                </select>
             )}
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Sentido</label>
             <select 
                value={direction}
                onChange={e => setDirection(e.target.value as Direction)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
             >
                <option value={Direction.UPSTREAM}>{Direction.UPSTREAM}</option>
                <option value={Direction.DOWNSTREAM}>{Direction.DOWNSTREAM}</option>
             </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Horário de Chegada</label>
             <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Opcional)</label>
             <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                placeholder="Ex: Atrasou devido à chuva forte..."
                rows={3}
             />
          </div>

          <button 
            onClick={handleSave}
            disabled={isAddingNewStop}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center disabled:opacity-50"
          >
            <Save size={18} className="mr-2" /> Registrar Chegada
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center">
            <Clock className="mr-2 text-teal-600" /> Histórico Recente
          </h2>
          {logs.length > 0 && (
            <button 
              onClick={clearAllLogs}
              className="text-xs text-red-500 hover:text-red-700 flex items-center border border-red-200 bg-red-50 px-3 py-1.5 rounded transition-colors"
            >
              <Trash2 size={14} className="mr-1" /> Limpar Tudo
            </button>
          )}
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-slate-400 italic">Nenhum registro encontrado.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="border-l-4 border-teal-500 bg-slate-50 p-4 rounded-r-lg group relative">
                <div className="flex justify-between items-start mb-2">
                  <div>
                     <h3 className="font-bold text-slate-800 text-base">{getBoatName(log.boatId)}</h3>
                     <div className="flex items-center text-teal-700 font-semibold text-[11px] mt-0.5">
                        <CalendarDays size={12} className="mr-1" />
                        {formatLogDateWithDay(log.timestamp)}
                     </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => removeLog(log.id)}
                      className="text-slate-400 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Apagar este registro"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-1">
                  Chegou em <span className="font-bold text-teal-800">{getStopName(log.stopId)}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                  {log.direction === Direction.UPSTREAM ? (
                    <span className="text-emerald-600">↑ Subindo para o Interior</span>
                  ) : (
                    <span className="text-blue-600">↓ Descendo para Manaus</span>
                  )}
                </p>
                {log.notes && (
                  <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200 border-dashed italic">
                    {log.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTracker;
