interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

export default function LoadingSpinner({ size = 'md', label }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 py-8">
      <div className={`${sizes[size]} animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600`} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
