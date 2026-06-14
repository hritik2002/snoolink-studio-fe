/**
 * Canonical Cloudglue Tailwind class sets.
 * Use these in components — don't improvise arbitrary values.
 */

export const btnLight = [
  "inline-flex items-center justify-center gap-2.5",
  "font-ui text-body font-medium text-cg-ink",
  "bg-cg-surface border border-cg-line-2/50",
  "rounded-btn px-7 py-[13px]",
  "shadow-btn-light",
  "transition-transform duration-200 ease-cg",
  "hover:-translate-y-px hover:shadow-card-md",
  "active:scale-[0.99]",
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:pointer-events-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/20 focus-visible:ring-offset-2",
].join(" ")

export const btnDark = [
  "inline-flex items-center justify-center gap-2.5",
  "font-ui text-body font-medium text-cg-bg-alt",
  "bg-cg-ink border border-cg-ink-4/60",
  "rounded-btn px-7 py-[13px]",
  "shadow-btn-dark",
  "transition-transform duration-200 ease-cg",
  "hover:-translate-y-px",
  "active:scale-[0.99]",
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:pointer-events-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/30 focus-visible:ring-offset-2",
].join(" ")

export const btnGhost = [
  "inline-flex items-center justify-center gap-2",
  "font-body text-sm font-medium text-cg-ink-3",
  "bg-transparent rounded-btn px-4 py-2",
  "transition-colors duration-200 ease-cg",
  "hover:text-cg-ink hover:bg-cg-bg-warm",
  "active:scale-[0.99]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-line-3",
].join(" ")

export const btnSm = "rounded-btn px-[26px] py-[10px] text-sm"

export const cardFeature = [
  "relative flex flex-col overflow-hidden rounded-card",
  "bg-gradient-to-b from-cg-line to-cg-bg-alt",
].join(" ")

export const cardFeatureInner = [
  "flex flex-col h-full rounded-card p-7",
  "bg-gradient-to-b from-white/90 to-[rgb(246,244,242)]",
].join(" ")

export const cardFlat = [
  "rounded-card border border-cg-line bg-cg-surface p-6",
  "transition-shadow duration-200 ease-cg",
  "hover:shadow-card-md",
].join(" ")

export const cardSurface = [
  "rounded-card border border-cg-line-2 bg-cg-surface",
  "shadow-card p-6",
].join(" ")

export const badge = [
  "inline-flex items-center gap-1.5",
  "font-body text-sm text-cg-ink-warm",
  "bg-cg-bg border border-cg-line",
  "rounded-badge px-3.5 py-[7px]",
  "whitespace-nowrap",
].join(" ")

export const badgeSection = [
  "inline-flex items-center gap-1.5",
  "font-body text-sm text-cg-ink-warm",
  "bg-cg-bg border-[1.5px] border-cg-line",
  "rounded-badge px-6 py-2",
].join(" ")

export const inputBase = [
  "w-full font-body text-body text-cg-ink",
  "bg-cg-bg-warm border border-cg-line-3 rounded-btn",
  "px-4 py-3",
  "placeholder:text-cg-ink-4",
  "transition-all duration-150 ease-cg",
  "focus:outline-none focus:border-cg-ink-2 focus:bg-cg-surface focus:ring-0",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ")

export const inputError = "border-red-300 bg-red-50/30 focus:border-red-400"

export const labelBase = "block font-body text-sm font-medium text-cg-ink-2 mb-1.5"

export const helperText = "mt-1 font-body text-xs text-cg-ink-4"

export const errorText = "mt-1 font-body text-xs text-red-500"

export const navLink = [
  "font-ui text-body font-normal text-cg-ink-3",
  "transition-colors duration-200 ease-cg",
  "hover:text-cg-ink-4",
].join(" ")

export const sidebarItem = [
  "flex items-center gap-2.5 w-full",
  "font-body text-sm font-medium text-cg-ink-3",
  "px-3 py-2.5 rounded-[10px]",
  "transition-all duration-150 ease-cg",
  "hover:bg-cg-bg-warm hover:text-cg-ink",
].join(" ")

export const sidebarItemActive = "bg-cg-bg-warm text-cg-ink"

export const dividerFade = [
  "h-px w-full",
  "bg-gradient-to-r from-transparent via-cg-line-2/90 to-transparent",
].join(" ")

export const dividerSolid = "h-px w-full bg-cg-line"

export const headingHero = [
  "font-display text-hero font-semibold text-cg-ink tracking-tight text-center",
  "[font-feature-settings:'blwf'_on,'cv09'_on,'cv03'_on]",
].join(" ")

export const headingH2 = [
  "font-display text-h2 font-semibold text-cg-ink tracking-tight leading-[1.2]",
  "[font-feature-settings:'blwf'_on,'cv09'_on,'cv03'_on]",
].join(" ")

export const headingH3 = "font-display text-h3 font-semibold text-cg-ink leading-[1.2]"

export const bodyLg = "font-body text-body-lg text-cg-ink-3 leading-relaxed"

export const caption = "font-body text-sm text-cg-ink-4 leading-none"

export const focusRingLight =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/20 focus-visible:ring-offset-2"

export const focusRingDark =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cg-ink"

export const chip = [
  "inline-flex items-center gap-1 shrink-0",
  "font-body text-sm text-cg-ink-3",
  "bg-cg-bg border border-cg-line",
  "rounded-badge px-3 py-1.5",
  "transition-all duration-150 ease-cg",
  "hover:border-cg-line-3 hover:text-cg-ink",
].join(" ")

export const chipActive =
  "border-cg-orange/50 bg-cg-peach/40 text-cg-ink-warm font-medium"

export const segmentControl =
  "inline-flex rounded-btn border border-cg-line-3 bg-cg-bg-warm p-0.5"

export const segmentActive =
  "bg-cg-surface text-cg-ink shadow-btn-light rounded-badge font-medium"

export const segmentInactive =
  "text-cg-ink-4 hover:text-cg-ink-2 rounded-badge"

export const commandBar =
  "rounded-cta border border-cg-line bg-cg-bg/95 backdrop-blur-xl shadow-card"
