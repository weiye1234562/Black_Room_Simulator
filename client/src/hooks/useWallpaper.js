import { useEffect } from 'react';

const DESKTOP_COUNT = 10;
const MOBILE_COUNT = 10;

function getDeviceType() {
  return window.innerWidth <= 768 ? 'mobile' : 'desktop';
}

function getRandomWallpaper(device) {
  const count = device === 'mobile' ? MOBILE_COUNT : DESKTOP_COUNT;
  const num = Math.floor(Math.random() * count) + 1;
  const padded = String(num).padStart(3, '0');
  const c = encodeURIComponent('C 壁纸类图片');
  const folder = device === 'mobile' ? 'C2 手机壁纸' : 'C1 电脑壁纸';
  return `/wallpapers/${c}/${encodeURIComponent(folder)}/${padded}.jpg`;
}

export default function useWallpaper() {
  useEffect(() => {
    const device = getDeviceType();
    const url = getRandomWallpaper(device);
    document.body.style.backgroundImage = `url(${url})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    return () => { document.body.style.backgroundImage = ''; };
  }, []);
}
