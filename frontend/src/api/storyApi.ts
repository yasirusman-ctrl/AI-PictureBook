import type { Story, StoryFormData } from '../types';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const sampleNarrations: Record<string, string[]> = {
  whimsical: [
    'In a land where colors danced and sang, there lived a young dreamer named Elara who could paint with starlight.',
    'Elara\'s brush dipped into a pool of moonlight, and with a flick of her wrist, she painted a bridge of pure silver across the sky.',
    'The creatures of the night gathered to watch—glowing butterflies, talking foxes, and trees that hummed ancient lullabies.',
    'Each stroke of her brush brought forth wonders unseen, and the world below began to believe in magic once again.',
  ],
  dark: [
    'The old house on Hemlock Lane had stood empty for decades, its windows like hollow eyes staring into the soul.',
    'When Marcus first crossed the threshold, the floorboards groaned as if warning him to turn back while he still could.',
    'The walls whispered secrets in a language older than time, and shadows moved of their own accord in the corner of his vision.',
    'In the deepest cellar, he found a door that should not exist—pulsing with a light that promised answers no living mind should know.',
  ],
  humorous: [
    'Sir Reginald the Unremarkable was possibly the worst knight in all the kingdom—he was terrified of horses and allergic to armor.',
    'When the royal cook quit to join a monastery, Reginald was tasked with preparing the king\'s birthday feast, a disaster waiting to happen.',
    'He mistook salt for sugar, chili for paprika, and somehow managed to set the kitchen curtains on fire without even lighting a match.',
    'The king declared it the most memorable meal of his life—not because it was good, but because no one would ever forget the sight of a flaming cake.',
  ],
  dramatic: [
    'Captain Astra stood at the helm of the Starfire, staring into the void where her homeworld had once been.',
    'The signal had come without warning—a distress call from a dimension thought to be merely theoretical.',
    'Her crew braced as the ship lurched through the rift, reality bending around them like light through warped glass.',
    'What they found on the other side would change humanity\'s understanding of existence itself.',
  ],
  educational: [
    'Did you know that a single teaspoon of soil contains more living organisms than there are people on Earth?',
    'Beneath your feet lies an entire universe of tiny creatures, each playing a vital role in keeping our planet healthy.',
    'Earthworms are nature\'s plow, turning and aerating the soil as they digest organic matter.',
    'Bacteria and fungi form complex networks underground, communicating and sharing nutrients like an internet beneath our feet.',
  ],
  calm: [
    'The morning sun filtered through the bamboo forest, casting long golden stripes across the mossy path.',
    'A gentle stream wandered alongside the trail, its soft murmur blending with the rustle of leaves overhead.',
    'She paused at the old wooden bridge, watching how the light played on the water\'s surface like scattered jewels.',
    'In this moment, there was nowhere to be and nothing to do—just the quiet beauty of being alive.',
  ],
};

const imageSeed = (storyId: string, pageId: string) => {
  const hash = storyId.length + pageId.length;
  return `story-${hash}-${Date.now()}`;
};

interface MockDB {
  stories: Story[];
}
const db: MockDB = { stories: [] };
let nextId = 1;

function makeStory(data: StoryFormData): Story {
  const id = `story-${nextId++}`;
  const now = new Date().toISOString();
  const narrations = sampleNarrations[data.tone] || sampleNarrations.whimsical;
  return {
    id,
    title: data.prompt.slice(0, 40) + (data.prompt.length > 40 ? '...' : ''),
    prompt: data.prompt,
    artStyle: data.artStyle,
    tone: data.tone,
    numPages: data.numPages,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    pages: Array.from({ length: data.numPages }, (_, i) => ({
      id: `page-${id}-${i + 1}`,
      pageNumber: i + 1,
      narration: narrations[i] || '',
      imageUrl: null,
    })),
  };
}

export async function fetchStories(): Promise<Story[]> {
  await delay(400);
  return [...db.stories];
}

export async function createStory(data: StoryFormData): Promise<Story> {
  await delay(600);
  const story = makeStory(data);
  db.stories.push(story);
  return { ...story, pages: story.pages.map(p => ({ ...p })) };
}

export async function getStory(id: string): Promise<Story | undefined> {
  await delay(300);
  return db.stories.find(s => s.id === id);
}

export async function updateStory(id: string, updates: Partial<Story>): Promise<Story | undefined> {
  await delay(300);
  const idx = db.stories.findIndex(s => s.id === id);
  if (idx === -1) return undefined;
  db.stories[idx] = { ...db.stories[idx], ...updates, updatedAt: new Date().toISOString() };
  return { ...db.stories[idx] };
}

export async function deleteStory(id: string): Promise<void> {
  await delay(400);
  db.stories = db.stories.filter(s => s.id !== id);
}

export async function generateOutline(storyId: string): Promise<Story | undefined> {
  await delay(1500);
  const idx = db.stories.findIndex(s => s.id === storyId);
  if (idx === -1) return undefined;
  const story = db.stories[idx];
  const narrations = sampleNarrations[story.tone] || sampleNarrations.whimsical;
  story.pages.forEach((page, i) => {
    page.narration = narrations[i % narrations.length];
  });
  story.status = 'draft';
  story.updatedAt = new Date().toISOString();
  return { ...story, pages: story.pages.map(p => ({ ...p })) };
}

export async function generateImage(storyId: string, pageId: string): Promise<string> {
  await delay(2000);
  const seed = imageSeed(storyId, pageId);
  return `https://picsum.photos/seed/${seed}/600/800`;
}

export async function generateImagesForStory(storyId: string, onProgress?: (progress: number) => void): Promise<Story | undefined> {
  const idx = db.stories.findIndex(s => s.id === storyId);
  if (idx === -1) return undefined;
  const story = db.stories[idx];
  story.status = 'generating';
  story.updatedAt = new Date().toISOString();

  for (let i = 0; i < story.pages.length; i++) {
    await delay(1500);
    const seed = imageSeed(storyId, story.pages[i].id);
    story.pages[i].imageUrl = `https://picsum.photos/seed/${seed}/600/800`;
    onProgress?.(Math.round(((i + 1) / story.pages.length) * 100));
  }

  story.status = 'completed';
  story.updatedAt = new Date().toISOString();
  return { ...story, pages: story.pages.map(p => ({ ...p })) };
}

export async function updatePageNarration(storyId: string, pageId: string, narration: string): Promise<Story | undefined> {
  await delay(200);
  const idx = db.stories.findIndex(s => s.id === storyId);
  if (idx === -1) return undefined;
  const story = db.stories[idx];
  const page = story.pages.find(p => p.id === pageId);
  if (!page) return undefined;
  page.narration = narration;
  story.updatedAt = new Date().toISOString();
  return { ...story, pages: story.pages.map(p => ({ ...p })) };
}
