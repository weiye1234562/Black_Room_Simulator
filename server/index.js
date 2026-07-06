import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load shikigami data
const shikigamiData = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'shikigami.json'), 'utf-8')
);

// --- Build image index ---
const CARDS_DIR = join(__dirname, '百闻牌卡面图');
const expansions = shikigamiData.expansions || [];

function buildImageIndex() {
  const index = {};
  // Build name→ID lookup for non-numbered directories
  const nameToId = {};
  for (const s of shikigamiData.shikigami) {
    nameToId[s.name] = s.id;
  }

  for (const exp of expansions) {
    const expDir = join(CARDS_DIR, exp.folder);
    if (!existsSync(expDir)) continue;
    const entries = readdirSync(expDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      // Skip meta dirs
      if (['wb', '其他', '异画', '插画', '协战牌'].includes(entry.name)) continue;
      if (entry.name.includes('异画') || entry.name.includes('涂鸦')) continue;

      let id = null;
      // Try numeric prefix first: "001 青行灯"
      const match = entry.name.match(/^(\d+)\s/);
      if (match) {
        id = match[1];
      } else {
        // Try matching by shikigami name
        id = nameToId[entry.name] || null;
      }

      if (!id) continue;

      const files = readdirSync(join(expDir, entry.name))
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
        .sort();
      index[id] = {
        dir: encodeURIComponent(exp.folder) + '/' + encodeURIComponent(entry.name),
        files: files.map(f => encodeURIComponent(f)),
      };
    }
  }
  return index;
}

const imageIndex = buildImageIndex();
console.log(`[BRS] Image index built: ${Object.keys(imageIndex).length} shikigami`);

// Attach image info to shikigami list
const SHIKIGAMI_LIST = shikigamiData.shikigami.map(s => ({
  ...s,
  imageCount: imageIndex[s.id]?.files.length || 0,
  imageDir: imageIndex[s.id]?.dir || null,
  imageFiles: imageIndex[s.id]?.files || [],
}));

const app = express();
app.use(cors());

// Serve card images statically
app.use('/cards', express.static(CARDS_DIR));
// Serve wallpapers
const WALLPAPER_DIR = join(__dirname, '壁纸类图片');
app.use('/wallpapers', express.static(WALLPAPER_DIR));
// Serve client build in production
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // SPA fallback: all non-API routes go to index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io') || req.path.startsWith('/cards') || req.path.startsWith('/wallpapers')) {
      return next();
    }
    res.sendFile(join(CLIENT_DIST, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 10000,
  pingInterval: 5000,
});

// --- Game Constants ---
const PHASES = [
  { id: 1, type: 'ban', count: 3, label: '双方各 Ban 3 个式神' },
  { id: 2, type: 'pick_self', count: 1, label: '双方各为自己选 1 个式神' },
  { id: 3, type: 'pick_opponent', count: 1, label: '双方各为对方选 1 个式神' },
  { id: 4, type: 'ban', count: 3, label: '双方各 Ban 3 个式神' },
  { id: 5, type: 'pick_self', count: 1, label: '双方各为自己选 1 个式神' },
  { id: 6, type: 'pick_opponent', count: 1, label: '双方各为对方选 1 个式神' },
];

const TOTAL_PHASES = PHASES.length;
const PHASE_TIMEOUT = 60; // seconds
const ROOM_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes

// --- In-memory Stores ---
const rooms = new Map();
const roomTimeouts = new Map();

// --- Helper Functions ---
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoomState() {
  return {
    code: '',
    phase: 0,           // 0 = not started, 1-6 = phase number
    phaseStatus: 'waiting', // waiting | selecting | revealed | finished
    players: {
      red: { id: null, name: '', connected: false, confirmed: false, timeout: false },
      blue: { id: null, name: '', connected: false, confirmed: false, timeout: false },
    },
    selections: {
      // { [phaseId]: { red: [...], blue: [...] } }
    },
    bans: [],           // all banned shikigami IDs
    redPicks: [],       // red player's picked shikigami IDs
    bluePicks: [],      // blue player's picked shikigami IDs
    timer: { remaining: PHASE_TIMEOUT, running: false },
    createdAt: Date.now(),
  };
}

// Extract base name: "酒吞童子·忘空" → "酒吞童子", "一目连-灵籁" → "一目连"
function getBaseName(name) {
  const idx = name.search(/[·\-]/);
  return idx > -1 ? name.slice(0, idx) : name;
}

// Check if two shikigami are variants (same base name)
function areVariants(nameA, nameB) {
  return getBaseName(nameA) === getBaseName(nameB);
}

function getAvailablePool(bannedIds, redPicks, bluePicks, sidePicks = []) {
  const excluded = new Set([...bannedIds, ...redPicks, ...bluePicks]);
  // Also exclude variants of already-picked shikigami for this player
  const pickedNames = sidePicks.map(id => {
    const s = SHIKIGAMI_LIST.find(x => x.id === id);
    return s ? getBaseName(s.name) : null;
  }).filter(Boolean);

  return SHIKIGAMI_LIST.filter(s => {
    if (excluded.has(s.id)) return false;
    // Exclude if same base as already picked by this player
    if (pickedNames.includes(getBaseName(s.name))) return false;
    return true;
  });
}

function resetPhaseConfirmations(room) {
  room.players.red.confirmed = false;
  room.players.blue.confirmed = false;
  room.players.red.timeout = false;
  room.players.blue.timeout = false;
}

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // === CREATE ROOM (Referee) ===
  socket.on('create_room', () => {
    const code = generateRoomCode();
    const room = createRoomState();
    room.code = code;
    rooms.set(code, room);

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'referee';

    // Set room expiry
    const timeout = setTimeout(() => {
      rooms.delete(code);
      roomTimeouts.delete(code);
      io.to(code).emit('room_closed', { reason: '房间已超时关闭' });
    }, ROOM_EXPIRE_MS);
    roomTimeouts.set(code, timeout);

    socket.emit('room_created', { code });
    console.log(`[room] Created: ${code}`);

    // Send full room state so referee sees the panel
    emitRoomState(code);
  });

  // === CHECK ROOM (before joining) ===
  socket.on('check_room', ({ code }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: '房间不存在或已过期' });
      return;
    }
    socket.emit('room_info', {
      code: room.code,
      phase: room.phase,
      red: { name: room.players.red.name, taken: !!room.players.red.name },
      blue: { name: room.players.blue.name, taken: !!room.players.blue.name },
    });
  });

  // === JOIN ROOM (Player/Spectator) ===
  socket.on('join_room', ({ code, name, role, side }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: '房间不存在或已过期' });
      return;
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = role;

    if (role === 'player') {
      if (!side || !['red', 'blue'].includes(side)) {
        socket.emit('error', { message: '请选择阵营' });
        return;
      }
      // Allow reconnection: if same name, overwrite old socket
      if (room.players[side].id && room.players[side].id !== socket.id) {
        if (room.players[side].name === name) {
          // Same player reconnecting — allow, update socket ID below
          console.log(`[reconnect] ${name} reconnected as ${side}`);
        } else {
          socket.emit('error', { message: '该阵营已被占用' });
          return;
        }
      }
      room.players[side].id = socket.id;
      room.players[side].name = name;
      room.players[side].connected = true;
      socket.data.side = side;
      socket.emit('joined', { role: 'player', side });
    } else if (role === 'spectator') {
      socket.emit('joined', { role: 'spectator' });
    }

    // Send current room state
    emitRoomState(code);
    console.log(`[join] ${name} (${role}${side ? '/' + side : ''}) -> ${code}`);
  });

  // === RECONNECT ===
  socket.on('reconnect_state', ({ code, role, side }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit('error', { message: '房间已失效' });
      return;
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = role;

    if (role === 'player' && side) {
      socket.data.side = side;
      room.players[side].id = socket.id;
      room.players[side].connected = true;
    }

    socket.emit('state_sync', getPublicState(room, role, side));
    emitRoomState(code);
  });

  // === START MATCH (Referee) ===
  socket.on('start_match', () => {
    const room = getRoom(socket);
    if (!room) return;
    if (room.phase !== 0) return;

    // Validate both players present
    if (!room.players.red.id || !room.players.blue.id) {
      socket.emit('error', { message: '等待双方选手加入' });
      return;
    }

    advanceToPhase(room, 1);
  });

  // === PLAYER SELECT ===
  socket.on('player_select', ({ selectedIds }) => {
    const room = getRoom(socket);
    if (!room || !socket.data.side) return;
    if (room.phaseStatus !== 'selecting') return;

    const side = socket.data.side;
    const phase = PHASES[room.phase - 1];
    const phaseKey = `phase_${room.phase}`;

    if (!room.selections[phaseKey]) {
      room.selections[phaseKey] = { red: [], blue: [] };
    }

    // Validate count
    if (selectedIds.length > phase.count) {
      socket.emit('error', { message: `本阶段最多选择 ${phase.count} 个式神` });
      return;
    }

    // Validate not banned/not already picked (for pick phases)
    if (phase.type === 'pick_self' || phase.type === 'pick_opponent') {
      // Determine which side's picks to check
      const targetSide = phase.type === 'pick_self' ? side : (side === 'red' ? 'blue' : 'red');
      const sidePicks = targetSide === 'red' ? room.redPicks : room.bluePicks;
      const available = getAvailablePool(room.bans, room.redPicks, room.bluePicks, sidePicks);
      const availableIds = new Set(available.map(s => s.id));
      for (const id of selectedIds) {
        if (!availableIds.has(id)) {
          socket.emit('error', { message: '该式神已被禁用、已选择或与已有式神冲突' });
          return;
        }
      }
    }

    room.selections[phaseKey][side] = selectedIds;
    emitRoomState(room.code);
  });

  // === PLAYER CONFIRM ===
  socket.on('player_confirm', () => {
    const room = getRoom(socket);
    if (!room || !socket.data.side) return;
    if (room.phaseStatus !== 'selecting') return;

    const side = socket.data.side;
    const phaseKey = `phase_${room.phase}`;

    // Validate selection count
    const phase = PHASES[room.phase - 1];
    if (!room.selections[phaseKey]) {
      room.selections[phaseKey] = { red: [], blue: [] };
    }
    const selected = room.selections[phaseKey][side] || [];

    if (selected.length !== phase.count) {
      socket.emit('error', {
        message: `请选择 ${phase.count} 个式神（当前已选 ${selected.length} 个）`,
      });
      return;
    }

    room.players[side].confirmed = true;
    emitRoomState(room.code);

    // Check if both confirmed
    checkBothConfirmed(room);
  });

  // === PLAYER TIMEOUT ===
  socket.on('player_timeout', () => {
    const room = getRoom(socket);
    if (!room || !socket.data.side) return;
    if (room.phaseStatus !== 'selecting') return;

    const side = socket.data.side;
    room.players[side].timeout = true;
    room.players[side].confirmed = true; // auto-confirm on timeout

    const phase = PHASES[room.phase - 1];
    const phaseKey = `phase_${room.phase}`;
    if (!room.selections[phaseKey]) {
      room.selections[phaseKey] = { red: [], blue: [] };
    }

    const current = room.selections[phaseKey][side] || [];

    // For pick phases: fill remaining slots with random shikigami
    if ((phase.type === 'pick_self' || phase.type === 'pick_opponent') && current.length < phase.count) {
      const needed = phase.count - current.length;
      const targetSide = phase.type === 'pick_self' ? side : (side === 'red' ? 'blue' : 'red');
      const sidePicks = targetSide === 'red' ? room.redPicks : room.bluePicks;
      const available = getAvailablePool(room.bans, room.redPicks, room.bluePicks, sidePicks);
      // Exclude already selected by this player in this phase
      const candidates = available.filter(s => !current.includes(s.id));
      // Shuffle and pick
      const shuffled = candidates.sort(() => Math.random() - 0.5);
      const fill = shuffled.slice(0, needed).map(s => s.id);
      room.selections[phaseKey][side] = [...current, ...fill];
    }
    // For ban phases: keep whatever was selected (may be empty)

    emitRoomState(room.code);
    checkBothConfirmed(room);
  });

  // === NEXT PHASE (Referee) ===
  socket.on('next_phase', () => {
    const room = getRoom(socket);
    if (!room) return;
    if (room.phaseStatus !== 'revealed' && room.phaseStatus !== 'finished') return;

    if (room.phase >= TOTAL_PHASES) {
      room.phaseStatus = 'finished';
      emitRoomState(room.code);
      return;
    }

    advanceToPhase(room, room.phase + 1);
  });

  // === DISCONNECT ===
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const room = getRoom(socket);
    if (!room) return;

    if (socket.data.role === 'player' && socket.data.side) {
      room.players[socket.data.side].connected = false;
      emitRoomState(room.code);
    }
  });
});

// --- Game Logic ---
function getRoom(socket) {
  return rooms.get(socket.data.roomCode);
}

function advanceToPhase(room, phaseNum) {
  room.phase = phaseNum;
  room.phaseStatus = 'selecting';
  room.timer = { remaining: PHASE_TIMEOUT, running: true };
  resetPhaseConfirmations(room);

  const phaseKey = `phase_${phaseNum}`;
  if (!room.selections[phaseKey]) {
    room.selections[phaseKey] = { red: [], blue: [] };
  }

  // Emit to all in room
  emitRoomState(room.code);
}

function checkBothConfirmed(room) {
  const redReady = room.players.red.confirmed;
  const blueReady = room.players.blue.confirmed;

  if (redReady && blueReady) {
    revealPhase(room);
  }
}

function revealPhase(room) {
  room.phaseStatus = 'revealed';
  room.timer.running = false;

  const phaseKey = `phase_${room.phase}`;
  const phase = PHASES[room.phase - 1];
  const sel = room.selections[phaseKey] || { red: [], blue: [] };

  if (phase.type === 'ban') {
    // Both sides' bans go to ban pool
    const allBans = [...(sel.red || []), ...(sel.blue || [])];
    room.bans = [...new Set([...room.bans, ...allBans])];
  } else if (phase.type === 'pick_self') {
    // Each side's pick goes to their own pool
    room.redPicks = [...room.redPicks, ...(sel.red || [])];
    room.bluePicks = [...room.bluePicks, ...(sel.blue || [])];
  } else if (phase.type === 'pick_opponent') {
    // Red picks for blue, blue picks for red
    room.bluePicks = [...room.bluePicks, ...(sel.red || [])];
    room.redPicks = [...room.redPicks, ...(sel.blue || [])];
  }

  // Check if match finished
  if (room.phase >= TOTAL_PHASES) {
    room.phaseStatus = 'finished';
  }

  emitRoomState(room.code);
}

function getPublicState(room, role, side) {
  const phase = room.phase > 0 ? PHASES[room.phase - 1] : null;
  const phaseKey = `phase_${room.phase}`;
  const currentSel = room.selections[phaseKey] || { red: [], blue: [] };

  // Build state with visibility rules
  const state = {
    code: room.code,
    phase: room.phase,
    phaseStatus: room.phaseStatus,
    phaseLabel: phase ? phase.label : '',
    phaseType: phase ? phase.type : '',
    phaseCount: phase ? phase.count : 0,
    totalPhases: TOTAL_PHASES,
    timer: room.timer,
    players: {
      red: { name: room.players.red.name, connected: room.players.red.connected, joined: !!room.players.red.name },
      blue: { name: room.players.blue.name, connected: room.players.blue.connected, joined: !!room.players.blue.name },
    },
    bans: room.bans,
    redPicks: room.redPicks,
    bluePicks: room.bluePicks,
    shikigamiList: SHIKIGAMI_LIST,
  };

  if (role === 'player' && side) {
    // Player sees own selection + opponent's confirmed status
    state.mySide = side;
    state.mySelection = currentSel[side] || [];
    state.myConfirmed = room.players[side].confirmed;
    state.myTimeout = room.players[side].timeout;

    if (room.phaseStatus === 'selecting') {
      // Blind phase: hide opponent's selection
      state.opponentConfirmed = room.players[side === 'red' ? 'blue' : 'red'].confirmed;
      state.opponentSelection = null; // hidden
      state.opponentTimeout = room.players[side === 'red' ? 'blue' : 'red'].timeout;
    } else {
      // Revealed: show all
      state.opponentSelection = currentSel[side === 'red' ? 'blue' : 'red'] || [];
    }
  } else if (role === 'referee' || role === 'spectator') {
    if (room.phaseStatus === 'selecting') {
      // Hide selections during blind phase
      state.redConfirmed = room.players.red.confirmed;
      state.blueConfirmed = room.players.blue.confirmed;
      state.redTimeout = room.players.red.timeout;
      state.blueTimeout = room.players.blue.timeout;
      state.redSelection = null;
      state.blueSelection = null;
    } else {
      state.redSelection = currentSel.red || [];
      state.blueSelection = currentSel.blue || [];
    }
  }

  return state;
}

function emitRoomState(code) {
  const room = rooms.get(code);
  if (!room) return;

  // Send tailored state to each socket in the room
  const sockets = io.sockets.adapter.rooms.get(code);
  if (!sockets) return;

  for (const socketId of sockets) {
    const sock = io.sockets.sockets.get(socketId);
    if (!sock) continue;
    const state = getPublicState(room, sock.data.role, sock.data.side);
    sock.emit('state_update', state);
  }
}

// --- Start Server ---
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`[BRS Server] Running on http://localhost:${PORT}`);
});
