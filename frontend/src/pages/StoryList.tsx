import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStoryStore } from '../store/storyStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const statusStyles: Record<string, string> = {
  draft: 'border-yellow-600 text-yellow-400',
  generating: 'border-blue-600 text-blue-400',
  completed: 'border-mc-accent text-mc-accent',
};

export default function StoryList() {
  const navigate = useNavigate();
  const { stories, isLoading, error, fetchStories, deleteStory, clearError } = useStoryStore();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this story?')) {
      await deleteStory(id);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-pixel-heading text-sm text-mc-text">My Stories</h1>
        <Link
          to="/stories/new"
          className="pixel-btn bg-mc-accent px-4 py-2 text-white"
        >
          + CREATE
        </Link>
      </div>

      {error && <div className="mb-4"><ErrorMessage message={error} onDismiss={clearError} /></div>}

      {isLoading ? (
        <LoadingSpinner size="lg" label="Loading stories..." />
      ) : stories.length === 0 ? (
        <div className="pixel-card p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-mc-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-4 font-pixel-heading text-xs text-mc-text">No stories yet</h3>
          <p className="mt-2 font-pixel-body text-lg text-mc-text-muted">Create your first story to get started.</p>
          <Link
            to="/stories/new"
            className="mt-4 inline-block pixel-btn bg-mc-accent px-4 py-2 text-white"
          >
            Create Your First Story
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <div
              key={story.id}
              onClick={() => navigate(`/stories/${story.id}`)}
              className="pixel-card cursor-pointer p-4 transition-opacity hover:opacity-90"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="font-pixel-heading text-[10px] text-mc-text line-clamp-2">{story.title}</h3>
                <span className={`pixel-badge shrink-0 ${statusStyles[story.status]} bg-mc-surface-alt`}>
                  {story.status}
                </span>
              </div>
              <p className="mb-3 font-pixel-body text-base text-mc-text-muted line-clamp-2">{story.prompt}</p>
              <div className="flex items-center justify-between font-pixel-body text-sm text-mc-text-muted">
                <span>{story.pages?.length || 0} pages</span>
                <span>{new Date(story.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-3 flex justify-end border-t-2 border-mc-border pt-2">
                <button
                  onClick={(e) => handleDelete(story.id, e)}
                  className="font-pixel-heading text-[9px] text-mc-danger hover:text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
