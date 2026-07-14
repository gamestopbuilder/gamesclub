const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { createGame, applyAction, resolveTimeout } = require('./game/splendor');

const TIMER_OPTIONS_MS = [30000, 60000, 90000, 120000];
const DEFAULT_TIMER_MS = 60000;

const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve the built client (client/dist) in production. In local dev the
// client runs separately under `vite` and this directory won't exist, so
// we skip wiring it up rather than crash on missing files.
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = http.createServer(app);

// WebSocket server — all real-time game traffic flows through here
const wss = new WebSocketServer({ server, path: '/ws' });

// In-memory store (no database for MVP)
// rooms: Map<roomId, { players: Map<playerId, ws>, names: Map<playerId, name>, state: object }>
const rooms = new Map();

function broadcast(room, message) {
  const payload = JSON.stringify(message);
  room.players.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
}

// ── Turn timer ─────────────────────────────────────────────────
// The Node timer handle lives on the room object (not on `state`, which is
// broadcast to clients as JSON) and is rescheduled after every turn change.

function clearTimer(room) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
}

function scheduleTimer(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.state) return;
  clearTimer(room);
  if (room.state.phase !== 'playing') return;
  const duration = room.state.turnDurationMs || DEFAULT_TIMER_MS;
  room.state.turnDeadline = Date.now() + duration;
  room.timerHandle = setTimeout(() => handleTimeout(roomId), duration);
}

// After any turn advance, auto-pass through players who've already hit
// 3 consecutive timeouts so the game never waits on someone permanently gone.
function fastForwardSkipped(state) {
  let guard = 0;
  while (state.phase === 'playing' && state.players[state.currentPlayerIndex].skipped) {
    resolveTimeout(state);
    guard += 1;
    if (guard > state.players.length + 1) {
      // Safety net: every player has been skipped — end the game rather than loop forever.
      state.phase = 'ended';
      state.winner = state.players.reduce((best, p) => (p.score > best.score ? p : best)).id;
      break;
    }
  }
}

function handleTimeout(roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.state || room.state.phase !== 'playing') return;
  resolveTimeout(room.state);
  fastForwardSkipped(room.state);
  scheduleTimer(roomId);
  broadcast(room, { type: 'game_state', state: room.state });
}

wss.on('connection', (ws) => {
  let playerId = uuidv4(); // reassigned on a successful rejoin_room, reclaiming a prior identity
  let currentRoom = null;

  console.log(`Player connected: ${playerId}`);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    const { type, payload } = msg;

    switch (type) {
      case 'create_room': {
        const roomId   = uuidv4().slice(0, 6).toUpperCase();
        const hostName = (payload?.name || '').trim() || `Player-${playerId.slice(0, 4)}`;
        const room     = {
          players: new Map([[playerId, ws]]),
          names:   new Map([[playerId, hostName]]),
          state:   {},
          hostId:  playerId,
          turnDurationMs: DEFAULT_TIMER_MS,
          timerHandle: null,
        };
        rooms.set(roomId, room);
        currentRoom = roomId;
        ws.send(JSON.stringify({
          type: 'room_created', roomId, playerId, name: hostName,
          turnDurationMs: room.turnDurationMs,
        }));
        break;
      }

      case 'join_room': {
        const { roomId } = payload;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
          break;
        }
        if (room.state && room.state.phase) {
          ws.send(JSON.stringify({ type: 'error', message: 'This game has already started' }));
          break;
        }
        const joinerName    = (payload?.name || '').trim() || `Player-${playerId.slice(0, 4)}`;
        const existingPlayers = [...room.names.keys()];
        room.players.set(playerId, ws);
        room.names.set(playerId, joinerName);
        currentRoom = roomId;
        // Send joiner the full player list + all known names
        ws.send(JSON.stringify({
          type: 'room_joined',
          roomId,
          playerId,
          players: [...existingPlayers, playerId],
          names:   Object.fromEntries(room.names),
          turnDurationMs: room.turnDurationMs,
        }));
        // Notify existing players about the new joiner (include their name)
        existingPlayers.forEach((pid) => {
          const client = room.players.get(pid);
          if (client && client.readyState === client.OPEN) {
            client.send(JSON.stringify({ type: 'player_joined', playerId, name: joinerName }));
          }
        });
        break;
      }

      case 'set_timer': {
        const room = rooms.get(currentRoom);
        if (!room) break;
        if (playerId !== room.hostId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Only the host can set the turn timer' }));
          break;
        }
        const durationMs = payload?.durationMs;
        if (!TIMER_OPTIONS_MS.includes(durationMs)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid timer duration' }));
          break;
        }
        room.turnDurationMs = durationMs;
        broadcast(room, { type: 'timer_set', durationMs });
        break;
      }

      case 'start_game': {
        const room = rooms.get(currentRoom);
        if (!room) break;
        if (room.players.size < 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Need at least 2 players to start' }));
          break;
        }
        const playerIds   = [...room.names.keys()];
        const playerNames = Object.fromEntries(room.names);
        room.state = createGame(playerIds, playerNames, room.turnDurationMs);
        scheduleTimer(currentRoom);
        broadcast(room, { type: 'game_started', state: room.state });
        console.log(`Game started in room ${currentRoom} with ${playerIds.length} players`);
        break;
      }

      case 'game_action': {
        const room = rooms.get(currentRoom);
        if (!room || !room.state) {
          ws.send(JSON.stringify({ type: 'error', message: 'No active game in this room' }));
          break;
        }
        const result = applyAction(room.state, playerId, payload);
        if (result.error) {
          ws.send(JSON.stringify({ type: 'error', message: result.error }));
        } else {
          fastForwardSkipped(room.state);
          scheduleTimer(currentRoom);
          broadcast(room, { type: 'game_state', state: room.state });
        }
        break;
      }

      // Reclaim a prior seat after a dropped connection or page reload —
      // the client presents the roomId/playerId it had before disconnecting.
      case 'rejoin_room': {
        const { roomId, playerId: oldPlayerId } = payload || {};
        const room = rooms.get(roomId);
        if (!room || !oldPlayerId || !room.names.has(oldPlayerId)) {
          ws.send(JSON.stringify({ type: 'rejoin_failed', message: 'That session is no longer valid' }));
          break;
        }
        playerId = oldPlayerId;
        room.players.set(playerId, ws);
        currentRoom = roomId;
        ws.send(JSON.stringify({
          type: 'rejoined',
          roomId,
          playerId,
          isHost: playerId === room.hostId,
          players: [...room.names.keys()],
          names: Object.fromEntries(room.names),
          turnDurationMs: room.turnDurationMs,
          state: (room.state && room.state.phase) ? room.state : null,
        }));
        room.players.forEach((client, pid) => {
          if (pid !== playerId && client.readyState === client.OPEN) {
            client.send(JSON.stringify({ type: 'player_reconnected', playerId }));
          }
        });
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${type}` }));
    }
  });

  ws.on('close', () => {
    console.log(`Player disconnected: ${playerId}`);
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      // Only clean up if this socket is still the one on record for playerId —
      // a stale close firing after a reconnect must not evict the new connection.
      if (room && room.players.get(playerId) === ws) {
        room.players.delete(playerId);
        broadcast(room, { type: 'player_left', playerId });
        if (room.players.size === 0) {
          clearTimer(room);
          rooms.delete(currentRoom);
          console.log(`Room ${currentRoom} closed (empty)`);
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Gamesclub server running on http://localhost:${PORT}`);
});
