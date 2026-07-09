export type StoryStatus = 'draft' | 'generating' | 'completed';

export interface StoryPage {
  id: string;
  pageNumber: number;
  narration: string;
  imageUrl: string | null;
}

export interface Story {
  id: string;
  title: string;
  prompt: string;
  artStyle: string;
  tone: string;
  numPages: number;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
  pages: StoryPage[];
}

export interface StoryFormData {
  prompt: string;
  artStyle: string;
  tone: string;
  numPages: number;
}

export const ART_STYLES = [
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'anime', label: 'Anime' },
  { value: 'pencil', label: 'Pencil Sketch' },
  { value: 'digital', label: 'Digital Art' },
  { value: 'oil', label: 'Oil Painting' },
  { value: 'pixel', label: 'Pixel Art' },
];

export const TONES = [
  { value: 'whimsical', label: 'Whimsical' },
  { value: 'dark', label: 'Dark' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'educational', label: 'Educational' },
  { value: 'calm', label: 'Calm' },
];
