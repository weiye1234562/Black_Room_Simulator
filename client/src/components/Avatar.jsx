import { useMemo } from 'react';

const COLORS = [
  '#c0392b', '#e74c3c', '#e67e22', '#f39c12',
  '#27ae60', '#2ecc71', '#1abc9c', '#16a085',
  '#2980b9', '#3498db', '#8e44ad', '#9b59b6',
  '#d35400', '#c0392b', '#2c3e50',
];
function hashColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getImageIdx(id, max) {
  if (max === 0) return -1;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

export default function Avatar({ name, size = 'md', className = '', shikigami }) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm rounded-lg',
    md: 'w-16 h-16 text-xl rounded-xl',
    lg: 'w-24 h-24 text-3xl rounded-2xl',
    xl: 'w-32 h-32 text-5xl rounded-3xl',
  };

  // Image URL if available
  const imageUrl = useMemo(() => {
    if (!shikigami?.imageDir || !shikigami?.imageFiles?.length) return null;
    const idx = getImageIdx(shikigami.id, shikigami.imageFiles.length);
    const file = shikigami.imageFiles[idx];
    return `/cards/${shikigami.imageDir}/${file}`;
  }, [shikigami?.id, shikigami?.imageDir, shikigami?.imageFiles]);

  const firstChar = name ? name.charAt(0) : '?';
  const bgColor = hashColor(name || '');

  if (imageUrl) {
    return (
      <div className={`${sizeClasses[size]} overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
        <div
          className="w-full h-full hidden items-center justify-center font-bold text-white"
          style={{ backgroundColor: bgColor }}
        >
          {firstChar}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-bold text-white no-select ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {firstChar}
    </div>
  );
}
