import type { Story, StoryFormData, StoryPage } from '../types';

const API_BASE = 'http://localhost:8000/api/stories';

interface BackendPage {
  id: number;
  page_number: number;
  narration: string | null;
  image_prompt: string | null;
  image_path: string | null;
  status: string;
}

interface BackendStory {
  id: number;
  title: string;
  description: string | null;
  status: string;
  style: string | null;
  tone: string | null;
  num_pages: number;
  created_at: string;
  updated_at: string;
}

function toPage(p: BackendPage): StoryPage {
  return {
    id: String(p.id),
    pageNumber: p.page_number,
    narration: p.narration || '',
    imageUrl: p.image_path || null,
  };
}

function toStory(s: BackendStory, pages: BackendPage[] = []): Story {
  return {
    id: String(s.id),
    title: s.title,
    prompt: s.description || '',
    artStyle: s.style || '',
    tone: s.tone || '',
    numPages: s.num_pages,
    status: s.status as Story['status'],
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    pages: pages.map(toPage),
  };
}

export async function fetchStories(): Promise<Story[]> {
  const res = await fetch(`${API_BASE}`);
  if (!res.ok) throw new Error(`Failed to fetch stories: ${res.statusText}`);
  const data: BackendStory[] = await res.json();
  return data.map(s => toStory(s));
}

export async function createStory(data: StoryFormData): Promise<Story> {
  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concept: data.prompt,
      style: data.artStyle,
      tone: data.tone,
      num_pages: data.numPages,
    }),
  });
  if (!res.ok) throw new Error(`Failed to create story: ${res.statusText}`);
  const story: BackendStory = await res.json();
  return toStory(story);
}

export async function getStory(id: string): Promise<Story | undefined> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to get story: ${res.statusText}`);
  const data = await res.json();
  const story: BackendStory = data;
  const pages: BackendPage[] = data.pages || [];
  return toStory(story, pages);
}

export async function updateStory(id: string, _updates: Partial<Story>): Promise<Story | undefined> {
  const res = await fetch(`${API_BASE}/${id}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to get story: ${res.statusText}`);
  const story: BackendStory = await res.json();
  return toStory(story);
}

export async function deleteStory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete story: ${res.statusText}`);
}

export async function generateOutline(storyId: string): Promise<Story | undefined> {
  const res = await fetch(`${API_BASE}/${storyId}/generate-story`, {
    method: 'POST',
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to generate outline: ${res.statusText}`);
  const data = await res.json();
  const story: BackendStory = data.story;
  const pages: BackendPage[] = data.story?.pages || [];
  return toStory(story, pages);
}

export async function generateImage(storyId: string, pageId: string): Promise<string> {
  const storyRes = await fetch(`${API_BASE}/${storyId}`);
  if (!storyRes.ok) throw new Error(`Failed to fetch story: ${storyRes.statusText}`);
  const storyData = await storyRes.json();
  const page = (storyData.pages || []).find((p: BackendPage) => String(p.id) === pageId);
  if (!page) throw new Error(`Page ${pageId} not found`);

  const res = await fetch(`${API_BASE}/${storyId}/pages/${page.page_number}/regenerate-image`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to generate image: ${res.statusText}`);
  const data = await res.json();
  return data.page?.image_path || '';
}

export async function generateImagesForStory(storyId: string, onProgress?: (progress: number) => void): Promise<Story | undefined> {
  const res = await fetch(`${API_BASE}/${storyId}/generate-images`, {
    method: 'POST',
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to generate images: ${res.statusText}`);

  onProgress?.(100);

  const storyRes = await fetch(`${API_BASE}/${storyId}`);
  if (!storyRes.ok) throw new Error(`Failed to fetch updated story: ${storyRes.statusText}`);
  const data = await storyRes.json();
  return toStory(data, data.pages || []);
}

export async function updatePageNarration(storyId: string, pageId: string, narration: string): Promise<Story | undefined> {
  const storyRes = await fetch(`${API_BASE}/${storyId}`);
  if (!storyRes.ok) throw new Error(`Failed to fetch story: ${storyRes.statusText}`);
  const storyData = await storyRes.json();
  const page = (storyData.pages || []).find((p: BackendPage) => String(p.id) === pageId);
  if (!page) throw new Error(`Page ${pageId} not found`);

  const res = await fetch(`${API_BASE}/${storyId}/pages/${page.page_number}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ narration }),
  });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Failed to update page: ${res.statusText}`);

  const updatedStoryRes = await fetch(`${API_BASE}/${storyId}`);
  if (!updatedStoryRes.ok) throw new Error(`Failed to fetch updated story: ${updatedStoryRes.statusText}`);
  const updatedData = await updatedStoryRes.json();
  return toStory(updatedData, updatedData.pages || []);
}
