import { useEffect, useState } from 'react';
import { Volume2, Play, Pause, SkipForward, SkipBack, Repeat, Repeat1 } from 'lucide-react';
import type { Reciter } from '../../types/quran';

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  repeat: 'none' | 'ayah' | 'continuous';
  reciter: Reciter | null;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onRepeatChange: (repeat: 'none' | 'ayah' | 'continuous') => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function AudioControls({
  isPlaying,
  currentTime,
  duration,
  playbackSpeed,
  repeat,
  reciter,
  onPlay,
  onPause,
  onSeek,
  onSpeedChange,
  onRepeatChange,
  onNext,
  onPrevious,
}: AudioControlsProps) {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const toggleRepeat = () => {
    const modes: Array<'none' | 'ayah' | 'continuous'> = ['none', 'ayah', 'continuous'];
    const currentIndex = modes.indexOf(repeat);
    const nextIndex = (currentIndex + 1) % modes.length;
    onRepeatChange(modes[nextIndex]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      {reciter && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
          القارئ: {reciter.arabicName} • {reciter.style}
        </div>
      )}

      <div
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center gap-4">
        {onPrevious && (
          <button
            onClick={onPrevious}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="الآية السابقة"
          >
            <SkipBack className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={isPlaying ? onPause : onPlay}
          className="p-4 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
          title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        {onNext && (
          <button
            onClick={onNext}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="الآية التالية"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={toggleRepeat}
          className={`p-2 rounded-full transition-colors ${
            repeat !== 'none'
              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={
            repeat === 'none'
              ? 'التكرار: معطل'
              : repeat === 'ayah'
              ? 'التكرار: آية واحدة'
              : 'التكرار: مستمر'
          }
        >
          {repeat === 'ayah' ? (
            <Repeat1 className="w-5 h-5" />
          ) : (
            <Repeat className="w-5 h-5" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            title="سرعة التشغيل"
          >
            {playbackSpeed}x
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
              {speeds.map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    onSpeedChange(speed);
                    setShowSpeedMenu(false);
                  }}
                  className={`block w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-right ${
                    playbackSpeed === speed
                      ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                      : ''
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
