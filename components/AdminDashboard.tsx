import React, { useState, useEffect, useRef } from 'react';
import { Service, QueueActionRecommendation } from '../types';
import { Icons } from './Icons';
import { getQueueRecommendation } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, ComposedChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface AdminDashboardProps {
  services: Service[];
  onNextCustomer: (serviceId: string) => void;
  onToggleService: (serviceId: string) => void;
}

type AdminView = 'COMMAND_CENTER' | 'STAFF' | 'ANALYTICS' | 'AI_CONFIG';

// --- Mock Data Generators ---
const generateWaitTimeTrend = (baseWait: number) => {
  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  return hours.map((time, i) => {
    const variation = Math.sin(i / 2) * 15; 
    return {
      time,
      actual: Math.max(5, Math.floor(baseWait + variation + (Math.random() * 10))),
      predicted: Math.max(5, Math.floor(baseWait + variation + (Math.random() * 5) - 5))
    };
  });
};

const QUEUE_DEMOGRAPHICS = [
  { name: 'General', value: 65, color: '#6366f1' },
  { name: 'Senior Citizen', value: 20, color: '#10b981' },
  { name: 'Priority/VIP', value: 15, color: '#f59e0b' },
];

const INITIAL_STAFF_DATA = [
  { id: 1, name: 'Rajesh Kumar', role: 'Senior Clerk', status: 'Active', counter: 'Counter 1', efficiency: 94, avatar: 'RK' },
  { id: 2, name: 'Priya Singh', role: 'Teller', status: 'Break', counter: 'Counter 2', efficiency: 88, avatar: 'PS' },
  { id: 3, name: 'Amit Patel', role: 'Manager', status: 'Active', counter: 'Help Desk', efficiency: 97, avatar: 'AP' },
  { id: 4, name: 'Suresh Reddy', role: 'Clerk', status: 'Offline', counter: '-', efficiency: 0, avatar: 'SR' },
  { id: 5, name: 'Meera Nair', role: 'Trainee', status: 'Active', counter: 'Counter 3', efficiency: 76, avatar: 'MN' },
];

const WEEKLY_PERFORMANCE = [
  { day: 'Mon', footfall: 450, avgWait: 24 },
  { day: 'Tue', footfall: 380, avgWait: 18 },
  { day: 'Wed', footfall: 410, avgWait: 20 },
  { day: 'Thu', footfall: 390, avgWait: 19 },
  { day: 'Fri', footfall: 520, avgWait: 35 },
  { day: 'Sat', footfall: 200, avgWait: 15 },
];

const SATISFACTION_METRICS = [
  { subject: 'Wait Time', A: 120, fullMark: 150 },
  { subject: 'Staff Courtesy', A: 98, fullMark: 150 },
  { subject: 'Process Clarity', A: 86, fullMark: 150 },
  { subject: 'Facility', A: 99, fullMark: 150 },
  { subject: 'Ease of Use', A: 130, fullMark: 150 },
  { subject: 'Overall', A: 110, fullMark: 150 },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ services, onNextCustomer, onToggleService }) => {
  const [activeView, setActiveView] = useState<AdminView>('COMMAND_CENTER');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [recommendation, setRecommendation] = useState<QueueActionRecommendation | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);
  
  // State for Staff Management
  const [staffList, setStaffList] = useState(INITIAL_STAFF_DATA);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Clerk');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // State for Code Red & Shift
  const [codeRedActive, setCodeRedActive] = useState(false);
  const [showShiftDetails, setShowShiftDetails] = useState(false);

  // State for AI Config
  const [aiConfig, setAiConfig] = useState({
    reallocationThreshold: 60,
    maxWaitLimit: 45,
    autoResponse: true,
    riskTolerance: 50,
    notificationFrequency: 'High'
  });

  const activeService = services.find(s => s.id === selectedServiceId) || services[0];
  
  // Comparative Data for Bar Chart
  const comparativeData = services.slice(0, 5).map(s => ({
    name: s.name.split('-')[0].split(' ')[0], 
    waiting: s.waitingCount,
    avgTime: s.averageWaitTimeMins
  }));

  const waitTimeData = generateWaitTimeTrend(activeService.averageWaitTimeMins);

  useEffect(() => {
    if (activeService && activeView === 'COMMAND_CENTER') {
      loadRecommendation(activeService);
    }
  }, [selectedServiceId, activeService.waitingCount, activeView]);

  const loadRecommendation = async (service: Service) => {
    setLoadingRec(true);
    const rec = await getQueueRecommendation(service, services);
    setRecommendation(rec);
    setLoadingRec(false);
  };

  // Handlers
  const handleAddStaff = () => {
    if (!newStaffName) return;
    const newId = Math.max(...staffList.map(s => s.id)) + 1;
    const initials = newStaffName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    setStaffList([...staffList, {
      id: newId,
      name: newStaffName,
      role: newStaffRole,
      status: 'Active',
      counter: '-',
      efficiency: 85, // New joiner default
      avatar: initials
    }]);
    setNewStaffName('');
    setIsAddStaffOpen(false);
  };

  const handleStaffAction = (id: number, action: 'toggle' | 'delete') => {
    if (action === 'delete') {
      setStaffList(staffList.filter(s => s.id !== id));
    } else if (action === 'toggle') {
      setStaffList(staffList.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Break' : 'Active' } : s));
    }
    setOpenActionMenuId(null);
  };

  const toggleCodeRed = () => {
    setCodeRedActive(!codeRedActive);
    if (!codeRedActive) {
      // Simulate efficiency boost
      setStaffList(staffList.map(s => ({ ...s, status: 'Active', efficiency: 100 })));
      alert("🚨 CODE RED ACTIVATED: All staff set to ACTIVE. Efficiency maximised.");
    } else {
      setStaffList(INITIAL_STAFF_DATA); // Reset for demo
    }
  };

  // Derived Metrics
  const totalBacklogHours = ((activeService.waitingCount * activeService.averageWaitTimeMins) / 60).toFixed(1);
  const throughputPerHour = Math.round(60 / Math.max(1, activeService.averageWaitTimeMins));
  const utilizationRate = Math.min(100, Math.round((activeService.waitingCount / (throughputPerHour * 2)) * 100));

  // --- SUB-COMPONENT RENDERS ---

  const renderCommandCenter = () => (
    <div className="space-y-8 animate-fade-in pb-10">
       {/* Top Row: AI Command & Quick Stats */}
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* AI Command Center Widget */}
        <div className={`xl:col-span-1 rounded-2xl p-1 shadow-2xl relative overflow-hidden group transition-all duration-500
            ${codeRedActive ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black'}`}>
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
           
           <div className="h-full bg-slate-900/90 backdrop-blur-xl rounded-xl p-6 flex flex-col relative z-10 border border-white/5">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg shadow-lg animate-pulse-slow ${codeRedActive ? 'bg-red-500 shadow-red-500/30' : 'bg-indigo-500 shadow-indigo-500/30'}`}>
                      <Icons.AI className="text-white" size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-white tracking-wide">PANKTI AI</h3>
                      <p className="text-xs text-indigo-300">Real-time Optimization Engine</p>
                   </div>
                </div>
                {(recommendation?.priority === 'Critical' || codeRedActive) && (
                   <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
                     {codeRedActive ? 'CODE RED ACTIVE' : 'Critical Action'}
                   </span>
                )}
             </div>

             <div className="flex-1 flex flex-col justify-center">
                {codeRedActive ? (
                   <div className="text-center">
                     <Icons.Zap size={48} className="text-red-500 mx-auto mb-3" />
                     <h4 className="text-xl font-bold text-white">EMERGENCY OVERRIDE</h4>
                     <p className="text-red-300 text-sm">Max efficiency enforced. Auto-breaks disabled.</p>
                   </div>
                ) : loadingRec ? (
                  <div className="space-y-3">
                     <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                     <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse"></div>
                  </div>
                ) : recommendation ? (
                  <div className="animate-fade-in-up">
                    <div className="flex items-start gap-3 mb-3">
                      {recommendation.suggestedActionType === 'ALLOCATE_STAFF' && <Icons.Exchange className="text-orange-400 mt-1" />}
                      {recommendation.suggestedActionType === 'SPEED_UP' && <Icons.Zap className="text-yellow-400 mt-1" />}
                      {recommendation.suggestedActionType === 'NORMAL' && <Icons.Trending className="text-emerald-400 mt-1" />}
                      <div>
                        <h4 className="text-xl font-bold text-white leading-snug mb-2">{recommendation.actionTitle}</h4>
                        <p className="text-sm text-slate-300 leading-relaxed border-l-2 border-indigo-500/50 pl-3">
                          {recommendation.actionDescription}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                       <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/20">
                         Execute
                       </button>
                       <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                         Dismiss
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 text-center">System Idle</div>
                )}
             </div>
           </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: 'Waiting Now', value: activeService.waitingCount, unit: 'people', icon: Icons.Users, color: 'text-blue-600', bg: 'bg-blue-50' },
             { label: 'Avg Wait Time', value: activeService.averageWaitTimeMins, unit: 'mins', icon: Icons.Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
             { label: 'Est. Backlog', value: totalBacklogHours, unit: 'hours', icon: Icons.Trending, color: 'text-purple-600', bg: 'bg-purple-50' },
             { label: 'Load Capacity', value: utilizationRate, unit: '%', icon: Icons.Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' }
           ].map((stat, idx) => (
             <div key={idx} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                   <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon size={18} className={stat.color} />
                   </div>
                </div>
                <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                   <span className="text-xs text-gray-500 font-medium">{stat.unit}</span>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Middle Row: Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:col-span-2">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Wait Time Forecast</h3>
                <p className="text-sm text-gray-500">Actual vs Predicted wait times (15 min intervals)</p>
              </div>
              <div className="flex gap-4 text-xs font-medium">
                 <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500 rounded-full"></span> Actual</div>
                 <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-300 rounded-full opacity-50 border border-indigo-500 border-dashed"></span> Predicted</div>
              </div>
           </div>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={waitTimeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                   />
                   <Area type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                   <Area type="monotone" dataKey="predicted" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} fill="transparent" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
           <h3 className="text-lg font-bold text-gray-900 mb-2">Queue Composition</h3>
           <p className="text-sm text-gray-500 mb-6">Current visitor breakdown</p>
           
           <div className="flex-1 min-h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={QUEUE_DEMOGRAPHICS}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={5}
                       dataKey="value"
                    >
                       {QUEUE_DEMOGRAPHICS.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                 <div className="text-center">
                    <span className="block text-2xl font-bold text-gray-900">{activeService.waitingCount}</span>
                    <span className="block text-xs text-gray-500 uppercase">Total</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Network Comparison */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h3 className="text-lg font-bold text-gray-900">Network Load Distribution</h3>
               <p className="text-sm text-gray-500">Live comparison across top 5 active branches</p>
            </div>
            <button className="text-indigo-600 text-sm font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
               View Full Report
            </button>
         </div>
         
         <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={comparativeData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" scale="point" padding={{ left: 30, right: 30 }} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="waiting" barSize={40} fill="#6366f1" radius={[6, 6, 0, 0]} name="Waiting Count" />
                  <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} name="Avg Wait (min)" />
               </ComposedChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Controls Footer */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-wrap gap-4 items-center justify-between">
         <div className="flex items-center gap-4">
           <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-700">
              {activeService.currentTicketNumber}
           </div>
           <div>
              <p className="text-sm text-gray-500 font-medium">Currently Serving</p>
              <p className="text-lg font-bold text-gray-900">Token #{activeService.currentTicketNumber}</p>
           </div>
         </div>

         <div className="flex gap-3">
            <button
               onClick={() => onToggleService(activeService.id)}
               className={`px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all border
                  ${activeService.isOpen 
                    ? 'border-gray-200 text-gray-600 hover:bg-gray-50' 
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
            >
               {activeService.isOpen ? <><Icons.Pause size={18} /> Pause Queue</> : <><Icons.Play size={18} /> Resume</>}
            </button>
            
            <button
               onClick={() => onNextCustomer(activeService.id)}
               disabled={activeService.waitingCount === 0 || !activeService.isOpen}
               className={`px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-sm
                  ${activeService.waitingCount > 0 && activeService.isOpen
                     ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-indigo-300' 
                     : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
            >
               <Icons.Bell size={18} /> Call Next
            </button>
         </div>
      </div>
    </div>
  );

  const renderStaffManagement = () => (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-gray-800">Staff Directory & Live Status</h2>
             <button 
                onClick={() => setIsAddStaffOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
             >
                <Icons.Plus size={16} /> Add Staff
             </button>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                   <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assignment</th>
                      <th className="px-4 py-3">Efficiency</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {staffList.map(staff => (
                      <tr key={staff.id} className="hover:bg-gray-50 transition-colors group relative">
                         <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                  {staff.avatar}
                               </div>
                               <span className="font-medium text-gray-900">{staff.name}</span>
                            </div>
                         </td>
                         <td className="px-4 py-3 text-gray-600">{staff.role}</td>
                         <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border
                               ${staff.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                                 staff.status === 'Break' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                               {staff.status}
                            </span>
                         </td>
                         <td className="px-4 py-3 text-gray-600">{staff.counter}</td>
                         <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                               <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${staff.efficiency}%` }}></div>
                               </div>
                               <span className="text-xs text-gray-500">{staff.efficiency}%</span>
                            </div>
                         </td>
                         <td className="px-4 py-3 text-right">
                            <div className="relative">
                                <button 
                                    onClick={() => setOpenActionMenuId(openActionMenuId === staff.id ? null : staff.id)}
                                    className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                >
                                <Icons.More size={16} />
                                </button>
                                {openActionMenuId === staff.id && (
                                    <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden text-left">
                                        <button 
                                            onClick={() => handleStaffAction(staff.id, 'toggle')}
                                            className="w-full px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 block"
                                        >
                                            {staff.status === 'Active' ? 'Set Break' : 'Set Active'}
                                        </button>
                                        <button className="w-full px-4 py-2 hover:bg-gray-50 text-xs text-gray-700 block">Edit Details</button>
                                        <button 
                                            onClick={() => handleStaffAction(staff.id, 'delete')}
                                            className="w-full px-4 py-2 hover:bg-red-50 text-xs text-red-600 block"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>

       {/* Quick Reassign Widget */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-xl p-6 text-white shadow-lg transition-all duration-300 ${codeRedActive ? 'bg-red-600 scale-[1.02]' : 'bg-gradient-to-r from-orange-500 to-pink-600'}`}>
             <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
               <Icons.Zap size={20} /> {codeRedActive ? 'CODE RED ACTIVE' : 'Urgency Override'}
             </h3>
             <p className="text-orange-100 text-sm mb-4">
                 {codeRedActive ? 'System running at maximum capacity. Normal operations suspended.' : 'Automatically reassign all available staff to high-load counters for 30 minutes.'}
             </p>
             <button 
                onClick={toggleCodeRed}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
             >
                {codeRedActive ? 'Deactivate Code Red' : "Activate 'Code Red'"}
             </button>
          </div>
          <div 
             onClick={() => setShowShiftDetails(!showShiftDetails)}
             className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors relative"
           >
             <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-800 mb-2">Shift Schedule</h3>
                    <p className="text-gray-500 text-sm mb-4">Morning Shift ends in 2 hours. Afternoon team is on standby.</p>
                </div>
                {showShiftDetails && <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">EXPANDED</span>}
             </div>
             
             {showShiftDetails ? (
                 <div className="space-y-2 border-t pt-3 mt-1 text-sm animate-fade-in">
                     <div className="flex justify-between"><span>Morning (Active)</span> <span className="font-bold">08:00 - 14:00</span></div>
                     <div className="flex justify-between text-gray-500"><span>Afternoon</span> <span>14:00 - 20:00</span></div>
                     <div className="flex justify-between text-gray-500"><span>Night</span> <span>20:00 - 02:00</span></div>
                 </div>
             ) : (
                <div className="flex -space-x-2 overflow-hidden">
                    {[1,2,3,4].map(i => (
                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-300 flex items-center justify-center text-xs text-white font-bold">
                        S{i}
                    </div>
                    ))}
                    <div className="h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-bold">+8</div>
                </div>
             )}
          </div>
       </div>

       {/* Add Staff Modal */}
       {isAddStaffOpen && (
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in-up">
                   <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Staff Member</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                           <input 
                                value={newStaffName}
                                onChange={(e) => setNewStaffName(e.target.value)}
                                type="text" 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                                placeholder="e.g. Amit Sharma"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                           <select 
                                value={newStaffRole}
                                onChange={(e) => setNewStaffRole(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg outline-none"
                           >
                               <option>Clerk</option>
                               <option>Senior Clerk</option>
                               <option>Manager</option>
                               <option>Security</option>
                               <option>Trainee</option>
                           </select>
                       </div>
                       <div className="flex gap-3 pt-2">
                           <button 
                                onClick={handleAddStaff}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700"
                            >
                               Add Staff
                           </button>
                           <button 
                                onClick={() => setIsAddStaffOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                            >
                               Cancel
                           </button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Footfall vs Wait Time</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <ComposedChart data={WEEKLY_PERFORMANCE}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="footfall" fill="#6366f1" radius={[4, 4, 0, 0]} name="Visitors" />
                      <Line yAxisId="right" type="monotone" dataKey="avgWait" stroke="#ef4444" strokeWidth={2} name="Avg Wait (min)" />
                   </ComposedChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Satisfaction Index</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="80%" data={SATISFACTION_METRICS}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="A" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.5} />
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                   </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>
       </div>

       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Peak Hour Heatmap (Last 30 Days)</h3>
          <div className="grid grid-cols-12 gap-1 text-center text-xs text-gray-500 mb-1">
             <div className="col-span-1"></div>
             {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM'].map(h => (
                <div key={h} className="col-span-1">{h}</div>
             ))}
          </div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
             <div key={day} className="grid grid-cols-12 gap-1 mb-1 items-center">
                <div className="col-span-1 text-xs font-bold text-gray-500">{day}</div>
                {Array.from({ length: 11 }).map((_, i) => {
                   const intensity = Math.random();
                   const bgClass = intensity > 0.8 ? 'bg-red-500' : intensity > 0.6 ? 'bg-orange-400' : intensity > 0.4 ? 'bg-yellow-300' : 'bg-green-200';
                   return <div key={i} className={`h-8 rounded ${bgClass} hover:opacity-80 transition-opacity cursor-help`} title={`Traffic: ${Math.floor(intensity * 100)}%`}></div>
                })}
             </div>
          ))}
       </div>
    </div>
  );

  const renderAIConfig = () => (
      <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Strategy Configuration</h2>
              <p className="text-gray-500 mb-8">Configure how Pankti's AI orchestrates your queues and staff resources.</p>

              <div className="space-y-8">
                  {/* Parameter 1 */}
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="font-semibold text-gray-700">Auto-Reallocation Threshold</label>
                          <span className="text-indigo-600 font-bold">{aiConfig.reallocationThreshold} mins</span>
                      </div>
                      <input 
                        type="range" min="15" max="120" 
                        value={aiConfig.reallocationThreshold}
                        onChange={(e) => setAiConfig({...aiConfig, reallocationThreshold: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Wait time required before AI suggests moving staff.</p>
                  </div>

                  {/* Parameter 2 */}
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="font-semibold text-gray-700">Max Tolerable Wait Limit</label>
                          <span className="text-indigo-600 font-bold">{aiConfig.maxWaitLimit} mins</span>
                      </div>
                      <input 
                        type="range" min="10" max="90" 
                        value={aiConfig.maxWaitLimit}
                        onChange={(e) => setAiConfig({...aiConfig, maxWaitLimit: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">If exceeded, 'Code Red' suggestions will be prioritized.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                              <div className="font-semibold text-gray-700">Auto-Response Mode</div>
                              <div className="text-xs text-gray-500">Allow AI to auto-pause queues</div>
                          </div>
                          <button 
                            onClick={() => setAiConfig({...aiConfig, autoResponse: !aiConfig.autoResponse})}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${aiConfig.autoResponse ? 'bg-indigo-600' : 'bg-gray-300'}`}
                          >
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${aiConfig.autoResponse ? 'translate-x-6' : ''}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                              <div className="font-semibold text-gray-700">Risk Tolerance</div>
                              <div className="text-xs text-gray-500">Aggressiveness of predictions</div>
                          </div>
                          <select 
                            value={aiConfig.riskTolerance}
                            onChange={(e) => setAiConfig({...aiConfig, riskTolerance: parseInt(e.target.value)})}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
                          >
                              <option value={25}>Conservative</option>
                              <option value={50}>Balanced</option>
                              <option value={75}>Aggressive</option>
                          </select>
                      </div>
                  </div>

                  <div className="flex justify-end pt-4">
                      <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                          Save Configuration
                      </button>
                  </div>
              </div>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-inter overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 text-slate-300 hidden md:flex flex-col border-r border-slate-800 shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
           <span className="text-xl font-bold tracking-widest text-white flex items-center gap-2">
             <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
               <Icons.Trending className="text-white" size={20} />
             </div>
             PANKTI
           </span>
        </div>
        
        <div className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          
          <div 
            onClick={() => setActiveView('COMMAND_CENTER')}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all cursor-pointer
            ${activeView === 'COMMAND_CENTER' 
               ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-glow' 
               : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Icons.Dashboard size={20} />
            Command Center
          </div>

          <div 
             onClick={() => setActiveView('STAFF')}
             className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all cursor-pointer
             ${activeView === 'STAFF' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-glow' 
                : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Icons.Users size={20} />
            Staff Management
          </div>

          <div 
             onClick={() => setActiveView('ANALYTICS')}
             className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all cursor-pointer
             ${activeView === 'ANALYTICS' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-glow' 
                : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Icons.Trending size={20} />
            Performance Analytics
          </div>

          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8">Configuration</p>
          <div 
            onClick={() => setActiveView('AI_CONFIG')}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-all cursor-pointer
             ${activeView === 'AI_CONFIG' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-glow' 
                : 'hover:bg-slate-800 hover:text-white'}`}
          >
            <Icons.AI size={20} />
            AI Strategy Config
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
           <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">AD</div>
              <div>
                 <p className="text-sm font-semibold text-white">Admin User</p>
                 <p className="text-xs text-slate-400">Head Office • Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
           <div className="flex items-center gap-4">
              <span className="text-gray-400 md:hidden"><Icons.Dashboard /></span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {activeView === 'COMMAND_CENTER' ? 'Operational Dashboard' : 
                   activeView === 'STAFF' ? 'Staff Management' : 
                   activeView === 'ANALYTICS' ? 'Performance Analytics' :
                   'System Configuration'}
                </h1>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${codeRedActive ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  {codeRedActive ? 'SYSTEM ALERT' : 'System Operational'}
                </p>
              </div>
           </div>

           <div className="flex items-center gap-6">
              {activeView === 'COMMAND_CENTER' && (
                 <div className="relative">
                   <select 
                     value={selectedServiceId}
                     onChange={(e) => setSelectedServiceId(e.target.value)}
                     className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent block pl-4 pr-10 py-2.5 shadow-sm min-w-[280px] transition-all"
                   >
                     {services.map(s => (
                       <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                     ))}
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                     <Icons.ChevronRight className="rotate-90" size={16} />
                   </div>
                 </div>
              )}
              <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors">
                 <Icons.Bell size={20} />
                 <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
           </div>
        </header>

        {/* Dashboard Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
          {activeView === 'COMMAND_CENTER' && renderCommandCenter()}
          {activeView === 'STAFF' && renderStaffManagement()}
          {activeView === 'ANALYTICS' && renderAnalytics()}
          {activeView === 'AI_CONFIG' && renderAIConfig()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;