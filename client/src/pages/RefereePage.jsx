import Timer from '../components/Timer';
import Avatar from '../components/Avatar';

function ShikigamiRevealCard({ id, shikigamiList, color }) {
  const s = shikigamiList?.find(x => x.id === id);
  if (!id) return null;
  return (
    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 animate-reveal
      ${color === 'red'
        ? 'border-red-500/40 bg-red-500/10'
        : 'border-blue-500/40 bg-blue-500/10'}`
    }>
      <Avatar name={s?.name || '?'} size="xl" shikigami={s} />
      <span className="text-sm font-medium text-white/90 text-center leading-tight max-w-[100px] truncate">
        {s?.name || '?'}
      </span>
    </div>
  );
}

function ShikigamiBanCard({ id, shikigamiList }) {
  const s = shikigamiList?.find(x => x.id === id);
  if (!id) return null;
  return (
    <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-red-500/30 bg-red-500/5 animate-reveal">
      <Avatar name={s?.name || '?'} size="md" shikigami={s} />
      <span className="text-xs text-red-300/80 text-center leading-tight max-w-[64px] truncate">
        {s?.name || '?'}
      </span>
    </div>
  );
}

export default function RefereePage({ gameState, emit, onLeave }) {
  const phase = gameState?.phase || 0;
  const phaseStatus = gameState?.phaseStatus || 'waiting';
  const list = gameState?.shikigamiList || [];

  // Room created
  if (phase === 0 && phaseStatus === 'waiting' && gameState?.code) {
    const redReady = gameState?.players?.red?.joined;
    const blueReady = gameState?.players?.blue?.joined;
    const bothReady = redReady && blueReady;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-10 text-center animate-slide-up shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold mb-1">房间已创建</h1>
          <p className="text-white/25 text-sm mb-8">将房间码分享给两位选手</p>

          {/* Room code display */}
          <div className="bg-amber-400/[0.06] border border-amber-400/20 rounded-2xl p-6 mb-8">
            <div className="text-xs text-white/25 mb-2 uppercase tracking-widest">房间码</div>
            <div className="text-5xl font-mono font-bold tracking-[0.25em] text-amber-400/90">
              {gameState.code}
            </div>
          </div>

          {/* Player status */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`rounded-xl p-4 border transition-all duration-300
              ${redReady
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-white/[0.02] border-white/[0.04]'}`}
            >
              <div className="text-xs text-white/30 mb-1">🔴 红方</div>
              <div className={`font-semibold text-sm ${redReady ? 'text-red-300' : 'text-white/15'}`}>
                {gameState?.players?.red?.name || '等待加入…'}
              </div>
              {redReady && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto mt-2" />}
            </div>
            <div className={`rounded-xl p-4 border transition-all duration-300
              ${blueReady
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-white/[0.02] border-white/[0.04]'}`}
            >
              <div className="text-xs text-white/30 mb-1">🔵 蓝方</div>
              <div className={`font-semibold text-sm ${blueReady ? 'text-blue-300' : 'text-white/15'}`}>
                {gameState?.players?.blue?.name || '等待加入…'}
              </div>
              {blueReady && <div className="w-1.5 h-1.5 rounded-full bg-green-400 mx-auto mt-2" />}
            </div>
          </div>

          <button
            onClick={() => emit('start_match')}
            disabled={!bothReady}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300
              ${bothReady
                ? 'bg-white hover:bg-white/90 text-black shadow-lg shadow-white/10'
                : 'bg-white/[0.04] text-white/15 border border-white/[0.05]'}`}
          >
            {bothReady ? '开始比赛' : '等待双方选手加入…'}
          </button>
          <button
            onClick={onLeave}
            className="w-full py-2 text-white/15 hover:text-red-400 text-sm transition-colors mt-2"
          >
            退出房间
          </button>
        </div>
      </div>
    );
  }

  // Room closed
  if (gameState?.roomClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-2">房间已关闭</div>
          <div className="text-white/40">{gameState.roomClosed.reason}</div>
        </div>
      </div>
    );
  }

  // Finished
  if (phaseStatus === 'finished') {
    return (
      <div className="min-h-screen flex flex-col p-6 max-w-4xl mx-auto gap-6 overflow-y-auto">
        <div className="text-center py-6">
          <div className="text-4xl font-bold text-amber-400 mb-2">选取完毕</div>
          <div className="text-white/30 text-lg">请双方选手进入游戏比赛</div>
        </div>

        {/* Bans */}
        <div>
          <div className="text-sm text-white/40 mb-3 font-medium">已禁用 ({gameState?.bans?.length || 0})</div>
          <div className="flex flex-wrap gap-2">
            {(gameState?.bans || []).map(id => (
              <ShikigamiBanCard key={id} id={id} shikigamiList={list} />
            ))}
          </div>
        </div>

        {/* Red picks */}
        <div>
          <div className="text-sm text-red-400 mb-3 font-medium">红方阵容 ({gameState?.players?.red?.name})</div>
          <div className="flex flex-wrap gap-3">
            {(gameState?.redPicks || []).map(id => (
              <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="red" />
            ))}
          </div>
        </div>

        {/* Blue picks */}
        <div>
          <div className="text-sm text-blue-400 mb-3 font-medium">蓝方阵容 ({gameState?.players?.blue?.name})</div>
          <div className="flex flex-wrap gap-3">
            {(gameState?.bluePicks || []).map(id => (
              <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="blue" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Active game ---
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="text-white/20 hover:text-red-400 text-xs transition-colors"
            title="退出房间"
          >
            ✕ 退出
          </button>
          <h1 className="text-base font-bold">⚖ 裁判面板</h1>
          <span className="text-white/20">|</span>
          <span className="text-white/30 text-xs">房间: {gameState?.code}</span>
          <span className="text-white/20">|</span>
          <span className="text-white/40 text-xs">Phase {phase}/{gameState?.totalPhases}</span>
        </div>
        <div className="flex items-center gap-3">
          {phaseStatus === 'selecting' && (
            <Timer remaining={gameState?.timer?.remaining || 0} running={gameState?.timer?.running} />
          )}
          {phaseStatus === 'revealed' && phase < gameState?.totalPhases && (
            <button
              onClick={() => emit('next_phase')}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-sm transition-all"
            >
              下一阶段 →
            </button>
          )}
          {phaseStatus === 'revealed' && phase >= gameState?.totalPhases && (
            <button
              onClick={() => emit('next_phase')}
              className="px-5 py-2 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg text-sm transition-all"
            >
              结束比赛
            </button>
          )}
        </div>
      </div>

      {/* Phase info */}
      <div className="px-4 py-1.5 text-center text-xs text-white/40 bg-white/[0.02] shrink-0 border-b border-white/5">
        {gameState?.phaseLabel}
        {phaseStatus === 'selecting' && <span className="ml-2 text-amber-400/70">暗选阶段</span>}
        {phaseStatus === 'revealed' && <span className="ml-2 text-green-400/70">已揭示</span>}
      </div>

      {/* Main: two player panels side by side */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Red panel */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="px-4 py-2 flex items-center justify-between bg-red-500/5 border-b border-red-500/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="font-bold text-red-400 text-sm">红方</span>
              <span className="text-white/40 text-xs">{gameState?.players?.red?.name}</span>
            </div>
            {phaseStatus === 'selecting' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                gameState?.redConfirmed
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/30'}`}
              >
                {gameState?.redConfirmed ? '✓' : gameState?.redTimeout ? '超时' : '...'}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {phaseStatus === 'selecting' ? (
              <div className="h-full flex items-center justify-center text-white/15 text-lg animate-pulse-slow">
                暗选中…
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 content-start">
                {(gameState?.redSelection || []).length === 0 && (
                  <span className="text-white/20 text-sm">空选</span>
                )}
                {(gameState?.redSelection || []).map(id => (
                  <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="red" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Blue panel */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between bg-blue-500/5 border-b border-blue-500/10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="font-bold text-blue-400 text-sm">蓝方</span>
              <span className="text-white/40 text-xs">{gameState?.players?.blue?.name}</span>
            </div>
            {phaseStatus === 'selecting' && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                gameState?.blueConfirmed
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/5 text-white/30'}`}
              >
                {gameState?.blueConfirmed ? '✓' : gameState?.blueTimeout ? '超时' : '...'}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {phaseStatus === 'selecting' ? (
              <div className="h-full flex items-center justify-center text-white/15 text-lg animate-pulse-slow">
                暗选中…
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 content-start">
                {(gameState?.blueSelection || []).length === 0 && (
                  <span className="text-white/20 text-sm">空选</span>
                )}
                {(gameState?.blueSelection || []).map(id => (
                  <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="blue" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer: cumulative bans + picks */}
      <div className="shrink-0 border-t border-white/5 bg-black/60 overflow-y-auto">
        {/* Layer 1: Bans */}
        <div className="p-3 pb-2">
          <div className="text-xs text-white/40 mb-2 font-medium">已 Ban ({gameState?.bans?.length || 0})</div>
          <div className="flex gap-2 flex-wrap">
            {(gameState?.bans || []).length === 0 && <span className="text-white/10 text-xs">—</span>}
            {(gameState?.bans || []).map(id => (
              <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="red" />
            ))}
          </div>
        </div>

        {/* Layer 2: Both sides' picks side by side */}
        <div className="flex border-t border-white/5">
          {/* Red picks */}
          <div className="flex-1 p-3 border-r border-white/5">
            <div className="text-xs text-red-400 mb-2 font-medium">
              红方阵容 ({gameState?.players?.red?.name})
            </div>
            <div className="flex gap-2 flex-wrap">
              {(gameState?.redPicks || []).length === 0 && <span className="text-white/10 text-xs">—</span>}
              {(gameState?.redPicks || []).map(id => (
                <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="red" />
              ))}
            </div>
          </div>

          {/* Blue picks */}
          <div className="flex-1 p-3">
            <div className="text-xs text-blue-400 mb-2 font-medium">
              蓝方阵容 ({gameState?.players?.blue?.name})
            </div>
            <div className="flex gap-2 flex-wrap">
              {(gameState?.bluePicks || []).length === 0 && <span className="text-white/10 text-xs">—</span>}
              {(gameState?.bluePicks || []).map(id => (
                <ShikigamiRevealCard key={id} id={id} shikigamiList={list} color="blue" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
