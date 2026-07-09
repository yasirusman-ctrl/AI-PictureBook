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
        <p className="text-gray-500">Story not found.</p>
        <Link to="/" className="mt-2 inline-block text-indigo-600 hover:underline">Back to Stories</Link>
      </div>
    );
  }

  const idx = Number(pageIndex) || 0;
  const page = currentStory.pages[idx];

  if (!page) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Page not found.</p>
        <Link to={`/stories/${id}`} className="mt-2 inline-block text-indigo-600 hover:underline">Back to Editor</Link>
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
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/stories/${id}`} className="text-sm text-indigo-600 hover:underline">
            &larr; Back to Editor
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Page {page.pageNumber}</h1>
        </div>
        <div className="flex gap-2">
          {prevPage !== null && (
            <Link
              to={`/stories/${id}/pages/${prevPage}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          {nextPage !== null && (
            <Link
              to={`/stories/${id}/pages/${nextPage}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Narration */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Narration</h2>
          {editing ? (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNarration}
                  disabled={isLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4 whitespace-pre-wrap text-gray-700">
                {page.narration || 'No narration yet.'}
              </p>
              <button
                onClick={() => { setEditText(page.narration); setEditing(true); }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Edit Narration
              </button>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Image</h2>
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Regenerate'}
            </button>
          </div>
          <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
            {page.imageUrl ? (
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm">No image yet</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div className="text-sm text-gray-500">
          Page {page.pageNumber} of {currentStory.pages.length}
        </div>
        <div className="flex gap-2">
          {prevPage !== null && (
            <Link
              to={`/stories/${id}/pages/${prevPage}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              &larr; Previous Page
            </Link>
          )}
          {nextPage !== null && (
            <Link
              to={`/stories/${id}/pages/${nextPage}`}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Next Page &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
