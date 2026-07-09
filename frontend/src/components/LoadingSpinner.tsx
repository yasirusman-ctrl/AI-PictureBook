interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

export default function LoadingSpinner({ size = 'md', label }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className={`${sizes[size]} animate-spin border-2 border-mc-border border-t-mc-accent`} />
      {label && <p className="font-pixel-body text-lg text-mc-text-muted">{label}</p>}
    </div>
  );
}
