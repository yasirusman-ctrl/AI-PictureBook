import { useForm } from 'react-hook-form';
import type { StoryFormData } from '../types';
import { ART_STYLES, TONES } from '../types';

interface Props {
  initialData?: Partial<StoryFormData>;
  onSubmit: (data: StoryFormData) => void;
  isLoading?: boolean;
}

export default function StoryPrompt({ initialData, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<StoryFormData>({
    defaultValues: {
      prompt: '',
      artStyle: 'watercolor',
      tone: 'whimsical',
      numPages: 3,
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="prompt" className="mb-1 block font-pixel-heading text-[10px] text-mc-text-muted">
          Story Concept
        </label>
        <textarea
          id="prompt"
          rows={4}
          className="pixel-input block w-full px-3 py-2"
          placeholder="Describe your story idea..."
          {...register('prompt', { required: 'Please enter a story concept' })}
        />
        {errors.prompt && (
          <p className="mt-1 font-pixel-body text-sm text-mc-danger">{errors.prompt.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="artStyle" className="mb-1 block font-pixel-heading text-[10px] text-mc-text-muted">
            Art Style
          </label>
          <select
            id="artStyle"
            className="pixel-input block w-full px-3 py-2"
            {...register('artStyle')}
          >
            {ART_STYLES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tone" className="mb-1 block font-pixel-heading text-[10px] text-mc-text-muted">
            Tone
          </label>
          <select
            id="tone"
            className="pixel-input block w-full px-3 py-2"
            {...register('tone')}
          >
            {TONES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numPages" className="mb-1 block font-pixel-heading text-[10px] text-mc-text-muted">
            Pages
          </label>
          <input
            id="numPages"
            type="number"
            min={1}
            max={10}
            className="pixel-input block w-full px-3 py-2"
            {...register('numPages', {
              min: { value: 1, message: 'Min 1 page' },
              max: { value: 10, message: 'Max 10 pages' },
            })}
          />
          {errors.numPages && (
            <p className="mt-1 font-pixel-body text-sm text-mc-danger">{errors.numPages.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="pixel-btn w-full bg-mc-accent px-4 py-3 text-white disabled:opacity-40"
      >
        {isLoading ? 'Generating...' : 'Generate Outline'}
      </button>
    </form>
  );
}
