// YukiOS games catalog — HTML5 games, DOS games, and emulators.
// Sourced from Reeyuki/YukiOS/static (open source).
// Assets served via jsDelivr CDN.

const YUKI_CDN = "https://cdn.jsdelivr.net/gh/Reeyuki/YukiOS@main/static";

export interface YukiGame {
  id: number;
  name: string;
  type: "html5" | "dos" | "emulator" | "flash";
  url: string;
  cover: string;
  desc: string;
}

export const YUKI_GAMES: YukiGame[] = [
  // HTML5 games
  { id: 1, name: "How To Date A Sleep Paralysis Demon", type: "html5", url: `${YUKI_CDN}/games/html/howToDateASleepParalysisDemon.html`, cover: `${YUKI_CDN}/icons/howToDate.webp`, desc: "A dating sim where you romance a sleep paralysis demon. Surprisingly wholesome." },
  { id: 2, name: "Angry Birds Chrome", type: "html5", url: `${YUKI_CDN}/games/angryBirdsChrome.html`, cover: `${YUKI_CDN}/icons/angryBirdsChrome.webp`, desc: "The classic Chrome-era Angry Birds web game." },
  { id: 3, name: "Angry Birds Online", type: "html5", url: `${YUKI_CDN}/games/angryBirdsOnline.html`, cover: `${YUKI_CDN}/icons/angryBirds.webp`, desc: "Slingshot birds at pigs. The original web version." },
  { id: 4, name: "Rainbow Friends", type: "html5", url: `${YUKI_CDN}/rfiv.html`, cover: `${YUKI_CDN}/icons/bob.webp`, desc: "A horror adventure game with colorful but creepy characters." },
  { id: 5, name: "Binding of Isaac: Rebirth", type: "html5", url: `${YUKI_CDN}/isaacRebirth.html`, cover: `${YUKI_CDN}/icons/isaac.webp`, desc: "Roguelike dungeon crawler. Shoot tears at monsters in a basement." },
  { id: 6, name: "Flashpoint Archive", type: "flash", url: `${YUKI_CDN}/flashpointarchive.html`, cover: `${YUKI_CDN}/icons/bal.webp`, desc: "Browse and play hundreds of preserved Flash games from the Flashpoint archive." },

  // DOS games (via js-dos WASM emulator)
  { id: 7, name: "DOOM", type: "dos", url: `${YUKI_CDN}/apps/jsdos/doom.jsdos`, cover: `${YUKI_CDN}/icons/doom.webp`, desc: "The original 1993 DOOM. Run and gun through hell." },
  { id: 8, name: "Duke Nukem 3D", type: "dos", url: `${YUKI_CDN}/apps/jsdos/dn3d.jsdos`, cover: `${YUKI_CDN}/icons/duke.webp`, desc: "1996 FPS classic. Kick ass and chew bubblegum." },
  { id: 9, name: "Jazz Jackrabbit", type: "dos", url: `${YUKI_CDN}/apps/jsdos/jazz.jsdos`, cover: `${YUKI_CDN}/icons/jazz.webp`, desc: "A green ninja rabbit platformer from 1994." },
  { id: 10, name: "Raptor: Call of the Shadows", type: "dos", url: `${YUKI_CDN}/apps/jsdos/raptor.jsdos`, cover: `${YUKI_CDN}/icons/raptor.webp`, desc: "Vertical-scrolling shoot 'em up. Pilot a fighter jet." },
  { id: 11, name: "Sky Roads", type: "dos", url: `${YUKI_CDN}/apps/jsdos/skyRoads.jsdos`, cover: `${YUKI_CDN}/icons/skyroads.webp`, desc: "Race a spaceship through floating road segments in space." },

  // Emulators + system apps
  { id: 12, name: "Windows XP Simulator", type: "emulator", url: `${YUKI_CDN}/apps/winxp/index.html`, cover: `${YUKI_CDN}/wallpapers/xp.webp`, desc: "A full Windows XP desktop running in the browser. Nostalgic." },
  { id: 13, name: "v86 Emulator", type: "emulator", url: `${YUKI_CDN}/apps/v86/build/index.html`, cover: `${YUKI_CDN}/icons/3dyukios.webp`, desc: "Run real x86 operating systems (Linux, FreeDOS, Windows) in the browser." },
  { id: 14, name: "Cmatrix Terminal", type: "emulator", url: `${YUKI_CDN}/apps/cmatrix/cmatrix.html`, cover: `${YUKI_CDN}/icons/cmatrix.webp`, desc: "The classic Matrix terminal screensaver." },
  { id: 15, name: "Lava Lamp", type: "emulator", url: `${YUKI_CDN}/apps/lavat/lavat.html`, cover: `${YUKI_CDN}/icons/lavat.webp`, desc: "A WASM-powered lava lamp screensaver." },
];

// YukiOS wallpapers — served via jsDelivr.
export const YUKI_WALLPAPERS: { id: string; label: string; url: string }[] = [
  { id: "kath", label: "Kath", url: `${YUKI_CDN}/wallpapers/Kath.jpg` },
  { id: "corndog", label: "Corndog", url: `${YUKI_CDN}/wallpapers/corndog.jpg` },
  { id: "nier", label: "Nier", url: `${YUKI_CDN}/wallpapers/nier.webp` },
  { id: "mint", label: "Mint", url: `${YUKI_CDN}/wallpapers/mint.webp` },
  { id: "end4", label: "End", url: `${YUKI_CDN}/wallpapers/end_4.jpg` },
  { id: "redwin10", label: "Red Win10", url: `${YUKI_CDN}/wallpapers/redwin10.jpg` },
  { id: "meptl", label: "Meptl", url: `${YUKI_CDN}/wallpapers/Meptl.png` },
  { id: "yuki1", label: "Wallpaper 1", url: `${YUKI_CDN}/wallpapers/wallpaper1.webp` },
  { id: "yuki2", label: "Wallpaper 2", url: `${YUKI_CDN}/wallpapers/wallpaper2.webp` },
  { id: "yuki3", label: "Wallpaper 3", url: `${YUKI_CDN}/wallpapers/wallpaper3.webp` },
  { id: "yuki4", label: "Wallpaper 4", url: `${YUKI_CDN}/wallpapers/wallpaper4.webp` },
  { id: "yuki5", label: "Wallpaper 5", url: `${YUKI_CDN}/wallpapers/wallpaper5.webp` },
  { id: "win10", label: "Windows 10", url: `${YUKI_CDN}/wallpapers/win10.webp` },
  { id: "win11", label: "Windows 11", url: `${YUKI_CDN}/wallpapers/win11.webp` },
  { id: "win11dark", label: "Win 11 Dark", url: `${YUKI_CDN}/wallpapers/win11dark.webp` },
  { id: "win7", label: "Windows 7", url: `${YUKI_CDN}/wallpapers/win7.webp` },
  { id: "xp", label: "Windows XP", url: `${YUKI_CDN}/wallpapers/xp.webp` },
];
