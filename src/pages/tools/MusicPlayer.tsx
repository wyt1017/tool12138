import { useEffect, useRef, useState } from "react";
import {
  Search,
  Music2,
  Plus,
  Check,
  Loader2,
  Volume2,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  useMusicPlayer,
  type SongMeta,
} from "@/hooks/useMusicPlayer";
import EqBars from "@/components/layout/EqBars";

function formatTime(sec: number): string {
  if (!sec || isNaN(sec)) return "--:--";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getActiveLrcIndex(
  lyrics: Array<{ time: number; text: string }>,
  currentTime: number,
): number {
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}

export default function MusicPlayerPage() {
  const {
    searchSongs,
    addToPlaylist,
    playlist,
    currentSong,
    playing,
    loadingUrlId,
    currentTime,
    duration,
    volume,
    lyrics,
    error,
    mode,
    play,
    pause,
    next,
    prev,
    seek,
    setVolume,
    cycleMode,
    loadAndPlay,
    removeFromPlaylist,
    clearPlaylist,
  } = useMusicPlayer();

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SongMeta[]>([]);
  const [searching, setSearching] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);

  const lyricBoxRef = useRef<HTMLDivElement>(null);
  const activeLrc = getActiveLrcIndex(lyrics, currentTime);

  // 输入关键词实时搜索（350ms 防抖 + 过期请求丢弃）
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const list = await searchSongs(q);
      // 如果在等待期间用户又输入了新关键词，丢弃这次结果
      if (!cancelled) {
        setResults(list);
        setSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchSongs]);

  // 歌词自动滚动到当前行
  useEffect(() => {
    const box = lyricBoxRef.current;
    const line = box?.children[activeLrc] as HTMLElement | undefined;
    if (!box || !line) return;
    box.scrollTop +=
      line.getBoundingClientRect().top -
      box.getBoundingClientRect().top -
      box.clientHeight / 2;
  }, [activeLrc]);

  const addedIds = new Set(playlist.map((s) => s.id));

  // 点击搜索结果：只把这一首加入播放列表（若未加入）并播放，保留原有已添加歌曲
  const handlePlayResult = (song: SongMeta) => {
    const inList = playlist.some((s) => s.id === song.id);
    if (!inList) addToPlaylist(song);
    // 当前无播放歌曲时 addToPlaylist 已自动开播，无需重复触发
    if (inList || currentSong) loadAndPlay(song, undefined, true);
  };

  const modeIcon =
    mode === "shuffle" ? (
      <Shuffle size={18} />
    ) : mode === "loop" ? (
      <Repeat1 size={18} />
    ) : (
      <Repeat size={18} />
    );
  const modeLabel = mode === "order" ? "顺序" : mode === "shuffle" ? "随机" : "单曲";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold gradient-text mb-6">音乐播放器</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 左侧：搜索 + 搜索结果 */}
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入关键词实时搜索歌曲..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-[#444] outline-none focus:border-[#a78bfa]/40"
            />
            {searching && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a78bfa] animate-spin"
              />
            )}
          </div>

          {/* 搜索结果列表 */}
          <div className="glass-card p-3 max-h-[560px] overflow-y-auto">
            {!searchQuery.trim() ? (
              <p className="text-[#555] text-center py-6">
                输入关键词搜索，点击「+」加入播放列表
              </p>
            ) : searching ? (
              <p className="text-[#555] text-center py-6">搜索中...</p>
            ) : results.length === 0 ? (
              <p className="text-[#555] text-center py-6">未找到相关歌曲</p>
            ) : (
              results.map((song) => {
                const added = addedIds.has(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => handlePlayResult(song)}
                    title="点击播放该歌曲"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {/* 封面缩略图（圆形） */}
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/30 to-[#00d9ff]/30 z-10 pointer-events-none" />
                      <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                        <Music2 size={14} className="text-white/20" />
                      </div>
                      {song.cover && (
                        <img
                          src={song.cover}
                          alt={song.name}
                          className="absolute inset-0 w-full h-full object-cover z-0"
                        />
                      )}
                    </div>
                    {/* 歌曲信息 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{song.name}</p>
                      <p className="text-[#a8b2c1] text-xs truncate">
                        {song.artists}
                        {song.duration ? ` · ${formatTime(song.duration)}` : ""}
                      </p>
                    </div>
                    {/* 当前播放标识 */}
                    {currentSong?.id === song.id && playing ? (
                      <EqBars className="h-3 flex-shrink-0" />
                    ) : null}
                    {/* 加入播放列表 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToPlaylist(song);
                      }}
                      disabled={added}
                      title={added ? "已加入播放列表" : "加入播放列表"}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        added
                          ? "text-[#00d9ff] bg-[#00d9ff]/10 cursor-default"
                          : "text-[#a78bfa] bg-white/5 hover:bg-[#a78bfa]/20 border border-[#a78bfa]/30"
                      }`}
                    >
                      {added ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧：完整播放器面板 */}
        <div className="glass-card p-6">
          {/* 封面 + 歌曲信息 */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6">
            {/* 大封面（圆形 + 旋转动画） */}
            <div className="relative w-44 h-44 rounded-full overflow-hidden shadow-2xl flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#a78bfa]/30 to-[#00d9ff]/30 z-10 pointer-events-none" />
              <div className="w-full h-full bg-[#1a1a2e] flex items-center justify-center">
                {loadingUrlId ? (
                  <Loader2 size={36} className="text-[#a78bfa] animate-spin" />
                ) : (
                  <Music2 size={44} className="text-white/20" />
                )}
              </div>
              {currentSong?.cover && (
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
            <div className="flex-1 min-w-0 text-center sm:text-left">
              {currentSong ? (
                <>
                  <h2 className="text-2xl font-bold text-white truncate">
                    {currentSong.name}
                  </h2>
                  <p className="text-[#a8b2c1] mt-1">{currentSong.artists}</p>
                </>
              ) : (
                <p className="text-[#555]">尚未播放歌曲，去左侧添加吧</p>
              )}
              {error && (
                <p className="text-[#f472b6] text-sm mt-2">{error}</p>
              )}
            </div>
          </div>

          {/* 歌词（可开关、点击跳转、滚动高亮当前行） */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#a8b2c1] flex items-center gap-1.5">
                <Music2 size={12} /> 歌词
              </span>
              <button
                onClick={() => setShowLyrics((v) => !v)}
                className="flex items-center gap-1 text-xs text-[#a8b2c1] hover:text-[#00d9ff] transition-colors"
                aria-label={showLyrics ? "隐藏歌词" : "显示歌词"}
              >
                {showLyrics ? <EyeOff size={13} /> : <Eye size={13} />}
                {showLyrics ? "隐藏" : "显示"}
              </button>
            </div>
            {showLyrics && (
              <div
                ref={lyricBoxRef}
                className="mask-fade-y max-h-[220px] overflow-y-auto space-y-2 rounded-xl p-3 bg-white/[0.03]"
              >
                {lyrics.length === 0 ? (
                  <p className="text-[#555] text-sm text-center py-8">暂无歌词</p>
                ) : (
                  lyrics.map((line, i) => (
                    <p
                      key={i}
                      onClick={() => seek(line.time)}
                      className={`text-sm transition-all cursor-pointer rounded px-1 -mx-1 ${
                        i === activeLrc
                          ? "text-[#00d9ff] font-semibold scale-105 origin-left"
                          : "text-[#555] hover:text-white/70"
                      }`}
                    >
                      {line.text}
                    </p>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 进度条 + 时间 */}
          <div className="mb-5">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 accent-[#a78bfa] cursor-pointer"
              disabled={!currentSong}
            />
            <div className="flex justify-between text-xs text-[#555] mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制区：上一曲 / 播放 / 下一曲 + 模式 + 音量 */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={prev}
                disabled={!currentSong}
                className="p-3 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 disabled:opacity-30"
                aria-label="上一曲"
              >
                <SkipBack size={24} />
              </button>
              <button
                onClick={() => (playing ? pause() : play())}
                disabled={!currentSong}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#00d9ff] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-30"
                aria-label={playing ? "暂停" : "播放"}
              >
                {loadingUrlId ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : playing ? (
                  <Pause size={22} />
                ) : (
                  <Play size={22} />
                )}
              </button>
              <button
                onClick={next}
                disabled={!currentSong}
                className="p-3 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/5 disabled:opacity-30"
                aria-label="下一曲"
              >
                <SkipForward size={24} />
              </button>
            </div>

            <div className="flex items-center gap-4 flex-1 min-w-0 justify-end">
              {/* 播放模式切换 */}
              <button
                onClick={cycleMode}
                title={`播放模式：${modeLabel}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-[#a78bfa] hover:border-[#a78bfa]/40 hover:bg-white/5 transition-colors flex-shrink-0"
              >
                {modeIcon}
                <span className="text-xs">{modeLabel}</span>
              </button>
              {/* 音量滑块（弹性宽度，避免溢出边框） */}
              <div className="flex items-center gap-2 flex-1 min-w-[100px] max-w-[180px]">
                <Volume2 size={16} className="text-[#555] flex-shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="min-w-0 w-full flex-1 h-1 accent-[#a78bfa] cursor-pointer"
                />
                <span className="text-xs text-[#555] w-8 text-right flex-shrink-0">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* 播放列表（可删除歌曲） */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#a8b2c1] flex items-center gap-1.5">
                <ListMusic size={12} /> 播放列表（{playlist.length}）
              </span>
              {playlist.length > 0 && (
                <button
                  onClick={clearPlaylist}
                  className="flex items-center gap-1 text-xs text-[#a8b2c1] hover:text-[#f472b6] transition-colors"
                  aria-label="清空播放列表"
                >
                  <Trash2 size={12} /> 清空
                </button>
              )}
            </div>
            <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1">
              {playlist.length === 0 ? (
                <p className="text-[#555] text-sm text-center py-6">
                  搜索歌曲并点击「+」加入播放列表
                </p>
              ) : (
                playlist.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => loadAndPlay(song, undefined, true)}
                    className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors ${
                      currentSong?.id === song.id ? "bg-white/10" : ""
                    }`}
                  >
                    {currentSong?.id === song.id && playing ? (
                      <EqBars className="h-3" />
                    ) : (
                      <Music2 size={15} className="text-[#555] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          currentSong?.id === song.id ? "text-white" : "text-white/80"
                        }`}
                      >
                        {song.name}
                      </p>
                      <p className="text-[#a8b2c1] text-xs truncate">
                        {song.artists}
                        {song.duration ? ` · ${formatTime(song.duration)}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromPlaylist(song.id);
                      }}
                      className="text-white/30 hover:text-[#f472b6] transition-colors p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100"
                      aria-label="从播放列表移除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
