import { useState, useEffect, useCallback } from 'react';

function GlassCard({ children, className = '' }) {
  return (
    <div className={`backdrop-blur-xl bg-white/[0.06] border border-white/[0.08] rounded-3xl shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

function GlassInput({ value, onChange, placeholder, maxLength, center, large }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full bg-white/[0.06] border border-white/[0.08] outline-none transition-all duration-300
        text-white placeholder-white/20 backdrop-blur-sm
        focus:border-white/20 focus:bg-white/[0.10] focus:ring-1 focus:ring-white/10
        ${large
          ? 'px-5 py-4 text-2xl tracking-[0.3em] font-mono rounded-2xl'
          : 'px-4 py-3.5 rounded-xl'}
        ${center ? 'text-center' : ''}`}
    />
  );
}

export default function HomePage({ onJoin, connected, error, clearError, emit, gameState }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [side, setSide] = useState(null);

  const roomInfo = gameState?.roomInfo;

  useEffect(() => {
    if (mode === 'join' && code.length >= 4 && connected) {
      const timer = setTimeout(() => emit('check_room', { code: code.toUpperCase() }), 300);
      return () => clearTimeout(timer);
    }
  }, [code, mode, connected, emit]);

  const refreshRoom = useCallback(() => {
    if (code.length >= 4 && connected) {
      emit('check_room', { code: code.toUpperCase() });
    }
  }, [code, connected, emit]);

  function handleJoinRoom() {
    if (!name.trim() || !code.trim() || !side) return;
    onJoin({ role: 'player', name: name.trim(), side, code: code.trim().toUpperCase() });
  }

  function handleSpectate() {
    if (!code.trim()) return;
    onJoin({ role: 'spectator', code: code.trim().toUpperCase() });
  }

  // === JOIN ROOM ===
  if (mode === 'join') {
    const redTaken = roomInfo?.red?.taken && roomInfo?.code === code.toUpperCase();
    const blueTaken = roomInfo?.blue?.taken && roomInfo?.code === code.toUpperCase();
    const showRoomInfo = roomInfo?.code === code.toUpperCase();

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-8 animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">加入房间</h1>
            <p className="text-white/30 text-sm">输入房间码和选手名</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-300 mb-6 text-center backdrop-blur-sm">
              {error}
              <button onClick={clearError} className="ml-2 underline hover:text-red-200">关闭</button>
            </div>
          )}

          <div className="flex flex-col gap-5">
            {/* Room code */}
            <div className="flex gap-2">
              <div className="flex-1">
                <GlassInput
                  value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setSide(null); }}
                  placeholder="房间码"
                  maxLength={6}
                  center
                  large
                />
              </div>
              <button
                onClick={refreshRoom}
                disabled={code.length < 4 || !connected}
                className="px-4 rounded-2xl bg-white/[0.06] border border-white/[0.08]
                  hover:bg-white/[0.12] disabled:opacity-20 transition-all text-white/50 text-lg"
                title="刷新"
              >
                ↻
              </button>
            </div>

            {/* Room status */}
            {showRoomInfo && (
              <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4 animate-slide-up">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 text-center border transition-all
                    ${redTaken
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-white/[0.02] border-white/[0.04]'}`}
                  >
                    <div className="text-xs text-white/30 mb-1">🔴 红方</div>
                    <div className={`font-semibold text-sm ${redTaken ? 'text-red-300' : 'text-white/20'}`}>
                      {redTaken ? roomInfo.red.name : '空缺'}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 text-center border transition-all
                    ${blueTaken
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-white/[0.02] border-white/[0.04]'}`}
                  >
                    <div className="text-xs text-white/30 mb-1">🔵 蓝方</div>
                    <div className={`font-semibold text-sm ${blueTaken ? 'text-blue-300' : 'text-white/20'}`}>
                      {blueTaken ? roomInfo.blue.name : '空缺'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Name */}
            <GlassInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的选手名"
              maxLength={10}
            />

            {/* Side selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSide('red')}
                disabled={redTaken}
                className={`py-4 rounded-2xl font-bold text-sm border transition-all duration-300
                  ${redTaken
                    ? 'bg-white/[0.02] border-white/[0.04] text-white/10 cursor-not-allowed'
                    : side === 'red'
                      ? 'bg-red-500/20 border-red-500/40 text-red-300 shadow-lg shadow-red-500/10'
                      : 'bg-white/[0.04] border-white/[0.06] text-white/40 hover:border-red-500/20 hover:text-red-300/80'}`}
              >
                🔴 红方{redTaken ? ' · 已占' : ''}
              </button>
              <button
                onClick={() => setSide('blue')}
                disabled={blueTaken}
                className={`py-4 rounded-2xl font-bold text-sm border transition-all duration-300
                  ${blueTaken
                    ? 'bg-white/[0.02] border-white/[0.04] text-white/10 cursor-not-allowed'
                    : side === 'blue'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/10'
                      : 'bg-white/[0.04] border-white/[0.06] text-white/40 hover:border-blue-500/20 hover:text-blue-300/80'}`}
              >
                🔵 蓝方{blueTaken ? ' · 已占' : ''}
              </button>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={!name.trim() || code.length < 4 || !side || !connected}
              className="w-full py-4 bg-white hover:bg-white/90 disabled:bg-white/[0.06]
                text-black font-bold text-base rounded-2xl transition-all duration-300
                disabled:text-white/20 shadow-lg shadow-white/5"
            >
              {connected ? '加入房间' : '连接中…'}
            </button>

            <button
              onClick={() => { setMode(null); clearError(); }}
              className="w-full py-2 text-white/20 hover:text-white/40 text-sm transition-colors"
            >
              返回首页
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // === SPECTATE ===
  if (mode === 'spectate') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <GlassCard className="w-full max-w-md p-8 animate-slide-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-1">观战</h1>
            <p className="text-white/30 text-sm">输入房间码观看比赛</p>
          </div>
          <div className="flex flex-col gap-5">
            <GlassInput
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="房间码"
              maxLength={6}
              center
              large
            />
            <button
              onClick={handleSpectate}
              disabled={code.length < 4 || !connected}
              className="w-full py-4 bg-white hover:bg-white/90 disabled:bg-white/[0.06]
                text-black font-bold text-base rounded-2xl transition-all duration-300
                disabled:text-white/20"
            >
              {connected ? '进入观战' : '连接中…'}
            </button>
            <button
              onClick={() => { setMode(null); clearError(); }}
              className="w-full py-2 text-white/20 hover:text-white/40 text-sm transition-colors"
            >
              返回首页
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // === HOME ===
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Hero */}
      <div className="text-center mb-12 animate-slide-up">
        <h1 className="text-5xl font-bold mb-3 tracking-tight">
          <span className="text-white">黑房间</span>
          <span className="text-amber-400">模拟器</span>
        </h1>
        <p className="text-white/25 text-lg">百闻牌比赛 · Ban/Pick 系统</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => onJoin({ role: 'referee' })}
          disabled={!connected}
          className="group w-full py-5 bg-white hover:bg-white/90 disabled:bg-white/[0.06]
            text-black font-bold text-lg rounded-2xl transition-all duration-300
            disabled:text-white/20 shadow-xl shadow-white/5 hover:shadow-white/10"
        >
          <span className="mr-2">⚖</span>
          裁判 · 创建房间
        </button>

        <button
          onClick={() => setMode('join')}
          disabled={!connected}
          className="w-full py-5 bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20
            text-white font-bold text-lg rounded-2xl border border-white/[0.08]
            hover:border-white/[0.15] transition-all duration-300 backdrop-blur-sm"
        >
          <span className="mr-2">🎮</span>
          选手 · 加入房间
        </button>

        <button
          onClick={() => setMode('spectate')}
          disabled={!connected}
          className="w-full py-3.5 bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-20
            text-white/40 hover:text-white/60 text-sm rounded-2xl border border-white/[0.04]
            transition-all duration-300"
        >
          <span className="mr-1">👁</span>
          观众 · 观看比赛
        </button>
      </div>

      {/* Status */}
      <div className="mt-10 text-white/15 text-xs animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${connected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-amber-400 animate-pulse'}`} />
        {connected ? '服务器已连接' : '正在连接服务器…'}
      </div>
    </div>
  );
}
