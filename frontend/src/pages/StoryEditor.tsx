import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStoryStore } from '../store/storyStore';
import type { StoryFormData } from '../types';
import StoryPrompt from '../components/StoryPrompt';
import PagePreview from '../components/PagePreview';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ExportModal from '../components/ExportModal';

export default function StoryEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [showExport, setShowExport] = useState(false);

  const {
    currentStory, isLoading, error, generationProgress,
    createStory, fetchStory, setCurrentStory, generateOutline, generateAllImages, clearError,
  } = useStoryStore();

  useEffect(() => {
    if (!isNew && id) {
      fetchStory(id);
    } else {
      setCurrentStory(null);
    }
    return () => { setCurrentStory(null); };
  }, [id, isNew, fetchStory, setCurrentStory]);

  const handleCreate = async (data: StoryFormData) => {
    const storyId = await createStory(data);
    if (storyId) {
      navigate(`/stories/${storyId}`, { replace: true });
    }
  };

  const handleGenerateOutline = async () => {
    if (currentStory) {
      await generateOutline(currentStory.id);
    }
  };

  const handleGenerateImages = async () => {
    if (currentStory) {
      await generateAllImages(currentStory.id);
    }
  };

  const hasOutline = currentStory?.pages.some(p => p.narration);
  const allImagesGenerated = currentStory?.pages.every(p => p.imageUrl);
  const hasSomeImages = currentStory?.pages.some(p => p.imageUrl);

  if (isNew) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Create New Story</h1>
        {error && <div className="mb-4"><ErrorMessage message={error} onDismiss={clearError} /></div>}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <StoryPrompt onSubmit={handleCreate} isLoading={isLoading} />
        </div>
      </div>
    );
  }

  if (isLoading && !currentStory) {
    return <LoadingSpinner size="lg" label="Loading story..." />;
  }

  if (!currentStory) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Story not found.</p>
        <Link to="/" className="mt-2 inline-block text-indigo-600 hover:underline">Back to Stories</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-indigo-600 hover:underline">&larr; Back to Stories</Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{currentStory.title}</h1>
          <p className="text-sm text-gray-500">
            {currentStory.artStyle} &middot; {currentStory.tone} &middot; {currentStory.numPages} pages
          </p>
        </div>
        <div className="flex gap-2">
          {(hasSomeImages || currentStory.status === 'completed') && (
            <button
              onClick={() => setShowExport(true)}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {/* Generation Progress */}
      {generationProgress > 0 && generationProgress < 100 && (
        <ProgressBar progress={generationProgress} label="Generating images..." />
      )}

      {/* Outline Generation */}
      {!hasOutline && currentStory.status === 'draft' && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Story Configuration</h2>
          <StoryPrompt
            initialData={{
              prompt: currentStory.prompt || currentStory.title,
              artStyle: currentStory.artStyle,
              tone: currentStory.tone,
              numPages: currentStory.numPages,
            }}
            onSubmit={handleGenerateOutline}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Outline Display */}
      {hasOutline && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Story Pages</h2>
            {!allImagesGenerated && (
              <button
                onClick={handleGenerateImages}
                disabled={isLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading && generationProgress === 0 ? 'Generating...' : 'Generate All Images'}
              </button>
            )}
            {allImagesGenerated && (
              <span className="text-sm text-green-600 font-medium">All images generated</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {currentStory.pages.map((page, index) => (
              <Link key={page.id} to={`/stories/${currentStory.id}/pages/${index}`}>
                <PagePreview page={page} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && currentStory && (
        <ExportModal story={currentStory} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
