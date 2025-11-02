import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import type { Reciter } from '../../types/quran';
import { loadReciters } from '../../utils/audioTimings';

interface ReciterSelectorProps {
  selectedReciterId: number | null;
  onReciterChange: (reciter: Reciter) => void;
}

export default function ReciterSelector({
  selectedReciterId,
  onReciterChange,
}: ReciterSelectorProps) {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadReciters().then(setReciters).catch(console.error);
  }, []);

  const selectedReciter = reciters.find((r) => r.id === selectedReciterId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors w-full"
        dir="rtl"
      >
        <Music className="w-5 h-5 text-emerald-500" />
        <span className="flex-1 text-right">
          {selectedReciter ? selectedReciter.arabicName : 'اختر القارئ'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            {reciters.map((reciter) => (
              <button
                key={reciter.id}
                onClick={() => {
                  onReciterChange(reciter);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  selectedReciterId === reciter.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : ''
                }`}
                dir="rtl"
              >
                <div className="font-medium">{reciter.arabicName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {reciter.style} • {reciter.country}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
