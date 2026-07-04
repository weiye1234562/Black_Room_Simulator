import { useState, useMemo, useEffect } from 'react';
import ShikigamiCard from './ShikigamiCard';

function usePageSize() {
  const [pageSize, setPageSize] = useState(() => window.innerWidth <= 768 ? 15 : 30);
  useEffect(() => {
    const onResize = () => setPageSize(window.innerWidth <= 768 ? 15 : 30);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return pageSize;
}

const EXPANSION_NAMES = {
  '01': '经典', '02': '不夜之火', '03': '月夜幻响', '04': '沧海刀鸣',
  '05': '吉运缘结', '06': '四相琉璃', '07': '善恶无明', '08': '繁花入梦',
  '09': '浮生方醒', '10': '喧哗烩战', '11': '空弦绮话', '12': '振剑归川',
  '13': '远山遥泽', '14': '鸣雷启蛰', '15': '燃灯志异', '16': '尘世轮回',
  '17': '桃园故里', '18': '祝星启明', '19': '湮灭双生', '20': '千录晴诗',
  '21': '龙渊秘境', '22': '星缘百策', '23': '斗转万象', '24': '花札祈梦', '25': '命运抉择',
};

export default function ShikigamiGrid({
  shikigamiList = [],
  selectedIds = [],
  bannedIds = [],
  pickedIds = [],
  maxSelect = 1,
  onSelect,
  disabled = false,
}) {
  const PAGE_SIZE = usePageSize();
  const [search, setSearch] = useState('');
  const [expansionFilter, setExpansionFilter] = useState('all');
  const [page, setPage] = useState(0);

  const expansions = useMemo(() => {
    const set = new Set();
    shikigamiList.forEach(s => { if (s.expansion) set.add(s.expansion); });
    return [...set].sort();
  }, [shikigamiList]);

  const filtered = useMemo(() => {
    let result = shikigamiList;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }
    if (expansionFilter !== 'all') {
      result = result.filter(s => s.expansion === expansionFilter);
    }
    return result;
  }, [shikigamiList, search, expansionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedItems = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const excludedIds = useMemo(() => {
    const ids = new Set([...bannedIds, ...pickedIds]);

    const pickedNames = new Set();
    pickedIds.forEach(id => {
      const s = shikigamiList.find(x => x.id === id);
      if (s) {
        const base = s.name.split(/[·\-]/)[0];
        pickedNames.add(base);
      }
    });

    shikigamiList.forEach(s => {
      if (!ids.has(s.id)) {
        const base = s.name.split(/[·\-]/)[0];
        if (pickedNames.has(base)) {
          ids.add(s.id);
        }
      }
    });

    return ids;
  }, [bannedIds, pickedIds, shikigamiList]);

  function handleClick(shikigami) {
    if (disabled) return;
    const id = shikigami.id;
    if (selectedIds.includes(id)) {
      onSelect?.(selectedIds.filter((sid) => sid !== id));
    } else {
      if (selectedIds.length >= maxSelect) {
        if (maxSelect === 1) onSelect?.([id]);
        return;
      }
      onSelect?.([...selectedIds, id]);
    }
  }

  function changeFilter(fn) {
    fn();
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search + Expansion filter */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => changeFilter(() => setSearch(e.target.value))}
            placeholder="搜索式神..."
            disabled={disabled}
            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl
              text-white placeholder-white/30 outline-none transition-all
              focus:border-white/30 focus:bg-white/15 disabled:opacity-50"
          />
          {search && (
            <button
              onClick={() => changeFilter(() => setSearch(''))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={expansionFilter}
            onChange={(e) => changeFilter(() => setExpansionFilter(e.target.value))}
            disabled={disabled}
            className="appearance-none px-4 py-3 pr-10 bg-white/10 border border-white/10 rounded-xl
              text-white outline-none cursor-pointer transition-all
              focus:border-white/30 disabled:opacity-50"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all" className="bg-[#1a1a1a] text-white">全部卡包</option>
            {expansions.map(exp => (
              <option key={exp} value={exp} className="bg-[#1a1a1a] text-white">
                {EXPANSION_NAMES[exp] || exp}
              </option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Count + page */}
      <div className="flex items-center justify-between text-sm text-white/50 px-1 shrink-0">
        <span>
          共 {filtered.length} 个
          {selectedIds.length > 0 && (
            <span className="text-amber-400 ml-2">· 已选 {selectedIds.length}/{maxSelect}</span>
          )}
        </span>
        <span>第 {safePage + 1}/{totalPages} 页</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10
        gap-2 overflow-y-auto flex-1 pr-1 content-start pb-2">
        {pagedItems.map((s) => (
          <ShikigamiCard
            key={s.id}
            shikigami={s}
            selected={selectedIds.includes(s.id)}
            disabled={disabled ||
              (!selectedIds.includes(s.id) &&
                selectedIds.length >= maxSelect &&
                !excludedIds.has(s.id))}
            banned={excludedIds.has(s.id) && !selectedIds.includes(s.id)}
            onClick={handleClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 shrink-0 pb-1">
          <button
            onClick={() => setPage(0)}
            disabled={safePage === 0 || disabled}
            className="px-2 py-1.5 text-white/40 hover:text-white disabled:opacity-20 text-sm"
          >
            ««
          </button>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={safePage === 0 || disabled}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-20
              text-white/60 text-sm rounded-lg border border-white/10"
          >
            «
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let n;
            if (totalPages <= 7) {
              n = i;
            } else if (safePage < 4) {
              n = i < 5 ? i : (i === 5 ? -1 : totalPages - 1);
            } else if (safePage >= totalPages - 4) {
              n = i === 0 ? 0 : (i === 1 ? -1 : totalPages - (7 - i));
            } else {
              n = i === 0 ? 0 : (i === 1 ? -1 : safePage + i - 3);
              if (i === 5) n = -1;
              if (i === 6) n = totalPages - 1;
            }
            if (n === -1) return <span key={i} className="px-1.5 py-1.5 text-white/20 text-sm">…</span>;
            return (
              <button
                key={i}
                onClick={() => setPage(n)}
                disabled={disabled}
                className={`px-2.5 py-1.5 text-sm rounded-lg border transition-all
                  ${n === safePage
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold'
                    : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'}`}
              >
                {n + 1}
              </button>
            );
          })}

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1 || disabled}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-20
              text-white/60 text-sm rounded-lg border border-white/10"
          >
            »
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={safePage >= totalPages - 1 || disabled}
            className="px-2 py-1.5 text-white/40 hover:text-white disabled:opacity-20 text-sm"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}
