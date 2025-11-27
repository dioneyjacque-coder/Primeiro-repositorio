import React, { useState, useRef, useMemo } from 'react';
import { ChatMessage, Boat, Schedule, ArrivalLog, Stop, Direction } from '../types';
import { 
  askFastQuery, 
  askWithMaps, 
  askWithThinking, 
  analyzeScheduleImage, 
  transcribeAudio 
} from '../services/geminiService';
import { Mic, Image as ImageIcon, Map as MapIcon, Zap, Send, BrainCircuit, Loader2, Search } from 'lucide-react';

interface GeminiAssistantProps {
  boats: Boat[];
  schedules: Schedule[];
  logs: ArrivalLog[];
  stops: Stop[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ boats, schedules, logs, stops }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: 'Olá! Sou seu assistente inteligente do NavegaAmazonas. Tenho acesso aos horários e registros das lanchas. Pergunte algo como "Qual lancha está subindo hoje?" ou "Quando a Glória de Deus chega em Coari?"' 
    }
  ]);
  const [input, setInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'fast' | 'maps' | 'thinking'>('fast');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Generate context string from app state
  const getAppContext = () => {
    const boatList = boats.map(b => `- ${b.name} (Capacidade: ${b.capacity})`).join('\n');
    
    const scheduleList = schedules.map(s => {
      const boat = boats.find(b => b.id === s.boatId)?.name || 'Desconhecida';
      const stop = stops.find(st => st.id === s.stopId)?.name || 'Desconhecido';
      const dir = s.direction === Direction.UPSTREAM ? 'Subindo (-> Tabatinga)' : 'Descendo (-> Manaus)';
      return `- ${boat}: ${stop} às ${s.expectedTime} (${s.dayOfWeek}) - ${dir}`;
    }).join('\n');

    const logsList = logs.slice(0, 20).map(l => {
      const boat = boats.find(b => b.id === l.boatId)?.name || 'Desconhecida';
      const stop = stops.find(st => st.id === l.stopId)?.name || 'Desconhecido';
      const date = new Date(l.timestamp).toLocaleString('pt-BR');
      return `- [${date}] ${boat} chegou em ${stop} (${l.direction}). Obs: ${l.notes || 'Nenhuma'}`;
    }).join('\n');

    return `
=== DADOS DO APLICATIVO NAVEGAAMAZONAS ===
LANCHAS CADASTRADAS:
${boatList || 'Nenhuma cadastrada'}

HORÁRIOS PREVISTOS (ITINERÁRIO):
${scheduleList || 'Nenhum horário cadastrado'}

REGISTROS RECENTES DE CHEGADA (REAL):
${logsList || 'Nenhum registro recente'}
=========================================
`;
  };

  const addMessage = (role: 'user' | 'model', text: string, groundingUrls?: any[]) => {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role, text, groundingUrls }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    addMessage('user', userText);
    setIsLoading(true);

    const appContext = getAppContext();

    try {
      let responseText = '';
      let urls: any[] = [];

      if (mode === 'fast') {
        responseText = await askFastQuery(userText, appContext);
      } else if (mode === 'maps') {
        let location = undefined;
        try {
           // Short timeout for location to keep UI snappy
           const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
             navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
           });
           location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (e) {
           console.log("Loc unavailable, continuing without user loc");
        }
        
        const result = await askWithMaps(userText, location, appContext);
        responseText = result.text;
        urls = result.sources;
      } else if (mode === 'thinking') {
        responseText = await askWithThinking(userText, appContext);
      }

      addMessage('model', responseText, urls);
    } catch (error) {
      addMessage('model', "Desculpe, ocorreu um erro ao processar sua solicitação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addMessage('user', `[Enviou uma imagem: ${file.name}]`);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      const analysis = await analyzeScheduleImage(base64String, input);
      addMessage('model', analysis);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          addMessage('user', '[Áudio gravado]');
          setIsLoading(true);
          const transcription = await transcribeAudio(base64Audio);
          
          // Optionally auto-send transcription to AI
          // For now, just show it
          addMessage('model', `Transcrição: "${transcription}"`);
          setIsLoading(false);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone", err);
      alert("Erro ao acessar microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    return messages.filter(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [messages, searchTerm]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] md:pl-64">
      {/* Search Header for Chat History */}
      <div className="bg-white px-4 py-2 border-b border-slate-100 flex items-center gap-2">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Pesquisar na conversa..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-sm w-full text-slate-600"
        />
      </div>

      <div className="bg-white border-b border-slate-200 p-4 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setMode('fast')}
          className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            mode === 'fast' ? 'bg-teal-100 text-teal-800 ring-1 ring-teal-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Zap size={14} className="mr-1.5" /> Rápido (Dados App)
        </button>
        <button
          onClick={() => setMode('maps')}
          className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            mode === 'maps' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <MapIcon size={14} className="mr-1.5" /> Mapas + Dados
        </button>
        <button
          onClick={() => setMode('thinking')}
          className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            mode === 'thinking' ? 'bg-purple-100 text-purple-800 ring-1 ring-purple-500' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BrainCircuit size={14} className="mr-1.5" /> Pensar (Complexo)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {filteredMessages.length === 0 && searchTerm && (
           <div className="text-center text-slate-400 text-sm mt-4">Nenhuma mensagem encontrada.</div>
        )}
        {filteredMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-teal-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Fontes:</p>
                  <ul className="space-y-1">
                    {msg.groundingUrls.map((source, idx) => (
                      <li key={idx}>
                        <a 
                          href={source.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline flex items-center"
                        >
                          <MapIcon size={10} className="mr-1" />
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-200 flex items-center text-slate-500 text-sm">
              <Loader2 className="animate-spin mr-2" size={16} /> Analisando dados do app...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-full transition-colors"
             title="Enviar foto de horário"
             disabled={isLoading}
           >
             <ImageIcon size={20} />
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*"
               onChange={handleImageUpload} 
             />
           </button>
           
           <button 
             onMouseDown={startRecording}
             onMouseUp={stopRecording}
             onTouchStart={startRecording}
             onTouchEnd={stopRecording}
             className={`p-2 rounded-full transition-colors ${
               isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100'
             }`}
             title="Segure para gravar áudio"
             disabled={isLoading}
           >
             <Mic size={20} />
           </button>

           <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              mode === 'thinking' ? "Pergunta complexa sobre a frota..." :
              mode === 'maps' ? "Onde fica a parada X?" :
              "Qual lancha sai hoje?"
            }
            className="flex-1 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={isLoading}
           />
           
           <button 
             onClick={handleSend}
             disabled={!input.trim() || isLoading}
             className="bg-teal-600 text-white p-2 rounded-full hover:bg-teal-700 disabled:opacity-50 transition-colors"
           >
             <Send size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;