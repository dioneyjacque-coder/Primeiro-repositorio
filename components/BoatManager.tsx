
import React, { useState } from 'react';
import { Boat, Schedule, Direction, Stop, Route, ArrivalLog } from '../types';
import { Plus, Trash2, Save, Calendar, Search, Filter, MapPin, Check, X, Anchor, Pencil, RotateCcw, Copy, Activity, Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface BoatManagerProps {
  boats: Boat[];
  setBoats: React.Dispatch<React.SetStateAction<Boat[]>>;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  stops: Stop[];
  setStops: React.Dispatch<React.SetStateAction<Stop[]>>;
  routes: Route[];
  logs: ArrivalLog[];
}

const BoatManager: React.FC<BoatManagerProps> = ({ boats, setBoats, schedules, setSchedules, stops, setStops, routes, logs }) => {
  const [newBoatName, setNewBoatName] = useState('');
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(null);
  
  // Boat Editing State
  const [editingBoatId, setEditingBoatId] = useState<string | null>(null);

  // Schedule Form State
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UPSTREAM);
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id);
  const [selectedStop, setSelectedStop] = useState('');
  const [time, setTime] = useState('');
  const [selectedPort, setSelectedPort] = useState('Manaus Moderna (Balsa Amarela)');

  // New Stop Form State
  const [isAddingNewStop, setIsAddingNewStop] = useState(false);
  const [newStopName, setNewStopName] = useState('');
  
  // Filter state for the schedule list
  const [scheduleFilter, setScheduleFilter] = useState('');

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Filter stops based on selected route
  const availableStops = stops.filter(s => s.routeIds.includes(selectedRouteId));

  const handleSaveBoat = () => {
    if (!newBoatName.trim()) return;

    if (editingBoatId) {
      setBoats(boats.map(b => b.id === editingBoatId ? { ...b, name: newBoatName } : b));
      setEditingBoatId(null);
      setNewBoatName('');
    } else {
      const newBoat: Boat = {
        id: crypto.randomUUID(),
        name: newBoatName,
        contact: '',
        capacity: 0
      };
      setBoats([...boats, newBoat]);
      setNewBoatName('');
    }
  };

  const startEditingBoat = (boat: Boat, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewBoatName(boat.name);
    setEditingBoatId(boat.id);
  };

  const cancelEditingBoat = () => {
    setNewBoatName('');
    setEditingBoatId(null);
  };

  const duplicateBoat = (boat: Boat, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBoatId = crypto.randomUUID();
    const newBoat: Boat = {
      ...boat,
      id: newBoatId,
      name: `${boat.name} (Cópia)`
    };
    
    const boatSchedules = schedules.filter(s => s.boatId === boat.id);
    const newSchedules = boatSchedules.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      boatId: newBoatId
    }));

    setBoats([...boats, newBoat]);
    setSchedules([...schedules, ...newSchedules]);
  };

  const removeBoat = (id: string) => {
    if (window.confirm('Tem certeza? Isso apagará todos os horários desta lancha.')) {
      setBoats(boats.filter(b => b.id !== id));
      setSchedules(schedules.filter(s => s.boatId !== id));
      if (selectedBoatId === id) setSelectedBoatId(null);
      if (editingBoatId === id) cancelEditingBoat();
    }
  };

  const handleStopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'NEW_STOP_OPTION') {
      setIsAddingNewStop(true);
      setSelectedStop('');
    } else {
      setSelectedStop(value);
      setIsAddingNewStop(false);
    }
  };

  const addNewStop = () => {
    if (!newStopName.trim()) return;
    
    const newStop: Stop = {
      id: crypto.randomUUID(),
      name: newStopName,
      distanceFromManausKm: 0,
      routeIds: [selectedRouteId],
      mapX: 50,
      mapY: 50
    };

    setStops([...stops, newStop]);
    setSelectedStop(newStop.id);
    setNewStopName('');
    setIsAddingNewStop(false);
  };

  const handleSaveSchedule = () => {
    if (!selectedBoatId || !time || !selectedStop) return;

    const scheduleData = {
      boatId: selectedBoatId,
      stopId: selectedStop,
      direction: selectedDirection,
      dayOfWeek: selectedDay,
      expectedTime: time,
      departurePort: selectedPort
    };

    if (editingScheduleId) {
      setSchedules(schedules.map(s => 
        s.id === editingScheduleId ? { ...s, ...scheduleData } : s
      ));
      setEditingScheduleId(null);
    } else {
      const newSchedule: Schedule = {
        id: crypto.randomUUID(),
        ...scheduleData
      };
      setSchedules([...schedules, newSchedule]);
    }
    setTime('');
  };

  const startEditing = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setSelectedDirection(schedule.direction);
    setSelectedDay(schedule.dayOfWeek);
    setSelectedStop(schedule.stopId);
    setTime(schedule.expectedTime);
    if (schedule.departurePort) {
      setSelectedPort(schedule.departurePort);
    }

    const stop = stops.find(s => s.id === schedule.stopId);
    if (stop && stop.routeIds.length > 0) {
      if (!stop.routeIds.includes(selectedRouteId)) {
        setSelectedRouteId(stop.routeIds[0]);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingScheduleId(null);
    setTime('');
    setSelectedStop('');
  };

  const removeSchedule = (id: string) => {
    if (window.confirm('Remover este horário?')) {
      setSchedules(schedules.filter(s => s.id !== id));
      if (editingScheduleId === id) cancelEditing();
    }
  };

  const filteredSchedules = schedules
    .filter(s => s.boatId === selectedBoatId)
    .sort((a, b) => {
      const days = { 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6, 'Domingo': 7 };
      if (days[a.dayOfWeek] !== days[b.dayOfWeek]) return days[a.dayOfWeek] - days[b.dayOfWeek];
      return a.expectedTime.localeCompare(b.expectedTime);
    });

  const boatLogs = logs
    .filter(l => l.boatId === selectedBoatId)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:pl-64">
      {/* Boats Column */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Plus className="mr-2 text-teal-600" /> {editingBoatId ? 'Editar Lancha' : 'Cadastrar Lancha'}
        </h2>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newBoatName}
            onChange={(e) => setNewBoatName(e.target.value)}
            placeholder={editingBoatId ? "Editando nome..." : "Nome da Lancha"}
            className={`flex-1 p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none ${editingBoatId ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
          />
          <button 
            onClick={handleSaveBoat}
            className={`text-white px-4 py-2 rounded-md transition flex items-center ${editingBoatId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {editingBoatId ? <><Save size={16} className="mr-1"/> Salvar</> : 'Adicionar'}
          </button>
          {editingBoatId && (
            <button onClick={cancelEditingBoat} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {boats.map(boat => (
            <div 
              key={boat.id}
              onClick={() => setSelectedBoatId(boat.id)}
              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center group transition-colors ${
                selectedBoatId === boat.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-medium text-slate-700">{boat.name}</span>
                {logs.filter(l => l.boatId === boat.id).length > 0 && (
                   <span className="text-[10px] text-teal-600 flex items-center mt-1">
                      <Activity size={10} className="mr-1" /> {logs.filter(l => l.boatId === boat.id).length} registros reais
                   </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={(e) => startEditingBoat(boat, e)} className="text-slate-400 hover:text-amber-500 p-1.5 rounded-full hover:bg-amber-50 transition-colors">
                  <Pencil size={14} />
                </button>
                <button onClick={(e) => duplicateBoat(boat, e)} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 transition-colors">
                  <Copy size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); removeBoat(boat.id); }} className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedules & Logs Column */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
           <Calendar className="mr-2 text-teal-600" /> Detalhes da Operação
        </h2>

        {!selectedBoatId ? (
          <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            Selecione uma lancha para ver horários e registros reais.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm font-medium text-teal-800 bg-teal-100 inline-block px-3 py-1 rounded-full">
              Lancha: {boats.find(b => b.id === selectedBoatId)?.name}
            </div>

            {/* Form de Horários */}
            <div className={`space-y-4 p-4 rounded-lg border transition-colors ${editingScheduleId ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center mb-2">
                <Plus size={12} className="mr-1" /> {editingScheduleId ? 'Editar Horário' : 'Novo Horário Previsto'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Rota/Rio</label>
                  <select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)} className="w-full p-2 rounded border border-slate-300 bg-white text-sm">
                    {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sentido</label>
                   <select 
                     value={selectedDirection} 
                     onChange={(e) => setSelectedDirection(e.target.value as Direction)} 
                     className={`w-full p-2 rounded border font-bold text-sm bg-white ${selectedDirection === Direction.UPSTREAM ? 'border-teal-500 text-teal-700' : 'border-blue-500 text-blue-700'}`}
                   >
                     <option value={Direction.UPSTREAM}>Subindo (Interior)</option>
                     <option value={Direction.DOWNSTREAM}>Descendo (Capital)</option>
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                   <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Dia</label>
                   <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full p-2 rounded border border-slate-300 bg-white text-sm">
                     {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                </div>
                 <div className="col-span-1 relative">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Localidade</label>
                  {isAddingNewStop ? (
                    <div className="flex items-center space-x-1">
                      <input type="text" value={newStopName} onChange={(e) => setNewStopName(e.target.value)} placeholder="Local..." className="w-full p-2 text-sm rounded border border-teal-500 bg-white" autoFocus />
                      <button onClick={addNewStop} className="p-2 bg-teal-600 text-white rounded"><Check size={16} /></button>
                      <button onClick={() => setIsAddingNewStop(false)} className="p-2 bg-slate-200 text-slate-600 rounded"><X size={16} /></button>
                    </div>
                  ) : (
                    <select value={selectedStop} onChange={handleStopChange} className="w-full p-2 rounded border border-slate-300 bg-white text-sm">
                      <option value="">Selecione...</option>
                      {availableStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option value="NEW_STOP_OPTION">+ Outra</option>
                    </select>
                  )}
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Horário</label>
                   <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-2 rounded border border-slate-300 bg-white text-sm" />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveSchedule} className={`flex-1 text-white py-2 rounded-md text-sm font-medium ${editingScheduleId ? 'bg-amber-600' : 'bg-teal-600'}`}>
                  {editingScheduleId ? 'Atualizar Horário' : 'Salvar no Itinerário'}
                </button>
                {editingScheduleId && <button onClick={cancelEditing} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-md text-sm">Cancelar</button>}
              </div>
            </div>

            {/* Listas: Horários e Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coluna de Horários Planejados */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                  <Clock size={14} className="mr-1 text-teal-600" /> Itinerário Previsto
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredSchedules.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded">Sem horários.</p>
                  ) : (
                    filteredSchedules.map(s => (
                      <div key={s.id} className={`p-3 border-l-4 rounded bg-white text-xs group hover:shadow-sm transition-shadow ${s.direction === Direction.UPSTREAM ? 'border-l-teal-500 border-teal-50' : 'border-l-blue-500 border-blue-50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${s.direction === Direction.UPSTREAM ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                             {s.direction === Direction.UPSTREAM ? 'SUBINDO' : 'DESCENDO'}
                          </span>
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditing(s)} className="text-amber-500 p-1"><Pencil size={12} /></button>
                            <button onClick={() => removeSchedule(s.id)} className="text-red-400 p-1"><Trash2 size={12} /></button>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{stops.find(st => st.id === s.stopId)?.name}</div>
                            <div className="text-slate-500 font-medium">{s.dayOfWeek}</div>
                          </div>
                          <div className="text-lg font-black text-slate-700">{s.expectedTime}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Coluna de Registros Reais (LOGS) */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center">
                  <Activity size={14} className="mr-1 text-amber-600" /> Histórico Real
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {boatLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded">Sem registros reais ainda.</p>
                  ) : (
                    boatLogs.map(l => (
                      <div key={l.id} className={`p-3 border-l-4 rounded bg-amber-50/20 text-xs border-slate-100 hover:border-amber-200 transition-colors ${l.direction === Direction.UPSTREAM ? 'border-l-teal-600' : 'border-l-blue-600'}`}>
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-slate-800 text-sm">{stops.find(st => st.id === l.stopId)?.name}</span>
                           <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded">{new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <div className="flex items-center font-bold">
                             {l.direction === Direction.UPSTREAM ? (
                               <><ArrowUpCircle size={12} className="mr-1 text-teal-600" /> <span className="text-teal-700 uppercase">SUBINDO</span></>
                             ) : (
                               <><ArrowDownCircle size={12} className="mr-1 text-blue-600" /> <span className="text-blue-700 uppercase">DESCENDO</span></>
                             )}
                          </div>
                          <span>{new Date(l.timestamp).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</span>
                        </div>
                        {l.notes && <div className="mt-2 text-slate-600 bg-white/60 p-2 rounded italic text-[11px] border border-dashed border-slate-200">{l.notes}</div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoatManager;
