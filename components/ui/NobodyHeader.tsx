/**
 * Nobody Header - Living header text
 * 
 * Title + subtitle, localized, RTL/LTR support
 */

"use client";

import { Lang } from "@/lib/nobody-copy";

interface NobodyHeaderProps {
  title: string;
  subtitle: string;
  lang: Lang;
}

export function NobodyHeader({ title, subtitle, lang }: NobodyHeaderProps) {
  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <div
      className="text-center mb-6"
      dir={dir}
      style={{
        minHeight: subtitle ? "4rem" : "2.5rem", // Prevent layout shift
      }}
    >
      {/* Title */}
      <h1
        className="text-xl sm:text-2xl font-normal leading-tight mb-1"
        style={{ color: "var(--foreground)" }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p
          className="text-sm opacity-60 font-normal"
          style={{ color: "var(--foreground)" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

