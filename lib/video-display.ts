import { getFileName } from "@/lib/file-format";

const GENERATED_ID_PATTERN = /^\d{10,}_[a-f0-9]{8,}/i;
const VIDEO_EXT_PATTERN = /\.(mp4|mov|webm|avi|mkv|m4v)$/i;

export interface VideoDisplayInfo {
  label: string;
  subtitle?: string;
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const sentence = trimmed.split(/[.!?](?:\s|$)/)[0]?.trim() || trimmed;
  return sentence.length > 90 ? `${sentence.slice(0, 87)}…` : sentence;
}

function isMachineFilename(value: string): boolean {
  const raw = value.replace(VIDEO_EXT_PATTERN, "");
  return (
    GENERATED_ID_PATTERN.test(raw) ||
    (raw.length > 36 && !raw.includes(" "))
  );
}

/** Turn API metadata into a human-friendly search result title. */
export function getVideoDisplayInfo(
  title?: string,
  videoUrl?: string,
  description?: string
): VideoDisplayInfo {
  const desc = description?.trim();
  if (desc) {
    return {
      label: firstSentence(desc),
      subtitle: title && !isMachineFilename(title) ? title : undefined,
    };
  }

  const candidate = (title || getFileName(videoUrl || "")).replace(
    VIDEO_EXT_PATTERN,
    ""
  );

  if (!candidate || isMachineFilename(candidate)) {
    return { label: "Untitled video" };
  }

  return { label: candidate };
}

export function truncateMatchText(text?: string, max = 140): string | undefined {
  if (!text?.trim()) return undefined;
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}
