import { useState } from 'react';
import Dashboard from './Dashboard';
import ReviewMode from './ReviewMode';
import type { Surah } from '../../types/quran';

interface MemorizationCenterProps {
  surahs: Surah[];
  onBack: () => void;
  onSurahSelect: (surahNumber: number) => void;
}

const MemorizationCenter = ({ surahs, onBack, onSurahSelect }: MemorizationCenterProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">مركز الحفظ</h2>
        <button onClick={onBack} className="text-emerald-600 hover:underline">
          العودة إلى قائمة السور
        </button>
      </div>

      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'dashboard' ? 'border-b-2 border-emerald-500' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          لوحة المعلومات
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'review' ? 'border-b-2 border-emerald-500' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          المراجعة
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <Dashboard surahs={surahs} onSurahSelect={onSurahSelect} />
      )}
      {activeTab === 'review' && (
        <ReviewMode
          surahs={surahs}
          onBack={() => setActiveTab('dashboard')}
          onAyahReview={(surahNumber, ayahNumber, correct) => {
            console.log(`Reviewed ayah ${ayahNumber} of surah ${surahNumber}: ${correct ? 'Correct' : 'Incorrect'}`);
          }}
        />
      )}
    </div>
  );
};

export default MemorizationCenter;
