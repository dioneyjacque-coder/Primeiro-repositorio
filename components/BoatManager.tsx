import React, { useState } from 'react';
import { Boat, Schedule, Direction, Stop, Route } from '../types';
import { Plus, Trash2, Save, Calendar, Search, Filter, MapPin, Check, X } from 'lucide-react';

interface BoatManagerProps {
  boats: Boat[];
  setBoats: React.Dispatch<React.SetStateAction<Boat[]>>;
  schedules: Schedule[];
  setSchedules: React.Dispatch<React.SetStateAction<Schedule[]>>;
  stops: Stop[];
  setStops: React.Dispatch<React.SetStateAction<Stop[]>>;
  routes: Route[];
}

const BoatManager: React.FC<BoatManagerProps> = ({ boats, setBoats, schedules, setSchedules, stops, setStops, routes }) => {
  const [newBoatName, setNewBoatName] = useState('');
  const [selectedBoatId, setSelectedBoatId] = useState<string | null>(null);
  
  // Schedule Form State
  const [selectedDirection, setSelectedDirection] = useState<Direction>(Direction.UPSTREAM);
  const [selectedDay, setSelectedDay] = useState('Segunda');
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id);
  const [selectedStop, setSelectedStop] = useState('');
  const [time, setTime] = useState('');

  // New Stop Form State
  const [isAddingNewStop, setIsAddingNewStop] = useState(false);
  const [newStopName, setNewStopName] = useState('');
  
  // Filter state for the schedule list
  const [scheduleFilter, setScheduleFilter] = useState('');

  const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Filter stops based on selected route
  const availableStops = stops.filter(s => s.routeIds.includes(selectedRouteId));

  const addBoat = () => {
    if (!newBoatName) return;
    const newBoat: Boat = {
      id: crypto.randomUUID(),
      name: newBoatName,
      contact: '',
      capacity: 0
    };
    setBoats([...boats, newBoat]);
    setNewBoatName('');
  };

  const removeBoat = (id: string) => {
    setBoats(boats.filter(b => b.id !== id));
    setSchedules(schedules.filter(s => s.boatId !== id));
    if (selectedBoatId === id) setSelectedBoatId(null);
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
      distanceFromManausKm: 0, // Default since we don't know
      routeIds: [selectedRouteId],
      mapX: 50, // Default to center for schematic map
      mapY: 50
    };

    setStops([...stops, newStop]);
    setSelectedStop(newStop.id);
    setNewStopName('');
    setIsAddingNewStop(false);
  };

  const addSchedule = () => {
    if (!selectedBoatId || !time || !selectedStop) return;
    const newSchedule: Schedule = {
      id: crypto.randomUUID(),
      boatId: selectedBoatId,
      stopId: selectedStop,
      direction: selectedDirection,
      dayOfWeek: selectedDay,
      expectedTime: time
    };
    setSchedules([...schedules, newSchedule]);
    setTime('');
  };

  const removeSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const filteredSchedules = schedules
    .filter(s => s.boatId === selectedBoatId)
    .filter(s => {
      if (!scheduleFilter) return true;
      const stopName = stops.find(st => st.id === s.stopId)?.name.toLowerCase() || '';
      return stopName.includes(scheduleFilter.toLowerCase()) || 
             s.dayOfWeek.toLowerCase().includes(scheduleFilter.toLowerCase());
    });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:pl-64">
      {/* Boats Column */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Plus className="mr-2 text-teal-600" /> Cadastrar Lancha
        </h2>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newBoatName}
            onChange={(e) => setNewBoatName(e.target.value)}
            placeholder="Nome da Lancha (ex: Glória de Deus)"
            className="flex-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
          <button 
            onClick={addBoat}
            className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
          >
            Adicionar
          </button>
        </div>

        <div className="space-y-2">
          {boats.map(boat => (
            <div 
              key={boat.id}
              onClick={() => setSelectedBoatId(boat.id)}
              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${
                selectedBoatId === boat.id 
                  ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium text-slate-700">{boat.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); removeBoat(boat.id); }}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {boats.length === 0 && <p className="text-slate-400 text-sm italic">Nenhuma lancha cadastrada.</p>}
        </div>
      </div>

      {/* Schedules Column */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
           <Calendar className="mr-2 text-teal-600" /> Gerenciar Itinerário & Horários
        </h2>

        {!selectedBoatId ? (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            Selecione uma lancha para gerenciar seus horários.
          </div>
        ) : (
          <div>
            <div className="mb-4 text-sm font-medium text-teal-800 bg-teal-100 inline-block px-3 py-1 rounded-full">
              Editando: {boats.find(b => b.id === selectedBoatId)?.name}
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              
              {/* Route Selector to filter stops */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center">
                  <Filter size={12} className="mr-1"/> Filtrar Rota (Rio)
                </label>
                <select 
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    setSelectedStop(''); // Reset stop when route changes
                    setIsAddingNewStop(false);
                  }}
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                >
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sentido</label>
                  <select 
                    value={selectedDirection}
                    onChange={(e) => setSelectedDirection(e.target.value as Direction)}
                    className="w-full p-2 rounded border border-slate-300 bg-white"
                  >
                    <option value={Direction.UPSTREAM}>Subindo</option>
                    <option value={Direction.DOWNSTREAM}>Descendo</option>
                  </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Dia</label>
                   <select 
                      value={selectedDay}
                      onChange={(e) => setSelectedDay(e.target.value)}
                      className="w-full p-2 rounded border border-slate-300 bg-white"
                   >
                     {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="relative">
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Localidade</label>
                  
                  {isAddingNewStop ? (
                    <div className="flex items-center space-x-1">
                      <input 
                        type="text" 
                        value={newStopName}
                        onChange={(e) => setNewStopName(e.target.value)}
                        placeholder="Nome da cidade/comunidade"
                        className="w-full p-2 text-sm rounded border border-teal-500 ring-1 ring-teal-500 bg-white focus:outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={addNewStop} 
                        className="p-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                        title="Salvar Localidade"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => { setIsAddingNewStop(false); setSelectedStop(''); }} 
                        className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <select 
                       value={selectedStop}
                       onChange={handleStopChange}
                       className="w-full p-2 rounded border border-slate-300 bg-white"
                    >
                      <option value="">Selecione...</option>
                      {availableStops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      <option disabled>──────────</option>
                      <option value="NEW_STOP_OPTION" className="font-semibold text-teal-600">+ Outros (Cadastrar Nova)</option>
                    </select>
                  )}
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Horário</label>
                   <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full p-2 rounded border border-slate-300 bg-white"
                   />
                </div>
              </div>

              <button 
                onClick={addSchedule}
                disabled={isAddingNewStop}
                className="w-full flex justify-center items-center bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} className="mr-2" /> Salvar Horário
              </button>
            </div>

            <div className="flex justify-between items-end mb-2">
              <h3 className="font-semibold text-slate-700">Horários Cadastrados</h3>
              <div className="relative">
                 <input 
                    type="text"
                    placeholder="Filtrar cidade/dia..."
                    value={scheduleFilter}
                    onChange={(e) => setScheduleFilter(e.target.value)}
                    className="pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-teal-500"
                 />
                 <Search size={12} className="absolute left-2 top-1.5 text-slate-400" />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredSchedules.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum horário cadastrado para esta lancha (com filtro atual).</p>
              ) : (
                filteredSchedules.map(schedule => (
                  <div key={schedule.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded shadow-sm text-sm">
                    <div>
                      <div className="font-bold text-slate-700">
                        {stops.find(s => s.id === schedule.stopId)?.name} 
                        <span className="font-normal text-slate-500 mx-1">•</span> 
                        {schedule.expectedTime}
                      </div>
                      <div className="text-xs text-slate-500">
                        {schedule.dayOfWeek} • {schedule.direction === Direction.UPSTREAM ? 'Subindo' : 'Descendo'}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeSchedule(schedule.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoatManager;