import { useMemo } from 'react';

function getImageIndex(id, max) {
  if (max === 0) return -1;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

function getImageUrl(shikigami, index) {
  if (!shikigami?.imageDir || !shikigami?.imageFiles?.length) return null;
  const file = shikigami.imageFiles[index % shikigami.imageFiles.length];
  return `/cards/${shikigami.imageDir}/${file}`;
}

const COLORS = [
  '#c0392b', '#e74c3c', '#e67e22', '#f39c12',
  '#27ae60', '#2ecc71', '#1abc9c', '#16a085',
  '#2980b9', '#3498db', '#8e44ad', '#9b59b6',
];
function hashColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function ShikigamiCard({
  shikigami,
  selected = false,
  disabled = false,
  banned = false,
  onClick,
}) {
  const isDisabled = disabled || banned;

  const imageIdx = useMemo(() => {
    if (!shikigami || shikigami.imageCount === 0) return -1;
    return getImageIndex(shikigami.id, shikigami.imageCount);
  }, [shikigami?.id, shikigami?.imageCount]);

  const imageUrl = useMemo(() => {
    if (imageIdx < 0) return null;
    return getImageUrl(shikigami, imageIdx);
  }, [shikigami, imageIdx]);

  const firstChar = shikigami?.name?.charAt(0) || '?';
  const bgColor = hashColor(shikigami?.name || '');
  const name = shikigami?.name || '?';

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onClick?.(shikigami)}
      className={`
        relative flex flex-col rounded-lg border-2 transition-all duration-200
        no-select cursor-pointer overflow-hidden w-full
        ${selected
          ? 'border-amber-400 shadow-lg shadow-amber-400/30 scale-[1.04] z-10'
          : isDisabled
            ? 'border-transparent opacity-30 cursor-not-allowed'
            : 'border-white/10 hover:border-white/40 hover:scale-[1.02] active:scale-95'
        }
      `}
    >
      {/* Image area */}
      <div className="w-full aspect-[2/3] relative bg-white/5">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
        )}
        <div
          className={`w-full h-full flex items-center justify-center text-3xl font-bold
            ${imageUrl ? 'hidden' : 'flex'}`}
          style={{ backgroundColor: bgColor, color: '#fff' }}
        >
          {firstChar}
        </div>

        {/* Banned overlay */}
        {banned && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40">
            <div className="w-[120%] h-0.5 bg-red-500 rotate-45 absolute" />
            <div className="w-[120%] h-0.5 bg-red-500 -rotate-45 absolute" />
          </div>
        )}

        {/* Selected badge */}
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-xs text-black font-bold z-10 shadow-lg">
            ✓
          </div>
        )}
      </div>

      {/* Name below image - always visible, larger text */}
      <div className="px-1 py-1.5 bg-black/60 w-full">
        <span className="text-[13px] leading-tight text-white/90 font-medium block text-center truncate">
          {name}
        </span>
      </div>
    </button>
  );
}
