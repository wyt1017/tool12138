import { useRef, useEffect, useState, useCallback } from "react";
import {
  Play,
  Pause,
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
const DRAG_THRESHOLD = 6;
// 双击间隔（ms）：两次点击在此间隔内视为双击 → 切下一首
const DBL_TAP_MS = 300;
// 进度环半径
const RING_R = 23;
const RING_C = 2 * Math.PI * RING_R;

export default function MusicMiniPlayer() {
  const {
    currentSong,
    playing,
    loadingUrlId,
    currentTime,
    duration,
    play,
    pause,
    next,
  } = useMusicPlayer();

  // open = 悬浮信息条是否展开；pos = 小球位置
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const lastTapRef = useRef(0);

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
  const handleMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
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
  }, []);

  const handleUp = useCallback(() => {
    const d = dragRef.current;
    if (d && !d.moved) {
      // 单击：展开/收起信息条
      const now = Date.now();
      const elapsed = now - lastTapRef.current;
      if (elapsed < DBL_TAP_MS) {
        // 双击 → 切下一首
        next();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
        // 延迟展开，等下一次 tap 判断是否双击
        setTimeout(() => {
          if (Date.now() - lastTapRef.current >= DBL_TAP_MS) {
            const willOpen = !openRef.current;
            setOpen(willOpen);
            // 展开时若左侧放不下信息条，把整体右移保证不超出屏幕
            const p = posRef.current;
            if (willOpen && p) {
              const minX = PAD + BAR_W + GAP;
              if (p.x < minX) {
                setPos({
                  ...p,
                  x: Math.min(window.innerWidth - BALL - PAD, minX),
                });
              }
            }
          }
        }, DBL_TAP_MS);
      }
    }
    dragRef.current = null;
    window.removeEventListener("pointermove", handleMove);
    window.removeEventListener("pointerup", handleUp);
    window.removeEventListener("pointercancel", handleUp);
  }, [next, handleMove]);

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
  }, [handleMove, handleUp]);

  // 首次渲染把小球放到右下角
  useEffect(() => {
    if (pos) return;
    setPos({
      x: Math.max(PAD, window.innerWidth - BALL - PAD),
      y: window.innerHeight - BALL - PAD,
    });
  }, [pos]);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const progress = duration > 0 ? currentTime / duration : 0;

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
            className="absolute right-full mr-2 flex items-center gap-1 h-12 rounded-full bg-[#111128]/95 backdrop-blur-xl border border-[var(--border-color)] pl-3.5 pr-1.5 shadow-xl"
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

        {/* 小球：封面 / 图标 + 进度环 */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[var(--border-strong)] shadow-lg bg-[#1a1a2e]">
          {currentSong?.cover ? (
            <img
              src={currentSong.cover}
              alt={currentSong.name}
              draggable={false}
              className={`w-full h-full object-cover pointer-events-none ${
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

        {/* 进度环：贴在小球外圈，显示播放进度 */}
        {currentSong && (
          <svg
            className="absolute inset-0 pointer-events-none -rotate-90"
            viewBox="0 0 48 48"
            width={BALL}
            height={BALL}
          >
            <circle
              cx="24"
              cy="24"
              r={RING_R}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
            />
            <circle
              cx="24"
              cy="24"
              r={RING_R}
              fill="none"
              stroke="url(#mp-grad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.25s linear" }}
            />
            <defs>
              <linearGradient id="mp-grad" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#00d9ff" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
    </div>
  );
}
