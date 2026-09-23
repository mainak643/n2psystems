import React from 'react';

/**
 * Renders text with inline markdown bold (**bold**) and (__bold__)
 * formatted cleanly with semibold text in the high-contrast foreground color,
 * eliminating raw markdown syntax and asterisks.
 */
export function FormattedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  // Strip accidental leading rogue bullet characters or markdown hashes that leaked
  const cleaned = text
    .replace(/^#{1,6}\s+/, '')
    .replace(/^\s*[•▪◦*\-–—]\s+/, '')
    .trim();

  // Split by markdown bold patterns: **...** or __...__
  const parts = cleaned.split(/(\*\*.*?\*\*|__.*?__)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (
          (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
          (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
        ) {
          const boldContent = part.slice(2, -2).trim();
          return (
            <strong key={index} className="font-semibold text-foreground">
              {boldContent}
            </strong>
          );
        }
        return part;
      })}
    </span>
  );
}

/**
 * Renders multi-paragraph text (e.g. Role Overview), parsing paragraphs
 * and rendering inline markdown bolding with elegant typography.
 */
export function FormattedParagraphs({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={className || "mt-4 flex flex-col gap-4 text-body text-muted-foreground leading-relaxed"}>
      {paragraphs.map((para, idx) => (
        <p key={idx}>
          <FormattedText text={para} />
        </p>
      ))}
    </div>
  );
}
