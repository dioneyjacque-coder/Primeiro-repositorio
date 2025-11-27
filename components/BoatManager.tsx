import React, { useState } from 'react';
import { Boat, Schedule, Direction, Stop, Route } from '../types';
import { Plus, Trash2, Save, Calendar, Search, Filter, MapPin, Check, X, Anchor, Pencil, RotateCcw, Copy } from 'lucide-react';

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

  const manausPorts = [
    'Manaus Moderna (Balsa Amarela)',
    'Manaus Moderna (Balsa Vermelha)',
    'Balsa Laranja (Terminal Ajato)',
    'Porto do São Raimundo',
    'Roadway (Porto de Manaus)',
    'Porto da Panair',
    'Porto do Ceasa',
    'Porto Privatizado',
    'Outro / Não Definido'
  ];

  // Filter stops based on selected route
  const availableStops = stops.filter(s => s.routeIds.includes(selectedRouteId));

  const handleSaveBoat = () => {
    if (!newBoatName.trim()) return;

    if (editingBoatId) {
      // Update existing boat
      setBoats(boats.map(b => b.id === editingBoatId ? { ...b, name: newBoatName } : b));
      setEditingBoatId(null);
      setNewBoatName('');
    } else {
      // Add new boat
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
    
    // Clone all schedules associated with the original boat
    const boatSchedules = schedules.filter(s => s.boatId === boat.id);
    const newSchedules = boatSchedules.map(s => ({
      ...s,
      id: crypto.randomUUID(),
      boatId: newBoatId
    }));

    setBoats([...boats, newBoat]);
    setSchedules([...schedules, ...newSchedules]);
    alert(`Lancha duplicada com ${newSchedules.length} horários copiados!`);
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
      // Update existing
      setSchedules(schedules.map(s => 
        s.id === editingScheduleId ? { ...s, ...scheduleData } : s
      ));
      setEditingScheduleId(null);
    } else {
      // Create new
      const newSchedule: Schedule = {
        id: crypto.randomUUID(),
        ...scheduleData
      };
      setSchedules([...schedules, newSchedule]);
    }
    
    // Reset basic fields but keep Route/Boat for faster entry
    setTime('');
    // Optional: Reset stop or keep it? Keeping context is usually better for data entry
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

    // Find which route this stop belongs to so the dropdown shows the correct list
    const stop = stops.find(s => s.id === schedule.stopId);
    if (stop && stop.routeIds.length > 0) {
      // Prefer current selected route if it contains the stop, otherwise switch to first valid route
      if (!stop.routeIds.includes(selectedRouteId)) {
        setSelectedRouteId(stop.routeIds[0]);
      }
    }
    
    // Scroll to form (for mobile)
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
          <Plus className="mr-2 text-teal-600" /> {editingBoatId ? 'Editar Lancha' : 'Cadastrar Lancha'}
        </h2>
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newBoatName}
            onChange={(e) => setNewBoatName(e.target.value)}
            placeholder={editingBoatId ? "Editando nome..." : "Nome da Lancha (ex: Glória de Deus)"}
            className={`flex-1 p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none ${editingBoatId ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
          />
          <button 
            onClick={handleSaveBoat}
            className={`text-white px-4 py-2 rounded-md transition flex items-center ${editingBoatId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {editingBoatId ? <><Save size={16} className="mr-1"/> Salvar</> : 'Adicionar'}
          </button>
          {editingBoatId && (
            <button 
              onClick={cancelEditingBoat}
              className="px-3 py-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition"
              title="Cancelar Edição"
            >
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
                selectedBoatId === boat.id 
                  ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-medium text-slate-700">{boat.name}</span>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={(e) => startEditingBoat(boat, e)}
                  className="text-slate-400 hover:text-amber-500 p-1.5 rounded-full hover:bg-amber-50 transition-colors"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={(e) => duplicateBoat(boat, e)}
                  className="text-slate-400 hover:text-blue-500 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                  title="Copiar Lancha e Horários"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeBoat(boat.id); }}
                  className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                  title="Apagar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
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
              {editingScheduleId ? 'Editando Horário de: ' : 'Gerenciando: '} 
              {boats.find(b => b.id === selectedBoatId)?.name}
            </div>

            <div className={`space-y-4 p-4 rounded-lg border mb-6 transition-colors ${editingScheduleId ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
              
              {/* Route Selector to filter stops */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center">
                  <Filter size={12} className="mr-1"/> Filtrar Rota (Rio)
                </label>
                <select 
                  value={selectedRouteId}
                  onChange={(e) => {
                    setSelectedRouteId(e.target.value);
                    if (!editingScheduleId) setSelectedStop(''); // Only reset if not editing (or logic demands)
                    setIsAddingNewStop(false);
                  }}
                  className="w-full p-2 rounded border border-slate-300 bg-white"
                >
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              
              {/* Departure Port Selection */}
              <div>
                 <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center">
                   <Anchor size={12} className="mr-1"/> Porto de Saída (Em Manaus)
                 </label>
                 <select 
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="w-full p-2 rounded border border-slate-300 bg-white text-sm"
                 >
                   {manausPorts.map(port => <option key={port} value={port}>{port}</option>)}
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

              <div className="flex gap-2">
                <button 
                  onClick={handleSaveSchedule}
                  disabled={isAddingNewStop}
                  className={`flex-1 flex justify-center items-center text-white py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed ${editingScheduleId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                >
                  <Save size={16} className="mr-2" /> {editingScheduleId ? 'Atualizar Horário' : 'Salvar Horário'}
                </button>
                
                {editingScheduleId && (
                  <button 
                    onClick={cancelEditing}
                    className="flex items-center px-4 py-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition"
                  >
                    <RotateCcw size={16} className="mr-1" /> Cancelar
                  </button>
                )}
              </div>
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
                  <div key={schedule.id} className={`flex flex-col p-3 border rounded shadow-sm text-sm group ${editingScheduleId === schedule.id ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-300' : 'bg-white border-slate-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-700">
                          {stops.find(s => s.id === schedule.stopId)?.name} 
                          <span className="font-normal text-slate-500 mx-1">•</span> 
                          {schedule.expectedTime}
                        </div>
                        <div className="text-xs text-slate-500">
                          {schedule.dayOfWeek} • {schedule.direction === Direction.UPSTREAM ? 'Subindo' : 'Descendo'}
                        </div>
                        {schedule.departurePort && (
                           <div className="text-[10px] text-teal-600 mt-1 flex items-center">
                              <Anchor size={10} className="mr-1" />
                              Porto: {schedule.departurePort}
                           </div>
                        )}
                      </div>
                      <div className="flex space-x-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(schedule)}
                          className="text-amber-500 hover:text-amber-700 p-1"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => removeSchedule(schedule.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
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