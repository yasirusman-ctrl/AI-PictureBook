import { create } from 'zustand';
import type { Story, StoryFormData } from '../types';
import * as api from '../api/storyApi';

interface StoryState {
  stories: Story[];
  currentStory: Story | null;
  selectedPageIndex: number;
  generationProgress: number;
  isLoading: boolean;
  error: string | null;

  fetchStories: () => Promise<void>;
  createStory: (data: StoryFormData) => Promise<string | undefined>;
  fetchStory: (id: string) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  setCurrentStory: (story: Story | null) => void;
  setSelectedPageIndex: (index: number) => void;
  setGenerationProgress: (progress: number) => void;
  updatePageNarration: (storyId: string, pageId: string, narration: string) => Promise<void>;
  regenerateImage: (storyId: string, pageId: string) => Promise<void>;
  generateOutline: (storyId: string) => Promise<void>;
  generateAllImages: (storyId: string) => Promise<void>;
  clearError: () => void;
}

export const useStoryStore = create<StoryState>((set, get) => ({
  stories: [],
  currentStory: null,
  selectedPageIndex: 0,
  generationProgress: 0,
  isLoading: false,
  error: null,

  fetchStories: async () => {
    set({ isLoading: true, error: null });
    try {
      const stories = await api.fetchStories();
      set({ stories, isLoading: false });
    } catch {
      set({ error: 'Failed to load stories', isLoading: false });
    }
  },

  createStory: async (data: StoryFormData) => {
    set({ isLoading: true, error: null });
    try {
      const story = await api.createStory(data);
      set(state => ({ stories: [...state.stories, story], isLoading: false }));
      return story.id;
    } catch {
      set({ error: 'Failed to create story', isLoading: false });
    }
  },

  fetchStory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const story = await api.getStory(id);
      set({ currentStory: story ?? null, isLoading: false });
    } catch {
      set({ error: 'Failed to load story', isLoading: false });
    }
  },

  deleteStory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteStory(id);
      set(state => ({
        stories: state.stories.filter(s => s.id !== id),
        isLoading: false,
      }));
    } catch {
      set({ error: 'Failed to delete story', isLoading: false });
    }
  },

  setCurrentStory: (story) => set({ currentStory: story }),

  setSelectedPageIndex: (index) => set({ selectedPageIndex: index }),

  setGenerationProgress: (progress) => set({ generationProgress: progress }),

  updatePageNarration: async (storyId, pageId, narration) => {
    try {
      const updated = await api.updatePageNarration(storyId, pageId, narration);
      if (updated) {
        set({ currentStory: updated });
        set(state => ({
          stories: state.stories.map(s => s.id === updated.id ? updated : s),
        }));
      }
    } catch {
      set({ error: 'Failed to update narration' });
    }
  },

  regenerateImage: async (storyId, pageId) => {
    set({ isLoading: true, error: null });
    try {
      const imageUrl = await api.generateImage(storyId, pageId);
      const current = get().currentStory;
      if (current) {
        const updatedPages = current.pages.map(p =>
          p.id === pageId ? { ...p, imageUrl } : p,
        );
        const updated = { ...current, pages: updatedPages };
        set({ currentStory: updated, isLoading: false });
      }
    } catch {
      set({ error: 'Failed to generate image', isLoading: false });
    }
  },

  generateOutline: async (storyId) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.generateOutline(storyId);
      if (updated) {
        set({ currentStory: updated });
        set(state => ({
          stories: state.stories.map(s => s.id === updated.id ? updated : s),
        }));
      }
      set({ isLoading: false });
    } catch {
      set({ error: 'Failed to generate outline', isLoading: false });
    }
  },

  generateAllImages: async (storyId) => {
    set({ generationProgress: 0, error: null });
    try {
      const updated = await api.generateImagesForStory(storyId, (progress) => {
        set({ generationProgress: progress });
      });
      if (updated) {
        set({ currentStory: updated, generationProgress: 100 });
        set(state => ({
          stories: state.stories.map(s => s.id === updated.id ? updated : s),
        }));
      }
    } catch {
      set({ error: 'Failed to generate images' });
    }
  },

  clearError: () => set({ error: null }),
}));
