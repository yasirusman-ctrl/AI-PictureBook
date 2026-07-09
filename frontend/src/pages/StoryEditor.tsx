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
        <h1 className="mb-6 font-pixel-heading text-sm text-mc-text">Create New Story</h1>
        {error && <div className="mb-4"><ErrorMessage message={error} onDismiss={clearError} /></div>}
        <div className="pixel-card p-6">
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
      <div className="py-12 text-center">
        <p className="font-pixel-body text-lg text-mc-text-muted">Story not found.</p>
        <Link to="/" className="mt-2 inline-block font-pixel-heading text-[10px] text-mc-link hover:text-mc-accent">Back to Stories</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="font-pixel-heading text-[10px] text-mc-link hover:text-mc-accent">&larr; Back</Link>
          <h1 className="mt-1 font-pixel-heading text-sm text-mc-text">{currentStory.title}</h1>
          <p className="font-pixel-body text-base text-mc-text-muted">
            {currentStory.artStyle} | {currentStory.tone} | {currentStory.numPages} pages
          </p>
        </div>
        <div className="flex gap-2">
          {(hasSomeImages || currentStory.status === 'completed') && (
            <button
              onClick={() => setShowExport(true)}
              className="pixel-btn bg-mc-accent2 px-4 py-2 text-white"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={clearError} />}

      {generationProgress > 0 && generationProgress < 100 && (
        <ProgressBar progress={generationProgress} label="Generating images..." />
      )}

      {!hasOutline && currentStory.status === 'draft' && (
        <div className="pixel-card p-6">
          <h2 className="mb-4 font-pixel-heading text-xs text-mc-text">Story Configuration</h2>
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

      {hasOutline && (
        <div className="pixel-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-pixel-heading text-xs text-mc-text">Story Pages</h2>
            {!allImagesGenerated && (
              <button
                onClick={handleGenerateImages}
                disabled={isLoading}
                className="pixel-btn bg-mc-accent px-4 py-2 text-white disabled:opacity-40"
              >
                {isLoading && generationProgress === 0 ? 'Generating...' : 'Generate All Images'}
              </button>
            )}
            {allImagesGenerated && (
              <span className="font-pixel-heading text-[10px] text-mc-accent">All images generated</span>
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

      {showExport && currentStory && (
        <ExportModal story={currentStory} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}
