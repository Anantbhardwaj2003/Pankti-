import React from 'react';
import { Service, ServiceType } from '../types';
import { Icons } from './Icons';

interface ServiceCardProps {
  service: Service;
  onJoin: (service: Service) => void;
  isJoining: boolean;
  t: (key: string) => string;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onJoin, isJoining, t }) => {
  const getIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.HOSPITAL: return <Icons.Hospital className="text-red-500" />;
      case ServiceType.BANK: return <Icons.Bank className="text-emerald-500" />;
      case ServiceType.RESTAURANT: return <Icons.Coffee className="text-orange-500" />;
      case ServiceType.GOVERNMENT: return <Icons.Building className="text-blue-500" />;
      case ServiceType.TEMPLE: return <Icons.Temple className="text-amber-500" />;
      case ServiceType.RTO: return <Icons.RTO className="text-indigo-500" />;
      case ServiceType.AADHAAR: return <Icons.Aadhaar className="text-pink-600" />;
      default: return <Icons.Building className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-50 rounded-lg">
            {getIcon(service.type)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{service.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Icons.MapPin size={14} />
              {service.location}
            </p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${service.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {service.isOpen ? t('open') : t('closed')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">{t('waiting')}</p>
          <p className="text-lg font-bold text-gray-900">{service.waitingCount}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded-lg text-center">
          <p className="text-xs text-gray-500 uppercase font-semibold">{t('avgWait')}</p>
          <p className="text-lg font-bold text-gray-900">~{service.averageWaitTimeMins}m</p>
        </div>
      </div>
      
      {/* Features Badges */}
      <div className="flex gap-2 mb-4 flex-wrap">
         {service.whatsappEnabled && (
           <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
             <Icons.WhatsApp size={12} /> WhatsApp
           </span>
         )}
         {service.smsEnabled && (
           <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
             <Icons.SMS size={12} /> SMS Token
           </span>
         )}
         {service.mapsUrl && (
            <a 
              href={service.mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium hover:bg-gray-200"
            >
              <Icons.MapPin size={12} /> Map
            </a>
         )}
      </div>

      <button
        onClick={() => onJoin(service)}
        disabled={!service.isOpen || isJoining}
        className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors
          ${!service.isOpen 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
          }`}
      >
        {isJoining ? (
          <span className="animate-pulse">{t('joining')}</span>
        ) : (
          <>
            <Icons.Plus size={18} />
            {t('joinQueue')}
          </>
        )}
      </button>
    </div>
  );
};

export default ServiceCard;