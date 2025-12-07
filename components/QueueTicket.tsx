import React from 'react';
import { QueueTicket, QueueStatus, Service } from '../types';
import { Icons } from './Icons';

interface QueueTicketProps {
  ticket: QueueTicket;
  service: Service;
  onLeave: (ticketId: string) => void;
  t: (key: string) => string;
}

const QueueTicketCard: React.FC<QueueTicketProps> = ({ ticket, service, onLeave, t }) => {
  const isUrgent = ticket.estimatedWaitTime < 5 && ticket.status === QueueStatus.WAITING;
  const peopleAhead = ticket.ticketNumber - service.currentTicketNumber;
  const progressPercent = Math.max(0, Math.min(100, 100 - (peopleAhead * 10)));

  return (
    <div className="bg-white rounded-xl shadow-lg border border-indigo-50 overflow-hidden relative">
      {/* Top Decoration */}
      <div className={`h-2 w-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`} />
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{t('ticketNumber')}</h4>
            <span className="text-4xl font-bold text-gray-900">#{ticket.ticketNumber}</span>
          </div>
          <div className="text-right">
            <h4 className="text-gray-500 text-sm font-medium">{service.name}</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
              ${ticket.status === QueueStatus.SERVING ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {ticket.status}
            </span>
          </div>
        </div>

        {ticket.status === QueueStatus.WAITING && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Icons.Users size={16} /> {t('peopleAhead')}
              </span>
              <span className="font-semibold text-gray-900">{Math.max(0, peopleAhead)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 flex items-center gap-2">
                <Icons.Clock size={16} /> {t('estimatedWait')}
              </span>
              <span className={`font-bold ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>
                {ticket.estimatedWaitTime} mins
              </span>
            </div>

            {/* AI Analysis Badge */}
            {ticket.aiAnalysis && (
               <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <div className="flex items-start gap-2">
                  <Icons.AI size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-800 leading-relaxed">
                    {ticket.aiAnalysis}
                  </p>
                </div>
               </div>
            )}
            
            {/* Indian Context: Notifications */}
            <div className="flex gap-2 mt-2">
                {service.smsEnabled && (
                    <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Icons.SMS size={10} /> SMS Sent to +91...
                    </div>
                )}
                {service.whatsappEnabled && (
                    <div className="text-[10px] text-green-600 flex items-center gap-1">
                        <Icons.WhatsApp size={10} /> Updates on WhatsApp
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="mt-2">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-400 mt-1">{t('queueProgress')}</p>
            </div>
          </div>
        )}

        {ticket.status === QueueStatus.SERVING && (
          <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center animate-pulse">
            <p className="text-green-800 font-bold text-lg">{t('itsYourTurn')}</p>
            <p className="text-green-600 text-sm">{t('proceedCounter')}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
        <button className="text-gray-400 hover:text-gray-600 text-sm font-medium flex items-center gap-1">
          <Icons.QrCode size={16} /> {t('showQR')}
        </button>
        {ticket.status !== QueueStatus.SERVING && (
          <button 
            onClick={() => onLeave(ticket.id)}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            {t('leaveQueue')}
          </button>
        )}
      </div>
    </div>
  );
};

export default QueueTicketCard;