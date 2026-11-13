"use client";

import { useRef } from "react";

export default function RecipeImageUpload({
  selectedFile,
  previewUrl,
  savedImageUrl,
  hasSavedImage,
  removalPending,
  errorMessage,
  onSelectFile,
  onRemoveSelected,
  onRemoveSaved,
  onRestoreSaved,
}) {
  const inputRef = useRef(null);
  const imageUrl = previewUrl || (!removalPending ? savedImageUrl : null);

  function handleFileChange(event) {
    onSelectFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  return (
    <section className="rounded-2xl border border-[#E1E7DC] bg-[#FFFEFA] p-5" aria-labelledby="recipe-image-title">
      <h2 id="recipe-image-title" className="text-lg font-extrabold">Imagem da receita</h2>
      <div className="mt-4 rounded-2xl border-2 border-dashed border-[#C9D6C5] bg-[#F7F8F3] p-5 sm:p-7">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#E9F0E5] text-[#315B42]" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="size-6" stroke="currentColor" strokeWidth="1.8">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m5 17 4.2-4.1a1.3 1.3 0 0 1 1.8 0l2.1 2.1 1.8-1.8a1.3 1.3 0 0 1 1.8 0l2.3 2.3" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#254936]">Adicione uma foto da receita</p>
            <p id="recipe-image-help" className="mt-1 text-sm text-[#667469]">JPEG, PNG e WebP, até 5 MB.</p>
            {selectedFile && <p className="mt-2 break-all text-sm font-medium text-[#405447]">{selectedFile.name}</p>}
            {removalPending && <p className="mt-2 text-sm text-[#8D432D]">A imagem cadastrada será removida ao salvar a receita.</p>}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <button type="button" onClick={() => inputRef.current?.click()} aria-describedby="recipe-image-help" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#254936] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3C2C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315B42] focus-visible:ring-offset-2">
                Escolher imagem
              </button>
              {selectedFile && <button type="button" onClick={onRemoveSelected} className="min-h-11 rounded-full border border-[#E7C7BB] px-4 text-sm font-bold text-[#9B4B34] transition hover:bg-[#FFF1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B4B34] focus-visible:ring-offset-2">Remover imagem selecionada</button>}
              {!selectedFile && hasSavedImage && !removalPending && <button type="button" onClick={onRemoveSaved} className="min-h-11 rounded-full border border-[#E7C7BB] px-4 text-sm font-bold text-[#9B4B34] transition hover:bg-[#FFF1EA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B4B34] focus-visible:ring-offset-2">Remover imagem cadastrada</button>}
              {removalPending && <button type="button" onClick={onRestoreSaved} className="min-h-11 rounded-full border border-[#C9D6C5] px-4 text-sm font-bold text-[#315B42] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315B42] focus-visible:ring-offset-2">Desfazer remoção</button>}
            </div>
            <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Escolher imagem da receita" onChange={handleFileChange} />
          </div>
        </div>
        {imageUrl ? (
          <div className="mt-5 border-t border-[#E1E7DC] pt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={selectedFile ? `Pré-visualização: ${selectedFile.name}` : "Imagem atual da receita"} className="mx-auto h-48 w-full max-w-lg rounded-xl object-cover sm:mx-0" />
          </div>
        ) : null}
        {errorMessage && <p role="alert" className="mt-4 rounded-xl border border-[#EACFC3] bg-[#FFF8F4] p-3 text-sm font-semibold text-[#8D432D]">{errorMessage}</p>}
      </div>
    </section>
  );
}
