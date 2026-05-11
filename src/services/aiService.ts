/**
 * AI Assistant Service
 *
 * Integrates with OpenAI GPT-4o-mini for real AI responses with
 * function-calling against platform data. Falls back to local
 * intent detection when no API key is configured.
 */

import { getResources } from './resourceService';

/* ---- Helpers ---- */

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getUserLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem('civichub_user_location');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/* ---- Tool Definitions ---- */

interface ToolResult {
  tool: string;
  data: unknown;
  summary: string;
}

function searchResources(query: string): ToolResult {
  const q = query.toLowerCase();

  // Detect type filter
  let type: string | undefined;
  if (q.includes('hospital') || q.includes('medical') || q.includes('emergency room')) type = 'hospital';
  else if (q.includes('pharmacy') || q.includes('medicine') || q.includes('drug')) type = 'pharmacy';
  else if (q.includes('shelter') || q.includes('refuge')) type = 'shelter';
  else if (q.includes('water') || q.includes('drinking')) type = 'water';
  else if (q.includes('fuel') || q.includes('gas') || q.includes('petrol')) type = 'fuel';

  const wantOpen = q.includes('open') || q.includes('available') || q.includes('nearest');

  let resources = getResources({ type });
  if (wantOpen) {
    resources = resources.filter((r) => r.status === 'open');
  }

  // Sort by distance from user
  const userLoc = getUserLocation();
  if (userLoc) {
    resources = resources.map((r) => ({
      ...r,
      _distance: haversine(userLoc.lat, userLoc.lng, r.lat, r.lng),
    })).sort((a: any, b: any) => a._distance - b._distance);
  }

  if (resources.length === 0) {
    return {
      tool: 'search_resources',
      data: [],
      summary: `I searched for ${type || 'resources'} but couldn't find any matching results. Try broadening your search.`,
    };
  }

  const top5 = resources.slice(0, 5);
  const list = top5
    .map((r: any, i) => {
      const dist = r._distance ? ` (${r._distance.toFixed(1)} km away)` : '';
      return `${i + 1}. **[${r.name}](/emergency-map?highlight=${encodeURIComponent(r.id)})**${dist} — ${r.status.toUpperCase()}\n   📍 ${r.address}\n   📞 ${r.phone}\n   🕐 ${r.hours}`;
    })
    .join('\n\n');

  return {
    tool: 'search_resources',
    data: top5,
    summary: `I found **${resources.length}** ${type || 'resource'}${resources.length > 1 ? 's' : ''} near you:\n\n${list}\n\n💡 *Click any name above to view it on the map, or browse all on the [Emergency Map](/emergency-map).*`,
  };
}

function searchReports(_query: string): ToolResult {
  // Reports are now async — for the simulated fallback, return a guide
  return {
    tool: 'search_reports',
    data: [],
    summary: `To search community reports, visit the [Reports Dashboard](/reports). You can filter by category (roads, lighting, water leaks, garbage, hazards) and status.\n\n📋 *All reports are reviewed and confirmed by our admin team before being published.*`,
  };
}

function searchLostFound(_query: string): ToolResult {
  return {
    tool: 'search_lost_found',
    data: [],
    summary: `To search lost and found items, visit the [Lost & Found](/lost-found) page. You can filter by type (lost/found), category, and search by description.\n\n🔍 *All posts are reviewed by our admin team before being published.*`,
  };
}

function searchItems(_query: string): ToolResult {
  return {
    tool: 'search_items',
    data: [],
    summary: `To browse items available to borrow, visit the [Community Sharing](/sharing) page. You can filter by category and availability.\n\n📦 *All shared items are verified by our admin team.*`,
  };
}

function searchAccessibility(_query: string): ToolResult {
  return {
    tool: 'search_accessibility',
    data: {},
    summary: `For accessibility information, visit the [Accessibility](/accessibility) page where you can:\n\n♿ Find wheelchair-friendly routes\n🗺️ View accessibility points (ramps, elevators, restrooms)\n⚠️ Check reported obstacles\n🧭 Use the route finder for both wheelchair and standard navigation\n\n*All accessibility data is community-verified.*`,
  };
}

/* ---- Intent Detection ---- */

type Intent =
  | 'search_resources'
  | 'search_reports'
  | 'search_lost_found'
  | 'search_items'
  | 'create_report'
  | 'find_route'
  | 'general'
  | 'greeting';

function detectIntent(message: string): Intent {
  const q = message.toLowerCase();

  if (/^(hi|hello|hey|good morning|good evening|assalam|marhaba|salam)/i.test(q)) {
    return 'greeting';
  }

  if (
    q.includes('nearest') || q.includes('nearby') || q.includes('find') ||
    q.includes('hospital') || q.includes('pharmacy') || q.includes('shelter') ||
    q.includes('water station') || q.includes('fuel') || q.includes('gas station') ||
    q.includes('where is') || q.includes('where can i find')
  ) {
    return 'search_resources';
  }

  if (
    q.includes('report') || q.includes('pothole') || q.includes('broken') ||
    q.includes('leak') || q.includes('garbage') || q.includes('hazard') ||
    q.includes('issue') || q.includes('problem') || q.includes('complaint')
  ) {
    if (q.includes('create') || q.includes('submit') || q.includes('new') || q.includes('there is') || q.includes('there\'s')) {
      return 'create_report';
    }
    return 'search_reports';
  }

  if (
    q.includes('lost') || q.includes('found') || q.includes('missing') ||
    q.includes('wallet') || q.includes('keys') || q.includes('phone') ||
    q.includes('pet') || q.includes('dog') || q.includes('cat') ||
    q.includes('backpack') || q.includes('bag') || q.includes('passport')
  ) {
    return 'search_lost_found';
  }

  if (
    q.includes('borrow') || q.includes('lend') || q.includes('share') ||
    q.includes('rent') || q.includes('tool') || q.includes('drill') ||
    q.includes('projector') || q.includes('tent') || q.includes('available item')
  ) {
    return 'search_items';
  }

  if (
    q.includes('wheelchair') || q.includes('accessible') || q.includes('ramp') ||
    q.includes('elevator') || q.includes('disability') || q.includes('route') ||
    q.includes('accessibility')
  ) {
    return 'find_route';
  }

  return 'general';
}

/* ---- Main Processor (simulated) ---- */

export interface AIResponse {
  content: string;
  toolUsed?: string;
  data?: unknown;
}

export function processMessage(message: string): AIResponse {
  const intent = detectIntent(message);

  switch (intent) {
    case 'greeting':
      return {
        content:
          "Hello! 👋 I'm your CivicHub AI Assistant. I can help you with:\n\n" +
          '🗺️ **Find resources** — hospitals, pharmacies, shelters nearby\n' +
          '📝 **Search reports** — community issues and their status\n' +
          '🔍 **Lost & Found** — search for or post lost/found items\n' +
          '♿ **Accessibility** — find wheelchair-friendly routes\n' +
          '📦 **Community sharing** — items available to borrow\n\n' +
          'What would you like help with today?',
      };

    case 'search_resources': {
      const result = searchResources(message);
      return { content: result.summary, toolUsed: result.tool, data: result.data };
    }

    case 'search_reports': {
      const result = searchReports(message);
      return { content: result.summary, toolUsed: result.tool, data: result.data };
    }

    case 'search_lost_found': {
      const result = searchLostFound(message);
      return { content: result.summary, toolUsed: result.tool, data: result.data };
    }

    case 'create_report':
      return {
        content:
          "I can help you report that issue! Here's what to do:\n\n" +
          '1. Go to the [Reports page](/reports)\n' +
          '2. Click **"+ New Report"**\n' +
          '3. Fill in the details (category, description, location, photos)\n' +
          '4. Submit!\n\n' +
          '📋 Your report will be reviewed by our admin team before being published. ' +
          "Would you like me to search for similar existing reports first?",
        toolUsed: 'create_report_guide',
      };

    case 'search_items': {
      const itemResult = searchItems(message);
      return { content: itemResult.summary, toolUsed: itemResult.tool, data: itemResult.data };
    }

    case 'find_route': {
      const accResult = searchAccessibility(message);
      return { content: accResult.summary, toolUsed: accResult.tool, data: accResult.data };
    }

    default:
      return {
        content:
          "I'm not sure I understood that completely. Here are some things I can help with:\n\n" +
          '- **"Find nearest open pharmacy"** → searches emergency resources\n' +
          '- **"Any water leak reports near me?"** → searches community reports\n' +
          '- **"Has anyone found a black wallet?"** → searches lost & found\n' +
          '- **"Wheelchair route to City Hall"** → accessibility navigation\n\n' +
          'Try one of these, or describe what you need!',
      };
  }
}

/* ---- OpenAI Integration ---- */

const openaiApiKey = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_OPENAI_API_KEY as string | undefined
  : undefined;

export const isOpenAIConfigured = Boolean(openaiApiKey && openaiApiKey.startsWith('sk-'));

// Tool definitions for OpenAI function calling
const openAITools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_resources',
      description: 'Search emergency resources like hospitals, pharmacies, shelters, water points, and fuel stations. Returns results sorted by distance from the user.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query describing what resource the user needs' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_reports',
      description: 'Search community issue reports like road problems, lighting issues, water leaks, garbage, and hazards',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query for reports' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_lost_found',
      description: 'Search lost and found items posted by the community',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Description of the lost or found item' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_items',
      description: 'Search community sharing items available to borrow (tools, electronics, sports equipment, etc.)',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The item to search for' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_accessibility',
      description: 'Search accessibility points, wheelchair ramps, elevators, and report obstacles',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Accessibility-related query' },
        },
        required: ['query'],
      },
    },
  },
];

// Execute a tool call from OpenAI
function executeTool(name: string, args: Record<string, string>): ToolResult {
  switch (name) {
    case 'search_resources': return searchResources(args.query || '');
    case 'search_reports': return searchReports(args.query || '');
    case 'search_lost_found': return searchLostFound(args.query || '');
    case 'search_items': return searchItems(args.query || '');
    case 'search_accessibility': return searchAccessibility(args.query || '');
    default: return { tool: name, data: null, summary: 'Unknown tool' };
  }
}

const SYSTEM_PROMPT = `You are CivicHub AI Assistant, a helpful community platform assistant.
You help users with:
- Finding emergency resources (hospitals, pharmacies, shelters, water, fuel)
- Searching community reports (road issues, lighting, water leaks, garbage, hazards)
- Lost & Found items
- Community sharing / borrowing items
- Accessibility points and wheelchair-friendly routes

IMPORTANT RULES:
- When showing resources, format each name as a clickable link: [Resource Name](/emergency-map?highlight=RESOURCE_ID)
- Sort resources by distance from the user (nearest first)
- Be concise, friendly, and use markdown formatting
- When you call tools, summarize the results in a helpful way
- If the user greets you, introduce yourself and list your capabilities
- Always be encouraging and community-minded
- Mention that user-submitted content is reviewed by admins before being published`;

export async function processMessageWithAI(
  message: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<AIResponse> {
  // Fallback to simulated mode when no API key
  if (!isOpenAIConfigured) {
    return processMessage(message);
  }

  try {
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...conversationHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools: openAITools,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenAI] Error:', errorData);
      return processMessage(message);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice) return processMessage(message);

    // Handle tool calls
    if (choice.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const toolResult = executeTool(toolCall.function.name, args);

      // Send tool result back for a final answer
      const followUpMessages = [
        ...messages,
        choice.message,
        {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify({ tool: toolResult.tool, summary: toolResult.summary, data: toolResult.data }),
        },
      ];

      const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: followUpMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (followUpResponse.ok) {
        const followUpData = await followUpResponse.json();
        const finalContent = followUpData.choices?.[0]?.message?.content || toolResult.summary;
        return {
          content: finalContent,
          toolUsed: toolResult.tool,
          data: toolResult.data,
        };
      }

      return {
        content: toolResult.summary,
        toolUsed: toolResult.tool,
        data: toolResult.data,
      };
    }

    // Direct text response (no tool call)
    return {
      content: choice.message?.content || "I'm sorry, I couldn't process that. Could you try rephrasing?",
    };
  } catch (error) {
    console.error('[OpenAI] Fetch error:', error);
    return processMessage(message);
  }
}
