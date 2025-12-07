import React, { useState, useEffect } from 'react';
import { Service, ServiceType, QueueTicket, QueueStatus, Language } from './types';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Icons } from './components/Icons';
import { findNearbyServices } from './services/geminiService';

// --- TRANSLATIONS ---
const TRANSLATIONS = {
  en: {
    hello: 'Hello',
    subtitle: 'Find a service or manage your active queues.',
    activeQueues: 'Your Active Queues',
    servicesNearYou: 'Services Near You',
    joinQueue: 'Join Queue',
    joining: 'Joining...',
    ticketNumber: 'Token Number',
    peopleAhead: 'People Ahead',
    estimatedWait: 'Est. Wait',
    queueProgress: 'Queue Progress',
    leaveQueue: 'Leave Queue',
    showQR: 'Show QR',
    open: 'Open',
    closed: 'Closed',
    waiting: 'Waiting',
    avgWait: 'Avg Wait',
    itsYourTurn: "It's your turn!",
    proceedCounter: "Please proceed to the counter."
  },
  hi: {
    hello: 'नमस्ते',
    subtitle: 'सेवा खोजें या अपनी कतार प्रबंधित करें।',
    activeQueues: 'आपकी सक्रिय कतारें',
    servicesNearYou: 'निकटतम सेवाएँ',
    joinQueue: 'कतार में जुड़ें',
    joining: 'जुड़ रहे हैं...',
    ticketNumber: 'टोकन नंबर',
    peopleAhead: 'आगे लोग',
    estimatedWait: 'अनुमानित समय',
    queueProgress: 'कतार प्रगति',
    leaveQueue: 'कतार छोड़ें',
    showQR: 'QR दिखाएँ',
    open: 'खुला है',
    closed: 'बंद है',
    waiting: 'प्रतीक्षा',
    avgWait: 'औसत समय',
    itsYourTurn: "आपकी बारी है!",
    proceedCounter: "कृपया काउंटर पर जाएँ।"
  },
  kn: {
    hello: 'ನಮಸ್ಕಾರ',
    subtitle: 'ಸೇವೆಯನ್ನು ಹುಡುಕಿ ಅಥವಾ ನಿಮ್ಮ ಸರತಿಯನ್ನು ನಿರ್ವಹಿಸಿ.',
    activeQueues: 'ನಿಮ್ಮ ಸಕ್ರಿಯ ಸರತಿಗಳು',
    servicesNearYou: 'ಹತ್ತಿರದ ಸೇವೆಗಳು',
    joinQueue: 'ಸರತಿ ಸೇರಿ',
    joining: 'ಸೇರುತ್ತಿದೆ...',
    ticketNumber: 'ಟೋಕನ್ ಸಂಖ್ಯೆ',
    peopleAhead: 'ಮುಂದಿರುವ ಜನರು',
    estimatedWait: 'ಅಂದಾಜು ಸಮಯ',
    queueProgress: 'ಸರತಿ ಪ್ರಗತಿ',
    leaveQueue: 'ಸರತಿ ಬಿಡಿ',
    showQR: 'QR ತೋರಿಸಿ',
    open: 'ತೆರೆದಿದೆ',
    closed: 'ಮುಚ್ಚಿದೆ',
    waiting: 'ಕಾಯುತ್ತಿದ್ದಾರೆ',
    avgWait: 'ಸರಾಸರಿ ಸಮಯ',
    itsYourTurn: "ನಿಮ್ಮ ಸರದಿ ಬಂದಿದೆ!",
    proceedCounter: "ದಯವಿಟ್ಟು ಕೌಂಟರ್‌ಗೆ ತೆರಳಿ."
  },
  ta: {
    hello: 'வணக்கம்',
    subtitle: 'சேவையைத் தேடுங்கள் அல்லது வரிசையை நிர்வகிக்கவும்.',
    activeQueues: 'உங்கள் வரிசைகள்',
    servicesNearYou: 'அருகிலுள்ள சேவைகள்',
    joinQueue: 'வரிசையில் சேரவும்',
    joining: 'இணைகிறது...',
    ticketNumber: 'டோக்கன் எண்',
    peopleAhead: 'முன்னால் உள்ளவர்கள்',
    estimatedWait: 'மதிப்பிடப்பட்ட நேரம்',
    queueProgress: 'முன்னேற்றம்',
    leaveQueue: 'வெளியேறு',
    showQR: 'QR காட்டு',
    open: 'திறந்துள்ளது',
    closed: 'மூடப்பட்டது',
    waiting: 'காத்திருப்பு',
    avgWait: 'சராசரி நேரம்',
    itsYourTurn: "உங்கள் முறை வந்துவிட்டது!",
    proceedCounter: "கவுண்டருக்குச் செல்லவும்."
  }
};

// --- MOCK DATA (INDIAN CONTEXT) ---
const INITIAL_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'AIIMS OPD - General Medicine',
    type: ServiceType.HOSPITAL,
    location: 'Ansari Nagar, New Delhi',
    isOpen: true,
    currentTicketNumber: 402,
    waitingCount: 54,
    averageWaitTimeMins: 20,
    whatsappEnabled: true
  },
  {
    id: 's2',
    name: 'SBI - Koramangala Branch',
    type: ServiceType.BANK,
    location: 'Bangalore, Karnataka',
    isOpen: true,
    currentTicketNumber: 15,
    waitingCount: 12,
    averageWaitTimeMins: 10,
    smsEnabled: true
  },
  {
    id: 's3',
    name: 'RTO Indiranagar - DL Test',
    type: ServiceType.RTO,
    location: 'Indiranagar, Bangalore',
    isOpen: true,
    currentTicketNumber: 120,
    waitingCount: 85,
    averageWaitTimeMins: 45,
    smsEnabled: true
  },
  {
    id: 's4',
    name: 'Tirumala Darshan - Free Line',
    type: ServiceType.TEMPLE,
    location: 'Tirupati, Andhra Pradesh',
    isOpen: true, // Always busy
    currentTicketNumber: 15402,
    waitingCount: 2300,
    averageWaitTimeMins: 180, // 3 hours
    whatsappEnabled: true
  },
  {
    id: 's5',
    name: 'Aadhaar Seva Kendra',
    type: ServiceType.AADHAAR,
    location: 'Shivaji Nagar, Pune',
    isOpen: true,
    currentTicketNumber: 88,
    waitingCount: 22,
    averageWaitTimeMins: 15,
    smsEnabled: true
  },
  {
    id: 's6',
    name: 'Udupi Upahar',
    type: ServiceType.RESTAURANT,
    location: 'Jayanagar, Bangalore',
    isOpen: false, // Lunch break closed
    currentTicketNumber: 45,
    waitingCount: 0,
    averageWaitTimeMins: 15
  }
];

// --- APP COMPONENT ---
function App() {
  const [view, setView] = useState<'landing' | 'user' | 'admin'>('landing');
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [userTickets, setUserTickets] = useState<QueueTicket[]>([]);
  const [language, setLanguage] = useState<Language>('en');
  const [isFindingNearby, setIsFindingNearby] = useState(false);
  const [groundingChunks, setGroundingChunks] = useState<any[]>([]);
  
  // Helper for translations
  const t = (key: string) => {
    return (TRANSLATIONS[language] as any)[key] || (TRANSLATIONS['en'] as any)[key] || key;
  };

  // Timer to simulate queue movement slowly over time
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prevServices => prevServices.map(service => {
        // Randomly decrease wait count occasionally to simulate movement if open
        if (service.isOpen && service.waitingCount > 0 && Math.random() > 0.8) {
             return {
               ...service,
               currentTicketNumber: service.currentTicketNumber + 1,
               waitingCount: service.waitingCount - 1
             };
        }
        return service;
      }));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Update user tickets based on service state
  useEffect(() => {
    setUserTickets(prevTickets => prevTickets.map(ticket => {
        const service = services.find(s => s.id === ticket.serviceId);
        if (!service) return ticket;

        // If ticket number is passed, mark completed
        if (service.currentTicketNumber > ticket.ticketNumber) {
            return { ...ticket, status: QueueStatus.COMPLETED };
        }
        // If ticket number is current, mark serving
        if (service.currentTicketNumber === ticket.ticketNumber) {
            return { ...ticket, status: QueueStatus.SERVING, estimatedWaitTime: 0 };
        }

        // Recalculate estimate roughly
        const peopleAhead = ticket.ticketNumber - service.currentTicketNumber;
        const newEstimate = peopleAhead * service.averageWaitTimeMins;
        
        return {
            ...ticket,
            estimatedWaitTime: newEstimate
        };
    }));
  }, [services]);

  const handleJoinQueue = (serviceId: string, newTicket: QueueTicket) => {
    setUserTickets(prev => [...prev, newTicket]);
    setServices(prev => prev.map(s => 
      s.id === serviceId ? { ...s, waitingCount: s.waitingCount + 1 } : s
    ));
  };

  const handleLeaveQueue = (ticketId: string) => {
     const ticket = userTickets.find(t => t.id === ticketId);
     if (ticket) {
        setUserTickets(prev => prev.filter(t => t.id !== ticketId));
        setServices(prev => prev.map(s => 
            s.id === ticket.serviceId && s.waitingCount > 0 
            ? { ...s, waitingCount: s.waitingCount - 1 } 
            : s
        ));
     }
  };

  const handleAdminNextCustomer = (serviceId: string) => {
    setServices(prev => prev.map(s => 
       s.id === serviceId && s.waitingCount > 0
       ? { ...s, currentTicketNumber: s.currentTicketNumber + 1, waitingCount: s.waitingCount - 1 }
       : s
    ));
  };

  const handleAdminToggleService = (serviceId: string) => {
    setServices(prev => prev.map(s => 
       s.id === serviceId ? { ...s, isOpen: !s.isOpen } : s
    ));
  };

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsFindingNearby(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app, this would merge with existing or replace based on context
        // Here we replace the mock data with "Real" data found by Gemini
        const result = await findNearbyServices(latitude, longitude);
        
        if (result.services.length > 0) {
            setServices(result.services);
            setGroundingChunks(result.groundingChunks);
        } else {
            alert("Could not find services nearby using AI. Please try again.");
        }
        setIsFindingNearby(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please check permissions.");
        setIsFindingNearby(false);
      }
    );
  };

  // --- VIEWS ---

  const renderLanding = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex flex-col justify-center items-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-8 border-t-4 border-orange-500">
        <div className="flex justify-center mb-4">
          <div className="bg-orange-600 p-4 rounded-xl shadow-lg transform -rotate-3">
             <Icons.Users className="text-white w-10 h-10" />
          </div>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pankti (पंक्ति)</h1>
          <p className="text-gray-500">Smart queues for a smarter India.<br/>From Temples to Hospitals.</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => setView('user')}
            className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold shadow-md transition-transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            <Icons.Smartphone />
            Join a Queue (Public)
          </button>
          
          <button 
            onClick={() => setView('admin')}
            className="w-full py-4 bg-white border-2 border-gray-200 hover:border-orange-200 hover:bg-orange-50 text-gray-700 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
          >
            <Icons.Building />
            Service Provider Login
          </button>
        </div>

        <div className="flex justify-center gap-4 text-xs text-gray-400 mt-8">
           <span>Powered by Gemini AI</span>
           <span>•</span>
           <span>Made for India 🇮🇳</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {view === 'landing' && renderLanding()}
      
      {view === 'user' && (
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center cursor-pointer" onClick={() => setView('landing')}>
                  <div className="bg-orange-600 p-1.5 rounded mr-2">
                    <Icons.Clock className="text-white w-5 h-5" />
                  </div>
                  <span className="font-bold text-xl text-gray-900">Pankti <span className="text-orange-600">(पंक्ति)</span></span>
                </div>
                <div className="flex items-center">
                  <button onClick={() => setView('landing')} className="text-gray-500 hover:text-gray-700 p-2">
                    <Icons.Logout size={20} />
                  </button>
                </div>
              </div>
            </div>
          </nav>
          
          <UserDashboard 
            services={services}
            activeTickets={userTickets}
            onJoinQueue={handleJoinQueue}
            onLeaveQueue={handleLeaveQueue}
            onFindNearby={handleFindNearby}
            isFindingNearby={isFindingNearby}
            userParams={{ name: "Rahul" }}
            language={language}
            setLanguage={setLanguage}
            t={t}
          />
          
          {/* Grounding Source Attribution */}
          {groundingChunks.length > 0 && (
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
               <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg border border-gray-200">
                  <p className="font-semibold mb-1">Source: Google Maps</p>
                  <ul className="list-disc pl-4 space-y-1">
                     {groundingChunks.map((chunk, i) => (
                         chunk.web?.uri && (
                           <li key={i}>
                             <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                               {chunk.web.title || chunk.web.uri}
                             </a>
                           </li>
                         )
                     ))}
                  </ul>
               </div>
             </div>
          )}
        </div>
      )}

      {view === 'admin' && (
         <div className="min-h-screen bg-gray-50">
           <nav className="bg-slate-900 shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center cursor-pointer" onClick={() => setView('landing')}>
                  <span className="font-bold text-xl text-white tracking-wider">PANKTI <span className="text-orange-400">ADMIN</span></span>
                </div>
                <div className="flex items-center">
                  <button onClick={() => setView('landing')} className="text-gray-400 hover:text-white p-2">
                    <Icons.Logout size={20} />
                  </button>
                </div>
              </div>
            </div>
          </nav>
          <AdminDashboard 
            services={services}
            onNextCustomer={handleAdminNextCustomer}
            onToggleService={handleAdminToggleService}
          />
         </div>
      )}
    </>
  );
}

export default App;