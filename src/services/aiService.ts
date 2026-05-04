/**
 * AI Assistant Service
 *
 * Simulates GPT-4o tool-calling by parsing user intent and invoking
 * the same service functions the UI uses. When a real OpenAI key is
 * connected, this layer will be replaced by Vercel AI SDK with
 * function-calling against these same tools.
 */

import { getResources } from './resourceService';
import { getReports } from './reportService';
import { getLostFoundPosts, findMatches } from './lostFoundService';
import { getSharedItems } from './sharingService';
import { getAccessibilityPoints, getObstacles } from './accessibilityService';
import type { Resource, Report, LostFoundPost } from '../types';

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

  // Detect status filter
  const wantOpen = q.includes('open') || q.includes('available') || q.includes('nearest');

  let resources = getResources({ type });
  if (wantOpen) {
    resources = resources.filter((r) => r.status === 'open');
  }

  if (resources.length === 0) {
    return {
      tool: 'search_resources',
      data: [],
      summary: `I searched for ${type || 'resources'} but couldn't find any matching results. Try broadening your search.`,
    };
  }

  const list = resources
    .slice(0, 5)
    .map(
      (r, i) =>
        `${i + 1}. **${r.name}** — ${r.status.toUpperCase()}\n   📍 ${r.address}\n   📞 ${r.phone}\n   🕐 ${r.hours}`
    )
    .join('\n\n');

  return {
    tool: 'search_resources',
    data: resources.slice(0, 5),
    summary: `I found **${resources.length}** ${type || 'resource'}${resources.length > 1 ? 's' : ''} for you:\n\n${list}\n\n💡 *You can view all of these on the [Emergency Map](/emergency-map).*`,
  };
}

function searchReports(query: string): ToolResult {
  const q = query.toLowerCase();

  let category: string | undefined;
  if (q.includes('road') || q.includes('pothole') || q.includes('street')) category = 'roads';
  else if (q.includes('light') || q.includes('lamp') || q.includes('dark')) category = 'lighting';
  else if (q.includes('water') || q.includes('leak') || q.includes('pipe')) category = 'water_leaks';
  else if (q.includes('garbage') || q.includes('trash') || q.includes('waste')) category = 'garbage';
  else if (q.includes('hazard') || q.includes('danger') || q.includes('wire')) category = 'hazards';

  const reports = getReports({
    category: (category as any) || 'all',
    search: query,
  });

  if (reports.length === 0) {
    return {
      tool: 'search_reports',
      data: [],
      summary: `No reports found matching "${query}". You can [create a new report](/reports) if you'd like to report this issue.`,
    };
  }

  const list = reports
    .slice(0, 4)
    .map(
      (r, i) =>
        `${i + 1}. **${r.title}**\n   📍 ${r.address} · Status: ${r.status} · Urgency: ${r.urgency} · 👍 ${r.votes} votes`
    )
    .join('\n\n');

  return {
    tool: 'search_reports',
    data: reports.slice(0, 4),
    summary: `I found **${reports.length}** related report${reports.length > 1 ? 's' : ''}:\n\n${list}\n\n📋 *View all reports on the [Reports Dashboard](/reports).*`,
  };
}

function searchLostFound(query: string): ToolResult {
  const q = query.toLowerCase();

  const isLooking = q.includes('found') || q.includes('anyone found') || q.includes('has anyone');
  const type = isLooking ? 'found' : q.includes('lost') ? 'lost' : 'all';

  const posts = getLostFoundPosts({
    type: type as any,
    search: query,
  });

  if (posts.length === 0) {
    return {
      tool: 'search_lost_found',
      data: [],
      summary: `No matching lost & found posts for "${query}". You can [post your item](/lost-found) to get help from the community.`,
    };
  }

  const list = posts
    .slice(0, 4)
    .map(
      (p, i) =>
        `${i + 1}. **[${p.type.toUpperCase()}]** ${p.title}\n   📍 ${p.location} · ${p.category} · Status: ${p.status} · 👁 ${p.views} views`
    )
    .join('\n\n');

  return {
    tool: 'search_lost_found',
    data: posts.slice(0, 4),
    summary: `I found **${posts.length}** matching post${posts.length > 1 ? 's' : ''}:\n\n${list}\n\n🔍 *Browse all items on the [Lost & Found](/lost-found) page.*`,
  };
}

function searchItems(query: string): ToolResult {
  const q = query.toLowerCase();
  let category: string | undefined;
  if (q.includes('tool') || q.includes('drill') || q.includes('hammer')) category = 'Tools';
  else if (q.includes('electronic') || q.includes('projector') || q.includes('camera')) category = 'Electronics';
  else if (q.includes('kitchen') || q.includes('mixer') || q.includes('blender')) category = 'Kitchen';
  else if (q.includes('sport') || q.includes('tent') || q.includes('yoga') || q.includes('bike')) category = 'Sports';
  else if (q.includes('book') || q.includes('read')) category = 'Books';

  // Extract key nouns for search (strip stop words and punctuation)
  const stopWords = ['can', 'i', 'a', 'an', 'the', 'to', 'borrow', 'lend', 'rent', 'share', 'any', 'is', 'there', 'available', 'me', 'do', 'you', 'have', 'need', 'want', 'looking', 'for', 'find', 'what', 'items', 'are'];
  const keywords = q.replace(/[?!.,;:'"]/g, '').split(/\s+/).filter((w) => !stopWords.includes(w) && w.length > 2).join(' ');

  const items = getSharedItems({ category, search: keywords || undefined, availableOnly: true });

  if (items.length === 0) {
    return {
      tool: 'search_items',
      data: [],
      summary: `No borrowable items found matching "${query}". You can [browse all items](/sharing) or share your own!`,
    };
  }

  const list = items.slice(0, 4).map((item, i) =>
    `${i + 1}. **${item.title}** — ${item.condition}\n   📦 ${item.category} · ${item.deposit > 0 ? `$${item.deposit} deposit` : 'Free'} · ★ ${item.rating.toFixed(1)} · by ${item.userName}`
  ).join('\n\n');

  return {
    tool: 'search_items',
    data: items.slice(0, 4),
    summary: `I found **${items.length}** available item${items.length > 1 ? 's' : ''} to borrow:\n\n${list}\n\n📦 *Browse all on the [Community Sharing](/sharing) page.*`,
  };
}

function searchAccessibility(query: string): ToolResult {
  const points = getAccessibilityPoints();
  const obstacles = getObstacles();

  const pointList = points.slice(0, 3).map((p, i) =>
    `${i + 1}. **${p.name}** — ★ ${p.rating.toFixed(1)}\n   📍 ${p.address} · ${p.features.slice(0, 2).join(', ')}`
  ).join('\n\n');

  const obsCount = obstacles.length;

  return {
    tool: 'search_accessibility',
    data: { points: points.slice(0, 3), obstacleCount: obsCount },
    summary: `Here's what I found for accessibility:\n\n**Top Accessibility Points:**\n${pointList}\n\n⚠️ There are **${obsCount}** reported obstacles in the area.\n\n♿ *Use the [Accessibility page](/accessibility) to find wheelchair-friendly routes with Google Maps and view all points/obstacles on the map.*`,
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

  // Greeting
  if (/^(hi|hello|hey|good morning|good evening|assalam|marhaba|salam)/i.test(q)) {
    return 'greeting';
  }

  // Resource search
  if (
    q.includes('nearest') || q.includes('nearby') || q.includes('find') ||
    q.includes('hospital') || q.includes('pharmacy') || q.includes('shelter') ||
    q.includes('water station') || q.includes('fuel') || q.includes('gas station') ||
    q.includes('where is') || q.includes('where can i find')
  ) {
    return 'search_resources';
  }

  // Reports
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

  // Lost & Found
  if (
    q.includes('lost') || q.includes('found') || q.includes('missing') ||
    q.includes('wallet') || q.includes('keys') || q.includes('phone') ||
    q.includes('pet') || q.includes('dog') || q.includes('cat') ||
    q.includes('backpack') || q.includes('bag') || q.includes('passport')
  ) {
    return 'search_lost_found';
  }

  // Sharing / Borrowing
  if (
    q.includes('borrow') || q.includes('lend') || q.includes('share') ||
    q.includes('rent') || q.includes('tool') || q.includes('drill') ||
    q.includes('projector') || q.includes('tent') || q.includes('available item')
  ) {
    return 'search_items';
  }

  // Accessibility
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
          'Our AI will automatically classify the urgency and check for duplicate reports. ' +
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
      description: 'Search emergency resources like hospitals, pharmacies, shelters, water points, and fuel stations',
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

Be concise, friendly, and use markdown formatting. When you call tools, summarize the results in a helpful way.
If the user greets you, introduce yourself and list your capabilities.
Always be encouraging and community-minded.`;

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
      // Fallback to simulated mode
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

      // Fallback: just use the tool summary
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
    // Fallback to simulated mode
    return processMessage(message);
  }
}

