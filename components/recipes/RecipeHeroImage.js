"use client";

import { useState } from "react";

function PhotoPlaceholder({ label, compact = false, fill = false }) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-2.5 px-6 text-center text-[#71836E] ${fill ? "h-full" : compact ? "min-h-32 sm:min-h-40" : "min-h-56 sm:min-h-80"}`}>
      <svg aria-hidden="true" className="size-12 text-[#849B7B] sm:size-14" fill="none" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="32" cy="32" r="15" stroke="#B7C8AE" strokeWidth="1.8" />
        <path d="M20 34c4-6 9-9 15-9 4 0 7 2 9 5M22 39c4-3 8-5 13-5" stroke="#C88057" strokeLinecap="round" strokeWidth="2" />
        <path d="M41 21c1-3 4-5 7-5-1 4-3 6-7 7M17 26c-2-2-3-5-2-8 4 2 5 4 5 7" fill="#DCE8D6" stroke="#849B7B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
      <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.14em] sm:text-xs">{label}</span>
    </div>
  );
}

export default function RecipeHeroImage({ src, alt, placeholderLabel }) {
  const [failed, setFailed] = useState(false);
  if (!src) return <PhotoPlaceholder label={placeholderLabel} compact />;

  return (
    <div className="relative aspect-[5/4] max-h-[30rem] w-full overflow-hidden bg-[#E8EEE2] sm:aspect-[2/1]">
      {failed ? <PhotoPlaceholder label={placeholderLabel} fill /> : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          fetchPriority="high"
          loading="eager"
          onError={() => setFailed(true)}
          src={src}
        />
      )}
    </div>
  );
}
