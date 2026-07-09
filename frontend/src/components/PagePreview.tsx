import type { StoryPage } from '../types';

interface Props {
  page: StoryPage;
  onClick?: () => void;
}

export default function PagePreview({ page, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer pixel-card overflow-hidden transition-opacity hover:opacity-90"
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
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="border-t-2 border-mc-border p-2">
        <p className="font-pixel-heading text-[8px] text-mc-text-muted">PAGE {page.pageNumber}</p>
        <p className="mt-1 line-clamp-2 font-pixel-body text-sm leading-tight text-mc-text">
          {page.narration || 'No narration yet'}
        </p>
      </div>
    </div>
  );
}
