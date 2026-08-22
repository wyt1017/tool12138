import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music2,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";

export default function HeroMiniPlayer() {
  const { currentSong, playing, loadingUrlId, play, pause, next, prev } =
    useMusicPlayer();
  const navigate = useNavigate();

  // 无播放歌曲：显示简洁引导，点击跳转到播放器页面搜索
  if (!currentSong) {
    return (
      <button
        onClick={() => navigate("/tools/music-player")}
        className="mx-auto mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-[#a8b2c1] hover:text-white hover:border-[#a78bfa]/40 transition-colors"
      >
        <Music2 size={14} className="text-[#a78bfa]" />
        搜索歌曲开始播放
      </button>
    );
  }

  return (
    <div className="mt-6 w-full max-w-md mx-auto">
      <div className="glass-card px-4 py-3 flex items-center gap-3 rounded-2xl">
        {/* 封面缩略图 */}
        <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-white/15">
          <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/30 to-[#00d9ff]/30 z-10 pointer-events-none" />
          <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
            {loadingUrlId ? (
              <Loader2 size={14} className="text-[#a78bfa] animate-spin" />
            ) : (
              <Music2 size={16} className="text-white/25" />
            )}
          </div>
          {currentSong.cover && (
            <img
              src={currentSong.cover}
              alt={currentSong.name}
              className={`absolute inset-0 w-full h-full object-cover z-0 ${
                playing ? "cover-spin" : ""
              }`}
            />
          )}
        </div>

        {/* 歌曲信息 */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-white text-sm font-semibold truncate">
            {currentSong.name}
          </p>
          <p className="text-[#a8b2c1] text-xs truncate">
            {currentSong.artists}
          </p>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={prev}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="上一曲"
          >
            <SkipBack size={15} />
          </button>
          <button
            onClick={() => (playing ? pause() : play())}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#00d9ff] flex items-center justify-center text-white hover:opacity-90 transition-opacity"
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
            onClick={next}
            className="p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5"
            aria-label="下一曲"
          >
            <SkipForward size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
