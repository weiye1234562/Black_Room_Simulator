import Timer from '../components/Timer';
import Avatar from '../components/Avatar';
import BanPickDisplay from '../components/BanPickDisplay';

export default function SpectatorPage({ gameState, onLeave }) {
  const phase = gameState?.phase || 0;
  const phaseStatus = gameState?.phaseStatus || 'waiting';

  if (phase === 0 && phaseStatus === 'waiting') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-10 text-center animate-slide-up shadow-2xl">
          <div className="text-3xl font-bold mb-4">👁 观众视角</div>
          <div className="text-white/20 text-sm mb-4">房间 {gameState?.code}</div>
          <div className="flex items-center justify-center gap-2 text-white/25">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm">等待比赛开始…</span>
          </div>
          <button
            onClick={onLeave}
            className="mt-6 text-white/15 hover:text-red-400 text-sm transition-colors"
          >
            退出房间
          </button>
        </div>
      </div>
    );
  }

  if (phaseStatus === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
        <div className="text-4xl font-bold text-amber-400 animate-slide-up">选取完毕</div>
        <div className="text-white/30 text-lg mt-2">请双方选手进入游戏比赛</div>
        <div className="w-full max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <BanPickDisplay
            bans={gameState?.bans || []}
            redPicks={gameState?.redPicks || []}
            bluePicks={gameState?.bluePicks || []}
            shikigamiList={gameState?.shikigamiList || []}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeave}
            className="text-white/20 hover:text-red-400 text-xs transition-colors"
            title="退出"
          >
            ✕ 退出
          </button>
          <h1 className="text-lg font-bold">👁 观众视角</h1>
          <span className="text-white/20">|</span>
          <span className="text-white/30 text-sm">房间: {gameState?.code}</span>
          <span className="text-white/20">|</span>
          <span className="text-white/40 text-sm">
            Phase {phase}/{gameState?.totalPhases}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {phaseStatus === 'selecting' && (
            <div className="flex items-center gap-3">
              <span className="text-amber-400/70 text-sm animate-pulse-slow">暗选中...</span>
              <Timer
                remaining={gameState?.timer?.remaining || 0}
                running={gameState?.timer?.running}
              />
            </div>
          )}
          {phaseStatus === 'revealed' && (
            <span className="text-green-400/70 text-sm">等待裁判推进</span>
          )}
        </div>
      </div>

      {/* Phase label */}
      <div className="px-4 py-3 text-center text-lg font-bold shrink-0 bg-white/[0.02] border-b border-white/5">
        {gameState?.phaseLabel}
      </div>

      {/* Main area: two sides */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
        {/* Red side */}
        <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="px-4 py-3 text-center text-lg font-bold text-red-400 bg-red-500/5 border-b border-red-500/10">
            🔴 红方 — {gameState?.players?.red?.name || '—'}
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {phaseStatus === 'selecting' ? (
              <div className="text-white/15 text-6xl font-bold animate-pulse-slow">?</div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center items-start">
                {(gameState?.redSelection || []).length === 0 && (
                  <span className="text-white/20 text-lg">空选</span>
                )}
                {(gameState?.redSelection || []).map((id, i) => {
                  const s = gameState?.shikigamiList?.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-red-500/40 bg-red-500/5 animate-reveal"
                      style={{ animationDelay: `${i * 0.15}s` }}>
                      <Avatar name={s?.name || '?'} size="xl" shikigami={s} />
                      <span className="text-sm font-bold text-red-300">{s?.name || '?'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="hidden lg:flex items-center justify-center w-16 shrink-0 bg-white/[0.02]">
          <span className="text-white/10 text-2xl font-bold">VS</span>
        </div>

        {/* Blue side */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 text-center text-lg font-bold text-blue-400 bg-blue-500/5 border-b border-blue-500/10">
            🔵 蓝方 — {gameState?.players?.blue?.name || '—'}
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
            {phaseStatus === 'selecting' ? (
              <div className="text-white/15 text-6xl font-bold animate-pulse-slow">?</div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center items-start">
                {(gameState?.blueSelection || []).length === 0 && (
                  <span className="text-white/20 text-lg">空选</span>
                )}
                {(gameState?.blueSelection || []).map((id, i) => {
                  const s = gameState?.shikigamiList?.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-blue-500/40 bg-blue-500/5 animate-reveal"
                      style={{ animationDelay: `${i * 0.15}s` }}>
                      <Avatar name={s?.name || '?'} size="xl" shikigami={s} />
                      <span className="text-sm font-bold text-blue-300">{s?.name || '?'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ban summary footer */}
      <div className="shrink-0 border-t border-white/5 bg-white/[0.02] p-3">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-sm text-white/30">已 Ban:</span>
          {gameState?.bans?.length === 0 && <span className="text-white/15 text-sm">暂无</span>}
          {gameState?.bans?.map((id) => {
            const s = gameState?.shikigamiList?.find((x) => x.id === id);
            return (
              <span key={id} className="px-2 py-1 bg-red-500/10 rounded border border-red-500/20 text-xs text-red-300">
                {s?.name || '?'}
              </span>
            );
          })}
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
          <span className="text-sm text-amber-400/50">红方: {gameState?.redPicks?.map((id) => {
            const s = gameState?.shikigamiList?.find((x) => x.id === id);
            return s?.name || '?';
          }).join('、') || '—'}</span>
          <span className="text-white/10">|</span>
          <span className="text-sm text-blue-400/50">蓝方: {gameState?.bluePicks?.map((id) => {
            const s = gameState?.shikigamiList?.find((x) => x.id === id);
            return s?.name || '?';
          }).join('、') || '—'}</span>
        </div>
      </div>
    </div>
  );
}
