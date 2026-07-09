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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
          Story Concept
        </label>
        <textarea
          id="prompt"
          rows={4}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Describe your story idea..."
          {...register('prompt', { required: 'Please enter a story concept' })}
        />
        {errors.prompt && (
          <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="artStyle" className="block text-sm font-medium text-gray-700">
            Art Style
          </label>
          <select
            id="artStyle"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            {...register('artStyle')}
          >
            {ART_STYLES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-gray-700">
            Tone
          </label>
          <select
            id="tone"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            {...register('tone')}
          >
            {TONES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="numPages" className="block text-sm font-medium text-gray-700">
            Number of Pages
          </label>
          <input
            id="numPages"
            type="number"
            min={1}
            max={10}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            {...register('numPages', {
              min: { value: 1, message: 'Minimum 1 page' },
              max: { value: 10, message: 'Maximum 10 pages' },
            })}
          />
          {errors.numPages && (
            <p className="mt-1 text-sm text-red-600">{errors.numPages.message}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? 'Generating...' : 'Generate Story Outline'}
      </button>
    </form>
  );
}
