"use client";

const FALLBACK = "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&h=300&fit=crop";

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function ActivityImage({ src, alt, className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = FALLBACK;
      }}
    />
  );
}
