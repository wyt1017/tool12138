import { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Loader2,
} from "lucide-react";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";

const BALL = 48;
const BAR_W = 230;
const GAP = 8;
const PAD = 16;
// 拖动判定阈值（px）：超过才视为拖动，否则视为点击
const DRAG_THRESHOLD = 4;

export default function MusicMiniPlayer() {
  const { currentSong, playing, loadingUrlId, play, pause, next, prev } =
    useMusicPlayer();

  // open = 悬浮信息条是否展开；pos = 小球位置
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    // 按下时指针相对容器左上角的偏移，拖动时按「指针位置 - 偏移」定位，保证跟手
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  // 用 ref 同步，避免 window 监听闭包读到旧值
  const openRef = useRef(open);
  const posRef = useRef(pos);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // ── 拖拽：使用 window 原生监听，指针移出元素也能持续收到 move，保证跟手 ──
  const handleMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // 未超过阈值视为点击，不移动小球、不标记为拖动
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    // 信息条在球左侧，展开时整体宽度更大，需按展开状态约束右边界
    const w = openRef.current ? BAR_W + GAP + BALL : BALL;
    setPos({
      x: Math.max(
        PAD,
        Math.min(window.innerWidth - w - PAD, e.clientX - d.offsetX),
      ),
      y: Math.max(
        PAD,
        Math.min(window.innerHeight - BALL - PAD, e.clientY - d.offsetY),
      ),
    });
  };

  const handleUp = () => {
    const d = dragRef.current;
    if (d && !d.moved) {
      const next = !openRef.current;
      setOpen(next);
      // 展开时若左侧放不下信息条，把整体右移保证不超出屏幕
      const p = posRef.current;
      if (next && p) {
        const minX = PAD + BAR_W + GAP;
        if (p.x < minX) {
          setPos({
            ...p,
            x: Math.min(window.innerWidth - BALL - PAD, minX),
          });
        }
      }
    }
    dragRef.current = null;
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
  };

  // 组件卸载时清理可能残留的监听
  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 首次渲染把小球放到右下角
  useEffect(() => {
    if (pos) return;
    setPos({
      x: Math.max(PAD, window.innerWidth - BALL - PAD),
      y: window.innerHeight - BALL - PAD,
    });
  }, [pos]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <div
      className="fixed z-50 cursor-move touch-none select-none"
      style={{
        left: pos?.x ?? Math.max(PAD, window.innerWidth - BALL - PAD),
        top: pos?.y ?? window.innerHeight - BALL - PAD,
      }}
      onPointerDown={handlePointerDown}
    >
      <div className="relative">
        {/* 悬浮信息条（球左侧，点击小球后显示） */}
        {open && (
          <div
            onPointerDown={stop}
            className="absolute right-full mr-2 flex items-center gap-1 h-12 rounded-full bg-[#111128]/95 backdrop-blur-xl border border-white/10 pl-3.5 pr-1.5 shadow-xl"
            style={{ width: BAR_W }}
          >
            <div className="min-w-0 flex-1">
              {currentSong ? (
                <>
                  <p className="text-xs font-semibold text-white truncate leading-tight">
                    {currentSong.name}
                  </p>
                  <p className="text-[10px] text-[#a8b2c1] truncate leading-tight">
                    {currentSong.artists}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-[#555] leading-tight">
                  搜索歌曲开始播放
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onPointerDown={stop}
                onClick={prev}
                disabled={!currentSong}
                className="p-1.5 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 disabled:opacity-30"
                aria-label="上一曲"
              >
                <SkipBack size={15} />
              </button>
              <button
                onPointerDown={stop}
                onClick={() => (playing ? pause() : play())}
                disabled={!currentSong}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#00d9ff] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-30"
                aria-label={playing ? "暂停" : "播放"}
              >
                {loadingUrlId ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : playing ? (
                  <Pause size={14} />
                ) : (
                  <Play size={14} />
                )}
              </button>
              <button
                onPointerDown={stop}
                onClick={next}
                disabled={!currentSong}
                className="p-1.5 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 disabled:opacity-30"
                aria-label="下一曲"
              >
                <SkipForward size={15} />
              </button>
            </div>
          </div>
        )}

        {/* 小球：封面 / 图标 */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/15 shadow-lg bg-[#1a1a2e]">
          {currentSong?.cover ? (
            <img
              src={currentSong.cover}
              alt={currentSong.name}
              className={`w-full h-full object-cover ${
                playing ? "cover-spin" : ""
              }`}
            />
          ) : loadingUrlId ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 size={16} className="text-[#a78bfa] animate-spin" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={18} className="text-[#a78bfa]" />
            </div>
          )}
          {playing && (
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#00d9ff] opacity-50 pulse-ring pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  );
}
