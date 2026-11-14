"use client";

const FALLBACK = "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function ActivityImage({ src, alt, className }: Props) {
  const resolvedSrc = src?.trim() ? src : FALLBACK;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const img = e.target as HTMLImageElement;
        if (img.src !== FALLBACK) img.src = FALLBACK;
      }}
    />
  );
}
