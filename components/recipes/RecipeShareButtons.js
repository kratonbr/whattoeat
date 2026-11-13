"use client";

import { useEffect, useRef, useState } from "react";

function copyWithLegacyCommand(text) {
  if (typeof document.execCommand !== "function") return false;

  const previouslyFocused = document.activeElement;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.setAttribute("aria-hidden", "true");
  field.style.position = "fixed";
  field.style.top = "0";
  field.style.left = "0";
  field.style.width = "1px";
  field.style.height = "1px";
  field.style.padding = "0";
  field.style.opacity = "0";
  field.style.fontSize = "16px";

  document.body.appendChild(field);
  field.focus({ preventScroll: true });
  field.select();
  field.setSelectionRange(0, field.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    field.remove();
    if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus({ preventScroll: true });
    }
  }

  return copied;
}

export default function RecipeShareButtons({ title, labels }) {
  const [message, setMessage] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const messageTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(messageTimer.current), []);

  function showMessage(nextMessage, nextFallbackUrl = "") {
    window.clearTimeout(messageTimer.current);
    setMessage(nextMessage);
    setFallbackUrl(nextFallbackUrl);

    if (!nextFallbackUrl) {
      messageTimer.current = window.setTimeout(() => {
        setMessage("");
        messageTimer.current = null;
      }, 3000);
    }
  }

  async function copyCurrentLink() {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          showMessage(labels.linkCopied);
          return;
        } catch {
          // Continue with the browser fallback when clipboard permissions block the API.
        }
      }

      if (!copyWithLegacyCommand(url)) throw new Error("COPY_UNAVAILABLE");
      showMessage(labels.linkCopied);
    } catch {
      showMessage(labels.copyFailed, url);
    }
  }

  async function shareRecipe() {
    if (!navigator.share) {
      await copyCurrentLink();
      return;
    }
    try {
      await navigator.share({ title, text: title, url: window.location.href });
      showMessage(labels.shareComplete);
    } catch (error) {
      if (error?.name !== "AbortError") showMessage(labels.shareFailed);
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
      <button
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#254936] px-2.5 text-[0.7rem] font-bold leading-tight text-white shadow-sm transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/25 sm:min-h-11 sm:flex-none sm:px-4 sm:text-sm"
        onClick={shareRecipe}
        type="button"
      >
        <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M12.5 6.25 7.4 9.1m5.1 4.65-5.1-2.85M15 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 5.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></svg>
        {labels.shareRecipe}
      </button>
      <button
        className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#C9D6C5] bg-white/90 px-2.5 text-[0.7rem] font-bold leading-tight text-[#315B42] transition hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#D86F46]/20 sm:min-h-11 sm:flex-none sm:px-4 sm:text-sm"
        onClick={copyCurrentLink}
        type="button"
      >
        <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.7"><rect width="8.5" height="10.5" x="8" y="5" rx="1.7" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 12V4.75A1.75 1.75 0 0 1 7 3h5.5" /></svg>
        {labels.copyRecipeLink}
      </button>
      {message && (
        <div
          aria-live={fallbackUrl ? "assertive" : "polite"}
          className={`fixed right-4 top-4 z-[100] w-[min(24rem,calc(100vw-2rem))] rounded-xl border px-4 py-3 text-sm shadow-lg ${fallbackUrl ? "border-[#E8C7B9] bg-[#FFF5EF] text-[#8A432D]" : "border-[#C9D6C5] bg-[#F3F7F0] text-[#315B42]"}`}
          role={fallbackUrl ? "alert" : "status"}
        >
          <p>{message}</p>
          {fallbackUrl && (
            <>
              <p className="mt-1">{labels.copyManually}</p>
              <input
                aria-label={labels.copyLinkFallback}
                className="mt-2 min-h-10 w-full select-all rounded-lg border border-[#D8C9BD] bg-white px-3 text-xs text-[#315B42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D86F46]"
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
                readOnly
                value={fallbackUrl}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
