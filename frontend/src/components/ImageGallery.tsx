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
          className={`relative overflow-hidden border-2 transition-opacity hover:opacity-90 ${
            index === selectedIndex ? 'border-mc-accent' : 'border-mc-border'
          }`}
        >
          <div className="aspect-[3/4] overflow-hidden bg-mc-bg">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-cover"
                loading="lazy"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-mc-text-muted">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-mc-bg/80 p-1">
            <span className="font-pixel-heading text-[8px] text-mc-text">PAGE {page.pageNumber}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
