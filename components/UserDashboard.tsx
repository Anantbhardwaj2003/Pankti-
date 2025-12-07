import React, { useState } from 'react';
import { Service, QueueTicket, ServiceType, QueueStatus, Language } from '../types';
import ServiceCard from './ServiceCard';
import QueueTicketCard from './QueueTicket';
import { Icons } from './Icons';
import { getSmartWaitTimeEstimate } from '../services/geminiService';

interface UserDashboardProps {
  services: Service[];
  activeTickets: QueueTicket[];
  onJoinQueue: (serviceId: string, ticket: QueueTicket) => void;
  onLeaveQueue: (ticketId: string) => void;
  onFindNearby: () => void;
  isFindingNearby: boolean;
  userParams: { name: string };
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  services, 
  activeTickets, 
  onJoinQueue, 
  onLeaveQueue,
  onFindNearby,
  isFindingNearby,
  userParams,
  language,
  setLanguage,
  t
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ServiceType | 'All'>('All');

  const handleJoin = async (service: Service) => {
    // Prevent double joining
    if (activeTickets.find(t => t.serviceId === service.id)) {
      alert("You are already in this queue!");
      return;
    }

    setLoadingId(service.id);
    
    // Simulate API delay and AI Calculation
    const positionInQueue = service.waitingCount + 1;
    const aiEstimate = await getSmartWaitTimeEstimate(service, positionInQueue);
    
    const newTicket: QueueTicket = {
      id: Math.random().toString(36).substr(2, 9),
      serviceId: service.id,
      ticketNumber: service.currentTicketNumber + service.waitingCount + 1,
      status: QueueStatus.WAITING,
      joinedAt: Date.now(),
      estimatedWaitTime: aiEstimate.estimatedMinutes,
      aiAnalysis: `${aiEstimate.reasoning} (Crowd: ${aiEstimate.crowdLevel})`
    };

    onJoinQueue(service.id, newTicket);
    setLoadingId(null);
  };

  const filteredServices = filter === 'All' 
    ? services 
    : services.filter(s => s.type === filter);

  // Separate active from completed
  const currentActiveTickets = activeTickets.filter(
    t => t.status === QueueStatus.WAITING || t.status === QueueStatus.SERVING
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('hello')}, {userParams.name} 👋</h1>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        
        {/* Language Selector */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex items-center">
             {(['en', 'hi', 'kn', 'ta'] as Language[]).map(lang => (
                 <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        language === lang 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                 >
                    {lang === 'en' ? 'ENG' : lang === 'hi' ? 'हिंदी' : lang === 'kn' ? 'ಕನ್ನಡ' : 'தமிழ்'}
                 </button>
             ))}
        </div>
      </header>

      {/* Active Queues Section */}
      {currentActiveTickets.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icons.Clock className="text-indigo-600" size={20} />
            {t('activeQueues')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentActiveTickets.map(ticket => {
              const service = services.find(s => s.id === ticket.serviceId);
              if (!service) return null;
              return (
                <QueueTicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  service={service}
                  onLeave={onLeaveQueue}
                  t={t}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Available Services Section */}
      <section>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
             <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icons.MapPin className="text-indigo-600" size={20} />
                {t('servicesNearYou')}
            </h2>
            
            <button
                onClick={onFindNearby}
                disabled={isFindingNearby}
                className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
            >
                {isFindingNearby ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                        Locating...
                    </>
                ) : (
                    <>
                        <Icons.MapPin size={16} className="text-orange-500" />
                        Use My Location (Real Data)
                    </>
                )}
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 w-full xl:w-auto custom-scrollbar">
            {['All', ...Object.values(ServiceType)].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                  ${filter === type 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onJoin={handleJoin}
              isJoining={loadingId === service.id}
              t={t}
            />
          ))}
          {filteredServices.length === 0 && (
             <div className="col-span-full py-12 text-center text-gray-500">
                No services found for this filter.
             </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;