import { useState, useEffect, useCallback, useRef } from 'react';
import ShikigamiGrid from '../components/ShikigamiGrid';
import Timer from '../components/Timer';
import Avatar from '../components/Avatar';
import BanPickDisplay from '../components/BanPickDisplay';

export default function PlayerPage({ gameState, emit, side, onLeave }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const hasTimedOut = useRef(false);

  const phase = gameState?.phase || 0;
  const phaseStatus = gameState?.phaseStatus || 'waiting';
  const mySelection = gameState?.mySelection || [];
  const opponentConfirmed = gameState?.opponentConfirmed;
  const opponentTimeout = gameState?.opponentTimeout;
  const myConfirmed = gameState?.myConfirmed;
  const myTimeout = gameState?.myTimeout;

  // Sync local selection with server
  useEffect(() => {
    setSelectedIds(mySelection);
  }, [mySelection]);

  // Reset timeout flag on phase change
  useEffect(() => {
    hasTimedOut.current = false;
  }, [phase]);

  const handleSelect = useCallback((ids) => {
    if (myConfirmed) return;
    setSelectedIds(ids);
    emit('player_select', { selectedIds: ids });
  }, [emit, myConfirmed]);

  const handleConfirm = useCallback(() => {
    if (myConfirmed) return;
    emit('player_confirm');
  }, [emit, myConfirmed]);

  const handleTimeout = useCallback(() => {
    if (hasTimedOut.current) return;
    hasTimedOut.current = true;
    emit('player_timeout');
  }, [emit]);

  // Waiting state
  if (phase === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-10 text-center animate-slide-up shadow-2xl">
          <div className={`text-5xl font-bold mb-4 ${side === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
            {side === 'red' ? '🔴 红方' : '🔵 蓝方'}
          </div>
          <div className="text-white/30 text-lg mb-1">{gameState?.players?.[side]?.name}</div>
          <div className="text-white/15 text-sm mb-6">房间 {gameState?.code}</div>
          <button
            onClick={onLeave}
            className="text-white/20 hover:text-red-400 text-sm transition-colors mb-4"
          >
            退出房间
          </button>
          <div className="flex items-center justify-center gap-2 text-white/25">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm">等待裁判开始比赛…</span>
          </div>
        </div>
      </div>
    );
  }

  // Finished
  if (phaseStatus === 'finished') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.06] rounded-3xl p-10 text-center animate-slide-up shadow-2xl max-w-lg w-full">
          <div className="text-4xl font-bold text-amber-400 mb-3">选取完毕</div>
          <div className="text-white/30 text-lg mb-8">请双方选手进入游戏比赛</div>
          <BanPickDisplay
            bans={gameState?.bans || []}
            redPicks={gameState?.redPicks || []}
            bluePicks={gameState?.bluePicks || []}
            shikigamiList={gameState?.shikigamiList || []}
            side={side}
          />
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-black/50 shrink-0">
        <button
          onClick={onLeave}
          className="text-white/20 hover:text-red-400 text-xs transition-colors mr-2"
          title="退出房间"
        >
          ✕ 退出
        </button>
        <div className="flex items-center gap-3">
          <span className={`font-bold ${side === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
            {side === 'red' ? '🔴 红方' : '🔵 蓝方'}
          </span>
          <span className="text-white/30 text-sm">
            Phase {phase}/{gameState?.totalPhases}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {phaseStatus === 'selecting' && (
            <>
              <Timer
                remaining={gameState?.timer?.remaining || 0}
                running={gameState?.timer?.running && !myConfirmed}
                onTimeout={handleTimeout}
              />

              <button
                onClick={handleConfirm}
                disabled={myConfirmed || selectedIds.length !== gameState?.phaseCount}
                className={`
                  px-5 py-2 rounded-xl font-bold text-sm transition-all
                  ${myConfirmed
                    ? 'bg-green-600/30 text-green-400 border border-green-500/50 cursor-not-allowed'
                    : selectedIds.length === gameState?.phaseCount
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }
                `}
              >
                {myConfirmed ? '已确认 ✓' : `确认 (${selectedIds.length}/${gameState?.phaseCount})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Phase label */}
      <div className="px-4 py-2 text-center text-sm text-white/50 bg-white/[0.02] shrink-0">
        {gameState?.phaseLabel}
        {phaseStatus === 'selecting' && (
          <span className="ml-2 text-amber-400/70">— 选择 {gameState?.phaseCount} 个式神</span>
        )}
        {phaseStatus === 'revealed' && (
          <span className="ml-2 text-green-400/70">— 已揭示，等待裁判推进</span>
        )}
        {myTimeout && (
          <span className="ml-2 text-red-400">(已超时)</span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Shikigami grid */}
        <div className="flex-1 overflow-hidden p-3">
          {phaseStatus === 'selecting' && (
            <ShikigamiGrid
              shikigamiList={gameState?.shikigamiList || []}
              selectedIds={selectedIds}
              bannedIds={gameState?.bans || []}
              pickedIds={
                gameState?.phaseType === 'pick_self'
                  ? (side === 'red' ? gameState?.redPicks || [] : gameState?.bluePicks || [])
                  : gameState?.phaseType === 'pick_opponent'
                    ? (side === 'red' ? gameState?.bluePicks || [] : gameState?.redPicks || [])
                    : [...(gameState?.redPicks || []), ...(gameState?.bluePicks || [])]
              }
              maxSelect={gameState?.phaseCount || 1}
              onSelect={handleSelect}
              disabled={myConfirmed}
              compact
            />
          )}
          {phaseStatus === 'revealed' && (
            <div className="h-full flex flex-col items-center justify-center gap-4 overflow-y-auto py-4">
              <div className="text-2xl font-bold animate-reveal shrink-0">结果揭示</div>
              <div className="flex gap-6 animate-slide-up flex-wrap justify-center">
                <div className="text-center">
                  <div className="text-sm text-white/40 mb-2 font-medium">我方</div>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {(gameState?.mySelection || []).map((id) => {
                      const s = gameState?.shikigamiList?.find((x) => x.id === id);
                      return (
                        <div key={id} className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-amber-400/40 bg-amber-400/5 animate-reveal">
                          <Avatar name={s?.name || '?'} size="lg" shikigami={s} />
                          <span className="text-xs text-white/80">{s?.name || '?'}</span>
                        </div>
                      );
                    })}
                  </div>
                  {myTimeout && <div className="text-xs text-red-400 mt-1">超时·空选</div>}
                </div>
                <div className="text-center">
                  <div className="text-sm text-white/40 mb-2 font-medium">对方</div>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {(gameState?.opponentSelection || []).map((id) => {
                      const s = gameState?.shikigamiList?.find((x) => x.id === id);
                      return (
                        <div key={id} className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-white/20 bg-white/5 animate-reveal">
                          <Avatar name={s?.name || '?'} size="lg" shikigami={s} />
                          <span className="text-xs text-white/80">{s?.name || '?'}</span>
                        </div>
                      );
                    })}
                    {(gameState?.opponentSelection || []).length === 0 && (
                      <div className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-white/30">
                        空选
                      </div>
                    )}
                  </div>
                  {opponentTimeout && <div className="text-xs text-red-400 mt-1">超时·空选</div>}
                </div>
              </div>
              <div className="text-white/30 text-sm animate-pulse-slow">等待裁判推进下一阶段...</div>
            </div>
          )}
        </div>

        {/* Sidebar: Ban/Pick display */}
        <div className="lg:w-72 shrink-0 border-l border-white/5 bg-white/[0.02] p-3 overflow-y-auto">
          <BanPickDisplay
            bans={gameState?.bans || []}
            redPicks={gameState?.redPicks || []}
            bluePicks={gameState?.bluePicks || []}
            shikigamiList={gameState?.shikigamiList || []}
            side={side}
            compact
          />
        </div>
      </div>

      {/* Opponent status indicator */}
      {phaseStatus === 'selecting' && (
        <div className="shrink-0 px-4 py-1.5 border-t border-white/5 bg-black/50 flex items-center justify-center gap-4 text-xs">
          <span className="text-white/30">
            对方:
            {opponentConfirmed ? (
              <span className="text-green-400 ml-1">已确认</span>
            ) : (
              <span className="text-amber-400 ml-1 animate-pulse-slow">选择中...</span>
            )}
          </span>
          <span className="text-white/20">|</span>
          <span className="text-white/30">
            自己: {myConfirmed ? (
              <span className="text-green-400">已确认</span>
            ) : (
              <span className="text-amber-400">选择中...</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
