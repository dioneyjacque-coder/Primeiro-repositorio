
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

  const formatLogFullDay = (timestamp: number) => {
    const date = new Date(timestamp);
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dayMonth = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return {
      day: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      date: dayMonth
    };
  };

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
            placeholder={editingBoatId ? "Editando..." : "Nome da Lancha"}
            className="flex-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={handleSaveBoat} className={`text-white px-4 py-2 rounded-md transition ${editingBoatId ? 'bg-amber-500' : 'bg-teal-600'}`}>
            {editingBoatId ? 'Salvar' : 'Adicionar'}
          </button>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {boats.map(boat => (
            <div 
              key={boat.id}
              onClick={() => setSelectedBoatId(boat.id)}
              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                selectedBoatId === boat.id ? 'border-teal-500 bg-teal-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 uppercase text-sm tracking-tight">{boat.name}</span>
                <span className="text-[10px] text-slate-400 font-bold">{logs.filter(l => l.boatId === boat.id).length} registros reais</span>
              </div>
              <div className="flex items-center space-x-1">
                <button onClick={(e) => startEditingBoat(boat, e)} className="text-slate-400 hover:text-amber-500 p-1"><Pencil size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); removeBoat(boat.id); }} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedules & Logs Column */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
           <Calendar className="mr-2 text-teal-600" /> Operação Detalhada
        </h2>

        {!selectedBoatId ? (
          <div className="text-center py-20 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            Selecione uma lancha para gerenciar.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm font-black text-white bg-slate-800 px-4 py-1.5 rounded-lg inline-block uppercase tracking-wider">
              {boats.find(b => b.id === selectedBoatId)?.name}
            </div>

            {/* Listas: Horários e Logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Coluna de Horários Planejados */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Itinerário Padrão</h3>
                <div className="space-y-3">
                  {filteredSchedules.map(s => (
                    <div key={s.id} className="p-3 border rounded-lg bg-white shadow-sm border-l-4 border-l-slate-800 relative group">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase">{s.dayOfWeek}</span>
                        <button onClick={() => removeSchedule(s.id)} className="opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={12} /></button>
                      </div>
                      <div className="mt-1 flex justify-between items-end">
                        <span className="font-black text-slate-800 text-sm">{stops.find(st => st.id === s.stopId)?.name}</span>
                        <span className="text-base font-black text-teal-600">{s.expectedTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna de Registros Reais (LOGS) */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Histórico Real</h3>
                <div className="space-y-3">
                  {boatLogs.map(l => {
                    const info = formatLogFullDay(l.timestamp);
                    return (
                      <div key={l.id} className={`p-3 border rounded-lg shadow-sm bg-slate-50/50 border-l-4 ${l.direction === Direction.UPSTREAM ? 'border-l-emerald-500' : 'border-l-blue-500'}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                            {info.day}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">{info.date}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{stops.find(st => st.id === l.stopId)?.name}</span>
                              <span className={`text-[9px] font-bold uppercase mt-0.5 ${l.direction === Direction.UPSTREAM ? 'text-emerald-600' : 'text-blue-600'}`}>
                                {l.direction === Direction.UPSTREAM ? '↑ Subindo' : '↓ Descendo'}
                              </span>
                           </div>
                           <span className="text-sm font-black text-slate-700">{new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    );
                  })}
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
