import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import BoatManager from './components/BoatManager';
import RealTimeTracker from './components/RealTimeTracker';
import GeminiAssistant from './components/GeminiAssistant';
import OfflineMap from './components/OfflineMap';
import { Boat, Schedule, Stop, ArrivalLog, Direction, Route } from './types';
import { Ship, Clock, AlertTriangle } from 'lucide-react';

const INITIAL_ROUTES: Route[] = [
  { id: 'solimoes', name: 'Rio Solimões (Manaus-Tabatinga)', color: '#0d9488' }, // Teal
  { id: 'jurua', name: 'Rio Juruá (Manaus-Eirunepé)', color: '#d97706' }, // Amber
  { id: 'japura', name: 'Rio Japurá (Manaus-Limoeiro)', color: '#2563eb' }, // Blue
];

// Seed data with map coordinates (approximate schematic positions)
// X: 0 (Left/West) -> 100 (Right/East/Manaus)
// Y: 0 (Top/North) -> 100 (Bottom/South)
const INITIAL_STOPS: Stop[] = [
  // Solimões Main Route
  { id: '1', name: 'Manaus', distanceFromManausKm: 0, routeIds: ['solimoes', 'jurua', 'japura'], mapX: 90, mapY: 50 },
  { id: '2', name: 'Codajás', distanceFromManausKm: 240, routeIds: ['solimoes', 'jurua', 'japura'], mapX: 75, mapY: 52 },
  { id: '3', name: 'Coari', distanceFromManausKm: 363, routeIds: ['solimoes', 'jurua', 'japura'], mapX: 65, mapY: 55 },
  { id: '4', name: 'Tefé', distanceFromManausKm: 523, routeIds: ['solimoes', 'jurua', 'japura'], mapX: 50, mapY: 50 },
  { id: '5', name: 'Fonte Boa', distanceFromManausKm: 678, routeIds: ['solimoes'], mapX: 40, mapY: 50 },
  { id: '6', name: 'Jutaí', distanceFromManausKm: 750, routeIds: ['solimoes'], mapX: 30, mapY: 48 },
  { id: '7', name: 'Tonantins', distanceFromManausKm: 875, routeIds: ['solimoes'], mapX: 20, mapY: 48 },
  { id: '8', name: 'Sto. Ant. do Içá', distanceFromManausKm: 880, routeIds: ['solimoes'], mapX: 18, mapY: 45 },
  { id: '9', name: 'Amaturá', distanceFromManausKm: 908, routeIds: ['solimoes'], mapX: 12, mapY: 48 },
  { id: '10', name: 'S.P. de Olivença', distanceFromManausKm: 964, routeIds: ['solimoes'], mapX: 8, mapY: 48 },
  { id: '11', name: 'Tabatinga', distanceFromManausKm: 1108, routeIds: ['solimoes'], mapX: 2, mapY: 50 },

  // Juruá Route (Branches near Tefé/Jutaí mouth area conceptually)
  { id: '12', name: 'Carauari', distanceFromManausKm: 800, routeIds: ['jurua'], mapX: 35, mapY: 70 },
  { id: '13', name: 'Itamarati', distanceFromManausKm: 950, routeIds: ['jurua'], mapX: 25, mapY: 78 },
  { id: '14', name: 'Eirunepé', distanceFromManausKm: 1150, routeIds: ['jurua'], mapX: 15, mapY: 85 },

  // Japurá Route (Branches near Tefé mouth area North)
  { id: '15', name: 'Maraã', distanceFromManausKm: 700, routeIds: ['japura'], mapX: 40, mapY: 30 },
  { id: '16', name: 'Japurá', distanceFromManausKm: 900, routeIds: ['japura'], mapX: 25, mapY: 20 },
  { id: '17', name: 'Limoeiro', distanceFromManausKm: 1000, routeIds: ['japura'], mapX: 15, mapY: 15 },
];

const INITIAL_BOATS: Boat[] = [
  { id: 'b1', name: 'Lancha Glória de Deus', capacity: 60, contact: '9299999999' },
  { id: 'b2', name: 'Expresso Cristalina', capacity: 80, contact: '9298888888' },
  { id: 'b3', name: 'Cidade de Manaquiri', capacity: 0, contact: '' },
  { id: 'b4', name: 'Soberana', capacity: 0, contact: '' },
  { id: 'b5', name: 'Madame Crys', capacity: 0, contact: '' },
  { id: 'b6', name: 'Ajato 2000', capacity: 0, contact: '' },
  { id: 'b7', name: 'Crystal', capacity: 0, contact: '' },
  { id: 'b8', name: 'Kedson Araujo', capacity: 0, contact: '' },
  { id: 'b9', name: 'Lima de Abreu', capacity: 0, contact: '' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // State initialization with Persistence
  const [boats, setBoats] = useState<Boat[]>(() => {
    const saved = localStorage.getItem('boats');
    if (saved) {
       const parsed = JSON.parse(saved);
       // Merge strategy: Add initial boats that aren't in parsed based on name
       const newBoats = [...parsed];
       let changed = false;
       INITIAL_BOATS.forEach(initBoat => {
         if (!newBoats.find((b: Boat) => b.name === initBoat.name)) {
           newBoats.push(initBoat);
           changed = true;
         }
       });
       return changed ? newBoats : parsed;
    }
    return INITIAL_BOATS;
  });
  
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const saved = localStorage.getItem('schedules');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [logs, setLogs] = useState<ArrivalLog[]>(() => {
    const saved = localStorage.getItem('logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [stops, setStops] = useState<Stop[]>(() => {
    const saved = localStorage.getItem('stops');
    return saved ? JSON.parse(saved) : INITIAL_STOPS;
  });
  
  const [routes] = useState<Route[]>(INITIAL_ROUTES);

  // Persistence Effects
  useEffect(() => { localStorage.setItem('boats', JSON.stringify(boats)); }, [boats]);
  useEffect(() => { localStorage.setItem('schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem('logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('stops', JSON.stringify(stops)); }, [stops]);

  // Dashboard calculations
  const getNextDepartures = () => {
     return schedules.slice(0, 5); 
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="md:pl-64 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                <div className="p-3 bg-teal-100 text-teal-600 rounded-full">
                  <Ship size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Lanchas Ativas</p>
                  <p className="text-2xl font-bold text-slate-800">{boats.length}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Horários</p>
                  <p className="text-2xl font-bold text-slate-800">{schedules.length}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                 <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold">Registros</p>
                  <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
                </div>
              </div>
            </div>

            {/* Offline Map Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Rotas do Amazonas (Offline)</h2>
              <OfflineMap stops={stops} routes={routes} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Próximos Horários</h2>
              {schedules.length === 0 ? (
                <p className="text-slate-400">Nenhum horário cadastrado. Vá em "Lanchas & Rotas" para adicionar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                      <tr>
                        <th className="p-3">Lancha</th>
                        <th className="p-3">Local</th>
                        <th className="p-3">Dia</th>
                        <th className="p-3">Hora</th>
                        <th className="p-3">Sentido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getNextDepartures().map(s => {
                        const boat = boats.find(b => b.id === s.boatId);
                        const stop = stops.find(st => st.id === s.stopId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800">{boat?.name}</td>
                            <td className="p-3">{stop?.name}</td>
                            <td className="p-3">{s.dayOfWeek}</td>
                            <td className="p-3 font-bold text-teal-600">{s.expectedTime}</td>
                            <td className="p-3 text-xs">
                              {s.direction === Direction.UPSTREAM ? (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">Subindo</span>
                              ) : (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Descendo</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case 'boats':
        return (
          <BoatManager 
            boats={boats} 
            setBoats={setBoats} 
            schedules={schedules} 
            setSchedules={setSchedules} 
            stops={stops} 
            setStops={setStops}
            routes={routes} 
          />
        );
      case 'logs':
        return (
          <RealTimeTracker 
            boats={boats} 
            stops={stops} 
            setStops={setStops}
            logs={logs} 
            setLogs={setLogs} 
            routes={routes} 
          />
        );
      case 'ai':
        return <GeminiAssistant boats={boats} schedules={schedules} logs={logs} stops={stops} />;
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;