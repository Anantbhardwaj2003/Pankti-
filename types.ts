export enum ServiceType {
  HOSPITAL = 'Hospital',
  BANK = 'Bank',
  GOVERNMENT = 'Government',
  RESTAURANT = 'Restaurant',
  TEMPLE = 'Temple',
  RTO = 'RTO',
  AADHAAR = 'Aadhaar',
  OTHER = 'Other'
}

export enum QueueStatus {
  WAITING = 'WAITING',
  SERVING = 'SERVING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED'
}

export type Language = 'en' | 'hi' | 'kn' | 'ta';

export interface Service {
  id: string;
  name: string;
  type: ServiceType;
  location: string;
  isOpen: boolean;
  currentTicketNumber: number;
  waitingCount: number;
  averageWaitTimeMins: number; // Base average
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  mapsUrl?: string; // For real google maps links
}

export interface QueueTicket {
  id: string;
  serviceId: string;
  ticketNumber: number;
  status: QueueStatus;
  joinedAt: number; // Timestamp
  estimatedWaitTime: number; // Minutes
  aiAnalysis?: string; // AI generated text
}

export interface GeminiWaitEstimate {
  estimatedMinutes: number;
  reasoning: string;
  crowdLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface NearbyServiceResult {
  services: Service[];
  groundingChunks: any[];
}

export interface QueueActionRecommendation {
  actionTitle: string;
  actionDescription: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  suggestedActionType: 'ALLOCATE_STAFF' | 'PAUSE_QUEUE' | 'SPEED_UP' | 'COMMUNICATE_DELAY' | 'NORMAL';
  relatedServiceId?: string; // ID of another service involved (e.g. borrow staff from here)
}