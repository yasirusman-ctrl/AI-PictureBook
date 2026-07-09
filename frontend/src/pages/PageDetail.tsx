import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStoryStore } from '../store/storyStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function PageDetail() {
  const { id, pageIndex } = useParams<{ id: string; pageIndex: string }>();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const {
    currentStory, isLoading, error,
    fetchStory, updatePageNarration, regenerateImage, clearError,
  } = useStoryStore();

  useEffect(() => {
    if (id) fetchStory(id);
  }, [id, fetchStory]);

  if (isLoading && !currentStory) {
    return <LoadingSpinner size="lg" label="Loading page..." />;
  }

  if (!currentStory) {
    return (
      <div className="py-12 text-center">
        <p className="font-pixel-body text-lg text-mc-text-muted">Story not found.</p>
        <Link to="/" className="mt-2 inline-block font-pixel-heading text-[10px] text-mc-link hover:text-mc-accent">Back to Stories</Link>
      </div>
    );
  }

  const idx = Number(pageIndex) || 0;
  const page = currentStory.pages[idx];

  if (!page) {
    return (
      <div className="py-12 text-center">
        <p className="font-pixel-body text-lg text-mc-text-muted">Page not found.</p>
        <Link to={`/stories/${id}`} className="mt-2 inline-block font-pixel-heading text-[10px] text-mc-link hover:text-mc-accent">Back</Link>
      </div>
    );
  }

  const handleSaveNarration = async () => {
    if (!id) return;
    await updatePageNarration(id, page.id, editText);
    setEditing(false);
  };

  const handleRegenerate = async () => {
    if (!id) return;
    await regenerateImage(id, page.id);
  };

  const prevPage = idx > 0 ? idx - 1 : null;
  const nextPage = idx < currentStory.pages.length - 1 ? idx + 1 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to={`/stories/${id}`} className="font-pixel-heading text-[10px] text-mc-link hover:text-mc-accent">
            &larr; Back
          </Link>
          <h1 className="mt-1 font-pixel-heading text-sm text-mc-text">Page {page.pageNumber}</h1>
        </div>
        <div className="flex gap-2">
          {prevPage !== null && (
            <Link
              to={`/stories/${id}/pages/${prevPage}`}
              className="pixel-btn bg-mc-surface-alt px-3 py-2 text-mc-text"
            >
              PREV
            </Link>
          )}
          {nextPage !== null && (
            <Link
              to={`/stories/${id}/pages/${nextPage}`}
              className="pixel-btn bg-mc-surface-alt px-3 py-2 text-mc-text"
            >
              NEXT
            </Link>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="pixel-card p-5">
          <h2 className="mb-4 font-pixel-heading text-xs text-mc-text">Narration</h2>
          {editing ? (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="pixel-input block w-full px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNarration}
                  disabled={isLoading}
                  className="pixel-btn bg-mc-accent px-4 py-2 text-white disabled:opacity-40"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="pixel-btn bg-mc-surface-alt px-4 py-2 text-mc-text"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 whitespace-pre-wrap font-pixel-body text-lg leading-tight text-mc-text">
                {page.narration || 'No narration yet.'}
              </p>
              <button
                onClick={() => { setEditText(page.narration); setEditing(true); }}
                className="font-pixel-heading text-[10px] text-mc-link hover:text-mc-accent"
              >
                Edit Narration
              </button>
            </div>
          )}
        </div>

        <div className="pixel-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-pixel-heading text-xs text-mc-text">Image</h2>
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="pixel-btn bg-mc-accent px-4 py-2 text-white disabled:opacity-40"
            >
              {isLoading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
          <div className="aspect-[3/4] overflow-hidden border-2 border-mc-border bg-mc-bg">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-mc-text-muted">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 font-pixel-body text-base">No image yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pixel-card flex items-center justify-between p-4">
        <div className="font-pixel-body text-base text-mc-text-muted">
          Page {page.pageNumber} of {currentStory.pages.length}
        </div>
        <div className="flex gap-2">
          {prevPage !== null && (
            <Link
              to={`/stories/${id}/pages/${prevPage}`}
              className="pixel-btn bg-mc-surface-alt px-3 py-2 text-mc-text"
            >
              &larr; PREV
            </Link>
          )}
          {nextPage !== null && (
            <Link
              to={`/stories/${id}/pages/${nextPage}`}
              className="pixel-btn bg-mc-surface-alt px-3 py-2 text-mc-text"
            >
              NEXT &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
