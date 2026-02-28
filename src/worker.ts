import { GameRoom } from './durable-object';

export { GameRoom };

export interface Env {
  TICTACTOE_GAME: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /api/room/:code - Get room status
    if (url.pathname.startsWith('/api/room/')) {
      const roomCode = url.pathname.split('/').pop()!;
      const id = env.TICTACTOE_GAME.idFromName(roomCode);
      const room = env.TICTACTOE_GAME.get(id);
      return room.fetch(request);
    }

    // WebSocket endpoint
    if (url.pathname === "/websocket") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket", { status: 400 });
      }

      const roomCode = url.searchParams.get("room");
      if (!roomCode) {
        return new Response("Room code required", { status: 400 });
      }

      const id = env.TICTACTOE_GAME.idFromName(roomCode);
      const room = env.TICTACTOE_GAME.get(id);

      return room.fetch(request);
    }

    // Default response
    return new Response(JSON.stringify({
      message: 'Family Gaming Platform API',
      version: '1.0.0'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  },
};
