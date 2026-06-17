export type CollectionKind = "media_descriptions" | "entities" | "face_analysis"

export const COLLECTION_KIND_OPTIONS: { value: CollectionKind; label: string }[] = [
  { value: "media_descriptions", label: "Media Descriptions" },
  { value: "entities", label: "Entities" },
  { value: "face_analysis", label: "Face Analysis" },
]

export function getCollectionKindLabel(kind?: string | null): string {
  return COLLECTION_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? "Media Descriptions"
}

export interface MediaDescriptionsSettings {
  enableSpeech: boolean
  enableVisualSceneDescription: boolean
  enableSceneText: boolean
  enableAudioDescription: boolean
  enableSummary: boolean
}

export interface EntitySettings {
  prompt: string
  schema: string
  enableVideoLevelEntities: boolean
  enableSegmentLevelEntities: boolean
  enableTranscriptMode: boolean
}

export interface FaceAnalysisSettings {
  framesPerSecond: number
  maxWidth: number
  enableFrameThumbnails: boolean
}

export interface SegmentationConfig {
  segmentDurationSeconds: number
  overlapSeconds: number
}

export interface CollectionCreatePayload {
  name: string
  description?: string
  collectionType: CollectionKind
  settings: MediaDescriptionsSettings | EntitySettings | FaceAnalysisSettings
  segmentationConfig?: SegmentationConfig | null
}

export const DEFAULT_MEDIA_DESCRIPTIONS_SETTINGS: MediaDescriptionsSettings = {
  enableSpeech: true,
  enableVisualSceneDescription: true,
  enableSceneText: true,
  enableAudioDescription: false,
  enableSummary: true,
}

export const DEFAULT_ENTITY_SETTINGS: EntitySettings = {
  prompt: "",
  schema: "{}",
  enableVideoLevelEntities: false,
  enableSegmentLevelEntities: true,
  enableTranscriptMode: false,
}

export const DEFAULT_FACE_ANALYSIS_SETTINGS: FaceAnalysisSettings = {
  framesPerSecond: 1,
  maxWidth: 1024,
  enableFrameThumbnails: true,
}

export const DEFAULT_SEGMENTATION_CONFIG: SegmentationConfig = {
  segmentDurationSeconds: 30,
  overlapSeconds: 2,
}

export function getDefaultSettings(kind: CollectionKind) {
  switch (kind) {
    case "entities":
      return { ...DEFAULT_ENTITY_SETTINGS }
    case "face_analysis":
      return { ...DEFAULT_FACE_ANALYSIS_SETTINGS }
    default:
      return { ...DEFAULT_MEDIA_DESCRIPTIONS_SETTINGS }
  }
}
