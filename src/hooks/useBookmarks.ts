import { useLocalStorage } from './useLocalStorage';
import type { Bookmark } from '../types/quran';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('quran-bookmarks', []);

  const addBookmark = (surahNumber: number, ayahNumber: number, note?: string) => {
    const newBookmark: Bookmark = {
      id: `${surahNumber}-${ayahNumber}-${Date.now()}`,
      surahNumber,
      ayahNumber,
      timestamp: Date.now(),
      note,
    };
    setBookmarks([...bookmarks, newBookmark]);
  };

  const removeBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };

  const isBookmarked = (surahNumber: number, ayahNumber: number) => {
    return bookmarks.some(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
  };

  const getBookmark = (surahNumber: number, ayahNumber: number) => {
    return bookmarks.find(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmark,
  };
}
