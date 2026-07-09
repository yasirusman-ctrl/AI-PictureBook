import type { StoryPage } from '../types';

interface Props {
  pages: StoryPage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function ImageGallery({ pages, selectedIndex, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {pages.map((page, index) => (
        <button
          key={page.id}
          onClick={() => onSelect(index)}
          className={`relative overflow-hidden rounded-lg border-2 transition-all ${
            index === selectedIndex
              ? 'border-indigo-500 ring-2 ring-indigo-300'
              : 'border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="aspect-[3/4] overflow-hidden bg-gray-100">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <span className="text-xs font-medium text-white">Page {page.pageNumber}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
