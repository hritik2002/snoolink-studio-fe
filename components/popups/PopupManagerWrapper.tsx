"use client"

import { usePathname } from "next/navigation";
import { PopupManager } from "./PopupManager";
import { popupConfigs } from "@/lib/popup-config";

/**
 * Client-side wrapper for PopupManager
 * Handles pathname detection for targeting rules
 */
export function PopupManagerWrapper() {
  const pathname = usePathname();

  return <PopupManager popups={popupConfigs} currentPath={pathname || "/"} />;
}
