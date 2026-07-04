import Avatar from './Avatar';

function getShikigami(list, id) {
  return list.find((s) => s.id === id) || null;
}

function ShikigamiSlot({ id, shikigamiList, type = 'pick' }) {
  const shikigami = getShikigami(shikigamiList, id);
  const name = shikigami?.name || '?';

  return (
    <div className={`
      flex flex-col items-center gap-1.5 p-2 rounded-xl border
      ${type === 'ban'
        ? 'border-red-500/30 bg-red-500/5'
        : 'border-amber-400/30 bg-amber-400/5'}
    `}>
      {id ? (
        <>
          <Avatar name={name} size="sm" shikigami={shikigami} />
          <span className="text-[11px] text-center leading-tight max-w-[56px] truncate text-white/70">
            {name}
          </span>
        </>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/20 text-lg">
          ?
        </div>
      )}
    </div>
  );
}

export default function BanPickDisplay({
  bans = [],
  redPicks = [],
  bluePicks = [],
  shikigamiList = [],
  side,
  compact = false,
}) {
  const maxSlots = 4;

  if (compact) {
    const myPicks = side === 'red' ? redPicks : bluePicks;
    const opponentPicks = side === 'red' ? bluePicks : redPicks;
    const mySlots = [...myPicks, ...Array(maxSlots - myPicks.length).fill(null)].slice(0, maxSlots);
    const oppSlots = [...opponentPicks, ...Array(maxSlots - opponentPicks.length).fill(null)].slice(0, maxSlots);

    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-xs text-white/40 mb-2 font-medium">我方阵容</div>
          <div className="flex gap-2">
            {mySlots.map((id, i) => (
              <ShikigamiSlot key={`my-${i}`} id={id} shikigamiList={shikigamiList} type="pick" />
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/40 mb-2 font-medium">对方阵容</div>
          <div className="flex gap-2">
            {oppSlots.map((id, i) => (
              <ShikigamiSlot key={`opp-${i}`} id={id} shikigamiList={shikigamiList} type="pick" />
            ))}
          </div>
        </div>
        {bans.length > 0 && (
          <div>
            <div className="text-xs text-white/40 mb-2 font-medium">已 Ban ({bans.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {bans.map((id) => (
                <ShikigamiSlot key={id} id={id} shikigamiList={shikigamiList} type="ban" />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full display (referee/spectator)
  const redSlots = [...redPicks, ...Array(maxSlots - redPicks.length).fill(null)].slice(0, maxSlots);
  const blueSlots = [...bluePicks, ...Array(maxSlots - bluePicks.length).fill(null)].slice(0, maxSlots);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-sm text-white/40 mb-2 font-medium">已禁用 ({bans.length})</div>
        <div className="flex flex-wrap gap-2">
          {bans.length === 0 && <span className="text-white/20 text-sm">暂无</span>}
          {bans.map((id) => (
            <ShikigamiSlot key={id} id={id} shikigamiList={shikigamiList} type="ban" />
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm text-red-400 mb-2 font-medium">红方阵容</div>
        <div className="flex gap-2">
          {redSlots.map((id, i) => (
            <ShikigamiSlot key={`red-${i}`} id={id} shikigamiList={shikigamiList} type="pick" />
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm text-blue-400 mb-2 font-medium">蓝方阵容</div>
        <div className="flex gap-2">
          {blueSlots.map((id, i) => (
            <ShikigamiSlot key={`blue-${i}`} id={id} shikigamiList={shikigamiList} type="pick" />
          ))}
        </div>
      </div>
    </div>
  );
}
