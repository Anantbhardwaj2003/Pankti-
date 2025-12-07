import { GoogleGenAI, Type } from "@google/genai";
import { Service, ServiceType, GeminiWaitEstimate, NearbyServiceResult, QueueActionRecommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartWaitTimeEstimate = async (
  service: Service,
  positionInQueue: number
): Promise<GeminiWaitEstimate> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Simulate current time context for the AI
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
    const dayString = now.toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' });

    const prompt = `
      You are an AI queue management assistant optimized for the Indian context (Pankti - पंक्ति). 
      Analyze the following context and estimate the wait time.
      
      Context:
      - Service Type: ${service.type}
      - Service Name: ${service.name} (Location: ${service.location})
      - Current Time (IST): ${dayString}, ${timeString}
      - Users ahead in queue: ${positionInQueue}
      - Historical Average Wait per Person: ${service.averageWaitTimeMins} minutes
      
      Considerations for India:
      - High crowd density in RTOs, Banks (SBI), and Temples.
      - Lunch breaks usually 1:00 PM - 2:00 PM where movement stops.
      - "Indian Stretchable Time": Queues often move slower than theoretical limits due to documentation issues or manual processes.
      
      Tasks:
      1. Estimate the realistic wait time in minutes.
      2. Provide a short, culturally relevant reasoning (e.g., "Lunch hour rush", "Server down at RTO", "Morning Darshan rush").
      3. Assess crowd level.

      Return JSON.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedMinutes: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            crowdLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] }
          },
          required: ['estimatedMinutes', 'reasoning', 'crowdLevel']
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text) as GeminiWaitEstimate;
      return result;
    }
    
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini AI Error:", error);
    // Fallback if AI fails or no key
    return {
      estimatedMinutes: positionInQueue * service.averageWaitTimeMins,
      reasoning: "Standard estimation (AI unavailable)",
      crowdLevel: "Medium"
    };
  }
};

export const getAdminInsights = async (services: Service[]): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const serviceSummary = services.map(s => 
      `${s.name} (${s.type}): ${s.waitingCount} waiting, ${s.averageWaitTimeMins}m avg/person.`
    ).join('\n');

    const prompt = `
      You are a facility manager for public services in India using the Pankti (पंक्ति) system. Analyze the current status of these queues:
      ${serviceSummary}

      Give 3 bullet points of actionable advice to improve efficiency or crowd flow right now.
      Focus on managing high crowd density, chaotic lines, and staff allocation.
      Keep it concise and professional.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "No insights available at the moment.";
  } catch (error) {
    return "Unable to generate insights at this time.";
  }
}

export const getQueueRecommendation = async (targetService: Service, allServices: Service[]): Promise<QueueActionRecommendation> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const totalBacklogMinutes = targetService.waitingCount * targetService.averageWaitTimeMins;
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

    // Identify idle services to potentially borrow staff from
    const idleServices = allServices.filter(s => s.id !== targetService.id && s.isOpen && s.waitingCount === 0);
    const idleServiceNames = idleServices.map(s => s.name).join(", ");

    const prompt = `
      You are an Operational AI Manager (Pankti Core) for ${targetService.name} (Type: ${targetService.type}).
      
      TARGET SERVICE STATUS:
      - Waiting: ${targetService.waitingCount} people
      - Avg Handling Time: ${targetService.averageWaitTimeMins} mins/person
      - Estimated Backlog: ${totalBacklogMinutes} minutes
      - Status: ${targetService.isOpen ? 'OPEN' : 'CLOSED'}
      - Current Time: ${timeString}

      GLOBAL CONTEXT (Other Branches):
      - Idle Services (0 waiting): ${idleServiceNames || "None"}

      Determine the SINGLE most effective immediate "Next Move".
      
      LOGIC RULES:
      1. **Reallocation**: If target backlog > 60 mins AND there are idle services, suggest "Staff Reallocation" from an idle service.
      2. **Overload**: If backlog > 120 mins (no idle staff), suggest "Prioritize & Streamline" (open express lane).
      3. **Crowd Control**: If waiting > 30 people, suggest "Leverage Pankti" for digital diversion.
      4. **Efficiency**: If waiting < 5, suggest "Back-office Optimization".
      
      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            actionTitle: { type: Type.STRING },
            actionDescription: { type: Type.STRING },
            priority: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
            suggestedActionType: { type: Type.STRING, enum: ['ALLOCATE_STAFF', 'PAUSE_QUEUE', 'SPEED_UP', 'COMMUNICATE_DELAY', 'NORMAL'] }
          },
          required: ['actionTitle', 'actionDescription', 'priority', 'suggestedActionType']
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QueueActionRecommendation;
    }
    throw new Error("No response");
  } catch (error) {
    return {
      actionTitle: "Monitor Queue",
      actionDescription: "Continue monitoring the queue flow. No urgent actions detected.",
      priority: "Low",
      suggestedActionType: "NORMAL"
    };
  }
};

export const findNearbyServices = async (lat: number, lng: number): Promise<NearbyServiceResult> => {
  try {
    // We use gemini-2.5-flash for tools support
    const model = 'gemini-2.5-flash';

    const prompt = `
      Find exactly 6 popular public service locations near latitude ${lat}, longitude ${lng}.
      Prioritize: Hospitals, Major Banks (SBI, HDFC), RTO Offices, and Famous Temples/Mosques/Churches.
      
      Output a strict JSON array of objects. Do not use Markdown code blocks.
      Each object must have:
      - name: The name of the place
      - type: One of ["Hospital", "Bank", "RTO", "Temple", "Government", "Other"]
      - location: The locality or address
      
      Example: [{"name": "Apollo Hospital", "type": "Hospital", "location": "Bannerghatta Road"}, ...]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });

    // Parse the JSON from the text. 
    // The model might return explanatory text, so we try to find the array.
    const text = response.text || "";
    let services: any[] = [];
    
    // Attempt to extract JSON array
    const jsonMatch = text.match(/\[.*\]/s);
    if (jsonMatch) {
      services = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback parsing or empty
      console.warn("Could not parse JSON from Gemini maps response", text);
    }

    // Convert to Q-Flow Service Objects with simulated queue data
    const mappedServices: Service[] = services.map((s, index) => {
      // Map string type to Enum
      let type = ServiceType.OTHER;
      if (s.type.includes('Hospital')) type = ServiceType.HOSPITAL;
      else if (s.type.includes('Bank')) type = ServiceType.BANK;
      else if (s.type.includes('RTO')) type = ServiceType.RTO;
      else if (s.type.includes('Temple')) type = ServiceType.TEMPLE;
      else if (s.type.includes('Gov')) type = ServiceType.GOVERNMENT;

      // Simulate Queue Data for this "Real" place
      const isBusy = Math.random() > 0.3;
      return {
        id: `real-${index}-${Date.now()}`,
        name: s.name,
        type: type,
        location: s.location,
        isOpen: true,
        currentTicketNumber: Math.floor(Math.random() * 200) + 1,
        waitingCount: isBusy ? Math.floor(Math.random() * 40) + 5 : Math.floor(Math.random() * 5),
        averageWaitTimeMins: Math.floor(Math.random() * 20) + 5,
        smsEnabled: Math.random() > 0.5,
        whatsappEnabled: Math.random() > 0.5
      };
    });

    return {
      services: mappedServices,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };

  } catch (error) {
    console.error("Error finding nearby services:", error);
    return { services: [], groundingChunks: [] };
  }
};