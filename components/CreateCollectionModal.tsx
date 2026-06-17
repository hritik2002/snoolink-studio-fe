"use client"

import { useEffect, useState } from "react"
import { Loader2, Settings2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Toggle } from "@/components/app/Toggle"
import { ModalShell, ModalFooterActions } from "@/components/app/ModalShell"
import { appInput, appLabel, appSectionTitle } from "@/lib/app-classes"
import {
  COLLECTION_KIND_OPTIONS,
  DEFAULT_SEGMENTATION_CONFIG,
  type CollectionCreatePayload,
  type CollectionKind,
  type EntitySettings,
  type FaceAnalysisSettings,
  type MediaDescriptionsSettings,
  type SegmentationConfig,
  getDefaultSettings,
} from "@/lib/collection-types"
import { cn } from "@/lib/utils"

interface CreateCollectionModalProps {
  open: boolean
  onClose: () => void
  onCreated: (collection: { name: string; collectionType: string }) => void
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className={cn(appLabel, "block mb-1.5")}>{children}</label>
}

function SettingsCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-app-md border border-app-border bg-white p-4 flex flex-col min-w-0 w-full",
        className
      )}
    >
      {children}
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-app-border-light last:border-0 min-w-0">
      <span className="flex-1 min-w-0 text-[13px] text-app-2 leading-snug pr-2">{label}</span>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} className="shrink-0" />
    </div>
  )
}

function MediaDescriptionsSettingsPanel({
  settings,
  onChange,
}: {
  settings: MediaDescriptionsSettings
  onChange: (settings: MediaDescriptionsSettings) => void
}) {
  const set = (key: keyof MediaDescriptionsSettings, value: boolean) =>
    onChange({ ...settings, [key]: value })

  return (
    <>
      <ToggleRow label="Enable Speech" checked={settings.enableSpeech} onChange={(v) => set("enableSpeech", v)} />
      <ToggleRow
        label="Enable Visual Scene Description"
        checked={settings.enableVisualSceneDescription}
        onChange={(v) => set("enableVisualSceneDescription", v)}
      />
      <ToggleRow label="Enable Scene Text" checked={settings.enableSceneText} onChange={(v) => set("enableSceneText", v)} />
      <ToggleRow
        label="Enable Audio Description"
        checked={settings.enableAudioDescription}
        onChange={(v) => set("enableAudioDescription", v)}
      />
      <ToggleRow label="Enable Summary" checked={settings.enableSummary} onChange={(v) => set("enableSummary", v)} />
    </>
  )
}

function EntitySettingsPanel({
  settings,
  onChange,
}: {
  settings: EntitySettings
  onChange: (settings: EntitySettings) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Prompt</FieldLabel>
        <textarea
          value={settings.prompt}
          onChange={(e) => onChange({ ...settings, prompt: e.target.value })}
          placeholder="Prompt"
          rows={3}
          className={cn(appInput, "resize-y min-h-[72px]")}
        />
      </div>
      <div>
        <FieldLabel>Schema</FieldLabel>
        <textarea
          value={settings.schema}
          onChange={(e) => onChange({ ...settings, schema: e.target.value })}
          placeholder="{}"
          rows={3}
          className={cn(appInput, "resize-y min-h-[72px] font-mono text-[13px]")}
        />
      </div>
      <div className="space-y-1">
        <ToggleRow
          label="Enable Video Level Entities"
          checked={settings.enableVideoLevelEntities}
          onChange={(v) =>
            onChange({
              ...settings,
              enableVideoLevelEntities: v,
              enableSegmentLevelEntities: v ? false : settings.enableSegmentLevelEntities,
            })
          }
        />
        <ToggleRow
          label="Enable Segment Level Entities"
          checked={settings.enableSegmentLevelEntities}
          onChange={(v) =>
            onChange({
              ...settings,
              enableSegmentLevelEntities: v,
              enableVideoLevelEntities: v ? false : settings.enableVideoLevelEntities,
            })
          }
        />
        <p className="text-[12px] text-app-4 pt-1">
          Only one of video level or segment level entities can be enabled at a time.
        </p>
      </div>
      <div>
        <ToggleRow
          label="Enable Transcript Mode"
          checked={settings.enableTranscriptMode}
          onChange={(v) => onChange({ ...settings, enableTranscriptMode: v })}
        />
        <p className="text-[12px] text-app-4 pt-1">
          Transcript mode uses transcript-only processing (faster, no video frames).
        </p>
      </div>
    </div>
  )
}

function FaceAnalysisSettingsPanel({
  settings,
  onChange,
}: {
  settings: FaceAnalysisSettings
  onChange: (settings: FaceAnalysisSettings) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className={cn(appSectionTitle, "mb-1")}>Frame Extraction</p>
        <p className="text-[13px] text-app-3 mb-3">
          Configure how frames are extracted from videos for face detection.
        </p>
      </div>
      <div>
        <FieldLabel>Frames Per Second</FieldLabel>
        <Input
          type="number"
          min={0.1}
          step={0.1}
          value={settings.framesPerSecond}
          onChange={(e) =>
            onChange({ ...settings, framesPerSecond: Number(e.target.value) || 1 })
          }
          className={appInput}
        />
        <p className="text-[12px] text-app-4 mt-1">
          Number of frames to extract per second (default: 1)
        </p>
      </div>
      <div>
        <FieldLabel>Max Width (pixels)</FieldLabel>
        <Input
          type="number"
          min={256}
          step={64}
          value={settings.maxWidth}
          onChange={(e) => onChange({ ...settings, maxWidth: Number(e.target.value) || 1024 })}
          className={appInput}
        />
        <p className="text-[12px] text-app-4 mt-1">
          Maximum width of frames in pixels (aspect ratio preserved, default: 1024)
        </p>
      </div>
      <ToggleRow
        label="Enable Frame Thumbnails"
        checked={settings.enableFrameThumbnails}
        onChange={(v) => onChange({ ...settings, enableFrameThumbnails: v })}
      />
      <p className="text-[12px] text-app-4 -mt-1">Generate thumbnails for extracted frames</p>
    </div>
  )
}

function SegmentationPanel({
  config,
  onChange,
  expanded,
  onToggle,
}: {
  config: SegmentationConfig
  onChange: (config: SegmentationConfig) => void
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <SettingsCard className="justify-between min-h-0">
      <div>
        <p className={cn(appSectionTitle, "mb-2")}>Optional: Segmentation Config</p>
        <p className="text-[13px] text-app-3 leading-relaxed">
          Configure how the video should be segmented into smaller parts.
        </p>
        {expanded && (
          <div className="mt-4 space-y-3">
            <div>
              <FieldLabel>Segment duration (seconds)</FieldLabel>
              <Input
                type="number"
                min={5}
                value={config.segmentDurationSeconds}
                onChange={(e) =>
                  onChange({
                    ...config,
                    segmentDurationSeconds: Number(e.target.value) || 30,
                  })
                }
                className={appInput}
              />
            </div>
            <div>
              <FieldLabel>Overlap (seconds)</FieldLabel>
              <Input
                type="number"
                min={0}
                value={config.overlapSeconds}
                onChange={(e) =>
                  onChange({ ...config, overlapSeconds: Number(e.target.value) || 0 })
                }
                className={appInput}
              />
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="mt-4 self-end inline-flex items-center gap-1.5 text-[13px] text-app-2 hover:text-app-1 transition-colors"
      >
        <Settings2 className="h-3.5 w-3.5" />
        {expanded ? "Hide Options" : "Show Options"}
      </button>
    </SettingsCard>
  )
}

const INITIAL_FORM = {
  name: "",
  description: "",
  collectionType: "media_descriptions" as CollectionKind,
  settings: getDefaultSettings("media_descriptions"),
  segmentationConfig: { ...DEFAULT_SEGMENTATION_CONFIG },
  segmentationExpanded: false,
}

export function CreateCollectionModal({ open, onClose, onCreated }: CreateCollectionModalProps) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM)
      setError(null)
    }
  }, [open])

  const handleTypeChange = (collectionType: CollectionKind) => {
    setForm((prev) => ({
      ...prev,
      collectionType,
      settings: getDefaultSettings(collectionType),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setIsSaving(true)
    setError(null)

    const payload: CollectionCreatePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      collectionType: form.collectionType,
      settings: form.settings,
      segmentationConfig: form.segmentationExpanded ? form.segmentationConfig : null,
    }

    try {
      const response = await fetch("/api/collections/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create collection")
      onCreated({
        name: data.data.name,
        collectionType: data.data.collectionType ?? form.collectionType,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Create Collection"
      width="900px"
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleSave}
          cancelLabel="Back"
          confirmLabel={isSaving ? "Saving…" : "Save"}
          loading={isSaving}
          confirmDisabled={!form.name.trim()}
        />
      }
    >
      <div className="space-y-5">
        <div>
          <FieldLabel>Name</FieldLabel>
          <Input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name for your collection"
            className={appInput}
            autoFocus
          />
        </div>

        <div>
          <FieldLabel>Description</FieldLabel>
          <Input
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description for your collection"
            className={appInput}
          />
        </div>

        <div>
          <FieldLabel>Collection Type</FieldLabel>
          <div className="relative">
            <select
              value={form.collectionType}
              onChange={(e) => handleTypeChange(e.target.value as CollectionKind)}
              className={cn(
                appInput,
                "appearance-none pr-10 cursor-pointer"
              )}
            >
              {COLLECTION_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-app-4 text-xs">
              ▾
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
          <SettingsCard>
            <p className={cn(appSectionTitle, "mb-3")}>Settings</p>
            <div className="min-w-0">
            {form.collectionType === "media_descriptions" && (
              <MediaDescriptionsSettingsPanel
                settings={form.settings as MediaDescriptionsSettings}
                onChange={(settings) => setForm((prev) => ({ ...prev, settings }))}
              />
            )}
            {form.collectionType === "entities" && (
              <EntitySettingsPanel
                settings={form.settings as EntitySettings}
                onChange={(settings) => setForm((prev) => ({ ...prev, settings }))}
              />
            )}
            {form.collectionType === "face_analysis" && (
              <FaceAnalysisSettingsPanel
                settings={form.settings as FaceAnalysisSettings}
                onChange={(settings) => setForm((prev) => ({ ...prev, settings }))}
              />
            )}
            </div>
          </SettingsCard>

          <SegmentationPanel
            config={form.segmentationConfig}
            onChange={(segmentationConfig) => setForm((prev) => ({ ...prev, segmentationConfig }))}
            expanded={form.segmentationExpanded}
            onToggle={() =>
              setForm((prev) => ({ ...prev, segmentationExpanded: !prev.segmentationExpanded }))
            }
          />
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}
        {isSaving && (
          <div className="flex items-center gap-2 text-[13px] text-app-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating collection…
          </div>
        )}
      </div>
    </ModalShell>
  )
}
