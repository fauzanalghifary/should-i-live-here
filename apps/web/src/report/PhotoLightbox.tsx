import { useEffect } from "react";
import { createPortal } from "react-dom";

type PhotoLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function PhotoLightbox({ alt, onClose, src }: PhotoLightboxProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      aria-label="Photo preview"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
    >
      <button
        aria-label="Close photo"
        className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={onClose}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
      <img
        alt={alt}
        className="max-h-[90vh] max-w-full rounded-sm object-contain shadow-2xl"
        onClick={(event) => {
          event.stopPropagation();
        }}
        src={src}
      />
    </div>,
    document.body,
  );
}
