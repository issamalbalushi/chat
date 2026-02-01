
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, UserProfile, AppMode, MessageType } from './types';
import { getGeminiResponse } from './services/geminiService';
import { 
  PaperAirplaneIcon, 
  VideoCameraIcon, 
  MicrophoneIcon, 
  Cog6ToothIcon, 
  ChatBubbleLeftRightIcon,
  PhoneXMarkIcon,
  SparklesIcon,
  XMarkIcon,
  PhotoIcon,
  StopIcon,
  TrashIcon,
  CameraIcon,
  ArrowPathIcon,
  CheckIcon,
  PlusIcon,
  LockClosedIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/solid';

// --- Authentication Component ---
const LoginForm: React.FC<{ onLogin: (email: string) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <span className="text-3xl font-bold text-white">J</span>
          </div>
          <h2 className="text-2xl font-bold text-white">مرحباً بك في Janoochat</h2>
          <p className="text-slate-500 text-sm mt-2 text-center">مساحتك الخاصة والآمنة للمحادثة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="email" 
              required
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pr-4 pl-12 text-sm focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="password" 
              required
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pr-4 pl-12 text-sm focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all transform active:scale-[0.98]"
          >
            {isRegistering ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-indigo-400 text-sm font-medium hover:text-indigo-300"
          >
            {isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ سجل الآن'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Message Bubble Component ---
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isMe = message.sender === 'me';
  
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="rounded-xl overflow-hidden border border-slate-700/50">
            <img src={message.content} alt="Attachment" className="max-w-full h-auto max-h-80 object-cover" />
          </div>
        );
      case 'audio':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <audio controls className="h-8 w-full brightness-90 contrast-125">
              <source src={message.content} type="audio/webm" />
            </audio>
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className={`flex w-full mb-4 ${isMe ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
        isMe 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
      }`}>
        {renderContent()}
        <div className={`text-[10px] mt-1 opacity-60 ${isMe ? 'text-left' : 'text-right'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [showAI, setShowAI] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  // Camera Capture State
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);

  // Unified Media Menu State
  const [showMediaMenu, setShowMediaMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auth persistence
  useEffect(() => {
    const savedAuth = localStorage.getItem('duoprive_auth');
    if (savedAuth) {
      setIsLoggedIn(true);
      setUserEmail(savedAuth);
    }
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem('duoprive_auth', email);
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('duoprive_auth');
    setIsLoggedIn(false);
  };

  // Chat logic
  useEffect(() => {
    const saved = localStorage.getItem('duoprive_messages');
    if (saved) setMessages(JSON.parse(saved));

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'duoprive_messages' && e.newValue) {
        setMessages(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, mode]);

  const saveAndSync = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem('duoprive_messages', JSON.stringify(newMessages));
  };

  const sendMessage = useCallback(async (type: MessageType = 'text', content: string = inputText) => {
    if (!content.trim() && type === 'text') return;
    if (!content && (type === 'image' || type === 'audio')) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      content: content,
      timestamp: Date.now(),
      type: type
    };

    const updated = [...messages, newMessage];
    saveAndSync(updated);
    setInputText('');
    setShowMediaMenu(false);

    if (type === 'text' && (content.toLowerCase().includes('hello') || content.includes('مرحبا'))) {
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'other',
          content: 'أهلاً بك! كيف حالك اليوم؟',
          timestamp: Date.now(),
          type: 'text'
        };
        saveAndSync([...updated, reply]);
      }, 1500);
    }
  }, [messages, inputText]);

  // Audio recording
  const startRecording = async () => {
    setShowMediaMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => sendMessage('audio', reader.result as string);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { alert("يرجى تفعيل الميكروفون"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  // Photography
  const startCapturing = async () => {
    setShowMediaMenu(false);
    setIsCapturing(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      captureStreamRef.current = stream;
      if (captureVideoRef.current) captureVideoRef.current.srcObject = stream;
    } catch (err) {
      alert("يرجى تفعيل الكاميرا");
      setIsCapturing(false);
    }
  };

  const stopCapturing = () => {
    if (captureStreamRef.current) captureStreamRef.current.getTracks().forEach(track => track.stop());
    setIsCapturing(false);
    setCapturedImage(null);
  };

  const takePhoto = () => {
    if (captureVideoRef.current && captureCanvasRef.current) {
      const canvas = captureCanvasRef.current;
      const video = captureVideoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/png'));
    }
  };

  const sendCapturedPhoto = () => { if (capturedImage) { sendMessage('image', capturedImage); stopCapturing(); } };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { sendMessage('image', reader.result as string); };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
    setShowMediaMenu(false);
  };

  // AI assistant
  const askAI = async () => {
    if (!inputText.trim()) return;
    setShowAI(true);
    setAiResponse('يفكر الذكاء الاصطناعي...');
    const context = messages.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\n');
    const response = await getGeminiResponse(inputText, context);
    setAiResponse(response || 'لم أتمكن من الحصول على رد.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 overflow-hidden font-sans select-none">
      
      {/* Sidebar Navigation */}
      <div className="w-20 md:w-24 bg-slate-900 flex flex-col items-center py-8 space-y-8 border-l border-slate-800">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <span className="text-xl font-bold text-white">J</span>
        </div>
        
        <button onClick={() => setMode(AppMode.CHAT)} className={`p-3 rounded-xl transition-all ${mode === AppMode.CHAT ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <ChatBubbleLeftRightIcon className="w-7 h-7" />
        </button>
        
        <button onClick={() => setMode(AppMode.VIDEO_CALL)} className={`p-3 rounded-xl transition-all ${mode === AppMode.VIDEO_CALL ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <VideoCameraIcon className="w-7 h-7" />
        </button>

        <div className="flex-grow"></div>

        <button onClick={() => setMode(AppMode.SETTINGS)} className={`p-3 rounded-xl transition-all ${mode === AppMode.SETTINGS ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}>
          <Cog6ToothIcon className="w-7 h-7" />
        </button>
      </div>

      <main className="flex-grow flex flex-col relative">
        <header className="h-16 glass px-6 flex items-center justify-between z-10 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=partner`} className="w-10 h-10 rounded-full bg-slate-800 p-0.5 border border-indigo-500" alt="Avatar" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-sm font-bold">شريك المحادثة</h1>
              <p className="text-[10px] text-green-400">متصل الآن</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden md:inline">{userEmail}</span>
            <button onClick={handleLogout} className="text-xs text-red-500/70 hover:text-red-500 mr-2">خروج</button>
          </div>
        </header>

        <div className="flex-grow overflow-hidden relative">
          {mode === AppMode.CHAT && (
            <div ref={scrollRef} className="h-full overflow-y-auto p-6 flex flex-col space-y-2">
              <div className="flex justify-center mb-8">
                <span className="text-[10px] bg-slate-800/50 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest border border-slate-700/50">تشفير تام بين الطرفين</span>
              </div>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
                  <SparklesIcon className="w-12 h-12 mb-2" />
                  <p>ابدأ بمشاركة أفكارك هنا</p>
                </div>
              )}
              {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
            </div>
          )}

          {mode === AppMode.VIDEO_CALL && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-20">
              <div className="text-center mb-12">
                <div className="w-24 h-24 bg-indigo-600/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-indigo-500 animate-pulse">
                   <VideoCameraIcon className="w-12 h-12 text-indigo-500" />
                </div>
                <h2 className="text-xl font-bold">جاري الاتصال...</h2>
              </div>
              <button onClick={() => setMode(AppMode.CHAT)} className="px-8 py-3 bg-red-600 rounded-full text-white font-bold shadow-xl">إنهاء</button>
            </div>
          )}

          {isCapturing && (
            <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-4">
              <div className="relative w-full h-full max-w-xl max-h-[85vh] bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl">
                {!capturedImage ? (
                  <>
                    <video ref={captureVideoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    <button onClick={stopCapturing} className="absolute top-6 left-6 p-2 bg-black/50 text-white rounded-full"><XMarkIcon className="w-6 h-6"/></button>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                      <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-all">
                        <div className="w-16 h-16 rounded-full bg-white"></div>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full bg-slate-950 flex flex-col">
                    <img src={capturedImage} className="w-full flex-grow object-contain" alt="Captured" />
                    <div className="p-8 flex justify-center gap-8 bg-slate-900">
                       <button onClick={() => setCapturedImage(null)} className="p-4 bg-slate-800 text-white rounded-full shadow-xl">
                          <ArrowPathIcon className="w-8 h-8" />
                       </button>
                       <button onClick={sendCapturedPhoto} className="p-4 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-600/30">
                          <CheckIcon className="w-8 h-8" />
                       </button>
                    </div>
                  </div>
                )}
                <canvas ref={captureCanvasRef} className="hidden" />
              </div>
            </div>
          )}
        </div>

        {/* --- INPUT AREA --- */}
        <div className="p-6 glass border-t border-slate-800 relative">
          <div className="max-w-4xl mx-auto flex items-end gap-3">
            
            {!isRecording ? (
              <>
                <div className="relative">
                  {/* Unified Media Button */}
                  <button 
                    onClick={() => setShowMediaMenu(!showMediaMenu)}
                    className={`p-3 rounded-2xl transition-all shadow-lg flex-shrink-0 ${showMediaMenu ? 'bg-indigo-600 text-white rotate-45' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                  >
                    <PlusIcon className="w-7 h-7" />
                  </button>

                  {/* Media Menu Popover */}
                  {showMediaMenu && (
                    <div className="absolute bottom-full mb-4 right-0 w-48 bg-slate-900 border border-slate-800 rounded-[2rem] p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                       <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                       
                       <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-colors">
                          <PhotoIcon className="w-6 h-6 text-indigo-400" />
                          <span className="text-sm">المعرض</span>
                       </button>
                       <button onClick={startCapturing} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-colors border-y border-slate-800/50">
                          <CameraIcon className="w-6 h-6 text-pink-400" />
                          <span className="text-sm">الكاميرا</span>
                       </button>
                       <button onClick={startRecording} className="w-full flex items-center gap-3 p-4 hover:bg-slate-800 rounded-2xl transition-colors">
                          <MicrophoneIcon className="w-6 h-6 text-green-400" />
                          <span className="text-sm">صوت</span>
                       </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden focus-within:border-indigo-500/50 transition-all flex items-end">
                   <textarea 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="اكتب شيئاً..."
                      className="w-full bg-transparent p-4 text-sm focus:outline-none resize-none max-h-32 min-h-[56px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button onClick={askAI} className="p-4 text-indigo-400 hover:text-indigo-300">
                      <SparklesIcon className="w-6 h-6" />
                    </button>
                </div>

                <button 
                  onClick={() => sendMessage()}
                  disabled={!inputText.trim()}
                  className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20 transition-all"
                >
                  <PaperAirplaneIcon className="w-6 h-6 rotate-180" />
                </button>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-between bg-indigo-600/10 border border-indigo-500/30 rounded-[2rem] p-4 animate-in zoom-in-95">
                <div className="flex items-center gap-4 pr-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-indigo-400 font-mono text-xl">{formatTime(recordingTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setIsRecording(false); if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); }} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl">
                    <TrashIcon className="w-6 h-6" />
                  </button>
                  <button onClick={stopRecording} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/40">
                    <StopIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Response Popover */}
          {showAI && (
            <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 w-full max-w-lg bg-indigo-950/95 border border-indigo-500/50 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-4 backdrop-blur-xl z-50">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <SparklesIcon className="w-5 h-5" />
                    <span className="text-sm font-bold">اقتراح Duo AI</span>
                  </div>
                  <button onClick={() => setShowAI(false)} className="p-1 hover:bg-white/10 rounded-full"><XMarkIcon className="w-5 h-5 text-indigo-400" /></button>
               </div>
               <p className="text-sm text-indigo-50 leading-relaxed text-right">{aiResponse}</p>
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal */}
      {mode === AppMode.SETTINGS && (
        <div className="absolute inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-slate-900 w-full max-w-md rounded-[3rem] border border-slate-800 p-10 shadow-2xl relative">
              <button onClick={() => setMode(AppMode.CHAT)} className="absolute top-8 left-8 text-slate-500"><XMarkIcon className="w-7 h-7" /></button>
              <h2 className="text-2xl font-bold mb-8">الإعدادات</h2>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-3xl">
                   <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-xl font-bold">أ</div>
                   <div>
                     <p className="text-sm font-bold">أنت (مستخدم)</p>
                     <p className="text-[10px] text-slate-500">{userEmail}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-3xl text-center">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">الرسائل</p>
                      <p className="text-lg font-bold">{messages.length}</p>
                   </div>
                   <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-3xl text-center">
                      <p className="text-[10px] text-slate-500 uppercase mb-1">الحماية</p>
                      <p className="text-lg font-bold text-green-500">نشطة</p>
                   </div>
                </div>

                <button 
                  onClick={() => { localStorage.removeItem('duoprive_messages'); setMessages([]); setMode(AppMode.CHAT); }}
                  className="w-full py-4 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl text-sm font-bold transition-all border border-red-500/20"
                >
                  حذف جميع الرسائل نهائياً
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
