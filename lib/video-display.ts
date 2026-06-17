import { getFileName, truncateId } from "@/lib/file-format";

const GENERATED_ID_PATTERN = /^\d{10,}_[a-f0-9]{8,}/i;
const VIDEO_EXT_PATTERN = /\.(mp4|mov|webm|avi|mkv|m4v)$/i;

export interface VideoDisplayInfo {
  label: string;
  fileId?: string;
}

/** Turn a raw storage key or filename into a human-friendly search result title. */
export function getVideoDisplayInfo(
  title?: string,
  videoUrl?: string
): VideoDisplayInfo {
  const fileName = getFileName(videoUrl || "");
  const raw = (title || fileName).replace(VIDEO_EXT_PATTERN, "");
  const isGeneratedId =
    GENERATED_ID_PATTERN.test(raw) || (raw.length > 36 && !raw.includes(" "));

  if (isGeneratedId) {
    return { label: "Untitled video", fileId: truncateId(raw, 10) };
  }

  return { label: raw || "Untitled video" };
}
