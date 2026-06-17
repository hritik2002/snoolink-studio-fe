/**
 * Cloudglue App UI class sets — authenticated product shell only.
 * Marketing pages use lib/cg-classes.ts instead.
 */

export const appBtnPrimary = [
  "inline-flex items-center gap-1.5",
  "text-[14px] font-medium text-white",
  "bg-app-orange hover:bg-app-orange-hover active:bg-app-orange-press",
  "px-4 py-[9px] rounded-app-md",
  "transition-colors duration-150",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-orange/40 focus-visible:ring-offset-2",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
].join(" ")

export const appBtnSecondary = [
  "inline-flex items-center gap-1.5",
  "text-[14px] font-medium text-app-2",
  "bg-white hover:bg-app-hover",
  "border border-app-border-input rounded-app-md",
  "px-3 py-[7px]",
  "transition-colors duration-150",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border focus-visible:ring-offset-1",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ")

export const appBtnGhost = [
  "inline-flex items-center gap-1.5",
  "text-[14px] font-medium text-app-3",
  "hover:text-app-2 hover:bg-app-hover",
  "px-3 py-[7px] rounded-app-sm",
  "transition-colors duration-150",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border",
].join(" ")

export const appBtnDestructive = [
  "inline-flex items-center gap-1.5",
  "text-[14px] font-medium text-white",
  "bg-red-500 hover:bg-red-600",
  "px-4 py-[9px] rounded-app-md",
  "transition-colors duration-150",
].join(" ")

export const appPageTitle =
  "text-[22px] font-bold text-app-1 leading-[1.3] tracking-[-0.01em]"

export const appSectionTitle = "text-[15px] font-semibold text-app-1"

export const appInput = [
  "w-full text-[14px] text-app-1 bg-white",
  "border border-app-border-input rounded-app-sm",
  "px-3 py-2 placeholder:text-app-4",
  "transition-all duration-150",
  "focus:outline-none focus:border-app-3 focus:ring-0",
  "focus:shadow-[0_0_0_3px_rgba(107,114,128,0.08)]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ")

export const appLabel = "text-[13px] font-medium text-app-2"

export const appNavItem = [
  "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-app-sm",
  "text-[14px] leading-[1.4] font-normal text-app-2",
  "cursor-pointer transition-colors duration-150",
  "hover:bg-app-hover hover:text-app-1",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border",
].join(" ")

export const appNavItemActive =
  "bg-app-active text-app-1 font-medium hover:bg-app-active"

export const appInteractiveRow = [
  "flex items-center gap-2.5 w-full rounded-app-sm px-2 py-1.5",
  "cursor-pointer transition-colors duration-150",
  "hover:bg-app-hover",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-border",
].join(" ")

export const appMenuPanel =
  "absolute z-50 bg-white border border-app-border-input rounded-app-md shadow-app-dropdown overflow-hidden animate-app-fade-up"

export const appMenuItem = [
  "flex items-center gap-2.5 w-full px-3 py-2.5",
  "text-[14px] text-app-2 text-left",
  "cursor-pointer transition-colors duration-100",
  "hover:bg-app-hover hover:text-app-1",
  "focus-visible:outline-none focus-visible:bg-app-hover",
].join(" ")

export const appMenuItemDanger = [
  "flex items-center gap-2.5 w-full px-3 py-2.5",
  "text-[14px] text-red-600 text-left",
  "cursor-pointer transition-colors duration-100",
  "hover:bg-red-50 hover:text-red-700",
  "focus-visible:outline-none focus-visible:bg-red-50",
].join(" ")

export const appNavSectionLabel =
  "text-[11px] font-medium uppercase tracking-[0.04em] text-app-4 px-2.5 py-1.5 mb-0.5"

export const appTableContainer =
  "mx-6 rounded-app-md border border-app-border overflow-hidden"

export const appTableHeaderCell =
  "px-4 py-3 text-[13px] font-normal text-app-3 whitespace-nowrap"

export const appTableBodyCell = "px-4 py-[14px] text-[14px] text-app-2"

export const appTableRow =
  "border-b border-app-border-light last:border-0 transition-colors duration-100"

export const appTableRowClickable =
  "border-b border-app-border-light last:border-0 cursor-pointer hover:bg-app-hover transition-colors duration-100"

export const appChip = [
  "inline-flex items-center gap-1 shrink-0",
  "text-[13px] text-app-2",
  "bg-white border border-app-border-input",
  "rounded-app-sm px-2.5 py-1",
  "transition-all duration-150",
  "hover:border-app-3",
].join(" ")

export const appChipActive =
  "border-app-1 bg-app-1 text-white font-medium shadow-sm [&_span]:text-white/60"

export const appSegmentControl =
  "inline-flex rounded-app-md border border-app-border-input bg-app-hover p-0.5"

export const appSegmentActive =
  "bg-white text-app-1 shadow-sm rounded-app-sm font-medium text-[13px]"

export const appSegmentInactive =
  "text-app-4 hover:text-app-2 rounded-app-sm text-[13px]"
