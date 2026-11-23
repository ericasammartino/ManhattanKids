"use client";

/**
 * Logo slot: image when available, otherwise org name in Plus Jakarta Sans.
 * Do not invent placeholder logos.
 */
export default function OrgLogoMark({
  src,
  alt,
  textFallback,
  isLogo = false,
  className = "",
  textClassName = "",
}: {
  src: string | null;
  alt: string;
  textFallback?: string | null;
  isLogo?: boolean;
  className?: string;
  textClassName?: string;
}) {
  if (textFallback && !src) {
    return (
      <span
        className={`flex h-full w-full items-center justify-center px-2 text-center font-[family-name:var(--font-jakarta)] font-bold leading-tight tracking-tight text-[#1D2B4B] ${textClassName}`}
        role="img"
        aria-label={textFallback}
      >
        <span className="line-clamp-3">{textFallback}</span>
      </span>
    );
  }

  const resolved = src?.trim() || "";
  if (!resolved) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={(e) => {
        // Hide broken image; parent may still show provider name below.
        const img = e.target as HTMLImageElement;
        img.style.display = "none";
      }}
      data-is-logo={isLogo ? "true" : "false"}
    />
  );
}
