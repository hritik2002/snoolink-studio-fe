"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronsUpDown,
  CreditCard,
  Loader2,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { AppAvatar } from "@/components/app/AppAvatar";
import { cn } from "@/lib/utils";
import {
  appInteractiveRow,
  appMenuItem,
  appMenuItemDanger,
  appMenuPanel,
} from "@/lib/app-classes";
import { appPath } from "@/lib/app-nav";

interface SidebarAccountMenuProps {
  displayName: string;
  email?: string | null;
  onNavigate?: () => void;
  onSignOut: () => void | Promise<void>;
}

export function SidebarAccountMenu({
  displayName,
  email,
  onNavigate,
  onSignOut,
}: SidebarAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
      close();
    }
  };

  const handleMenuNavigate = () => {
    close();
    onNavigate?.();
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className={cn(
          appInteractiveRow,
          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-1.5",
          open && "bg-app-active"
        )}
      >
        <AppAvatar name={displayName} email={email} />
        <div className="flex flex-col items-start min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <span className="text-[14px] font-medium text-app-1 truncate w-full text-left">
            {displayName}
          </span>
          <span className="text-[12px] text-app-3 truncate w-full text-left">
            {email}
          </span>
        </div>
        <ChevronsUpDown
          className={cn(
            "w-4 h-4 text-app-4 shrink-0 transition-transform duration-150 group-data-[collapsible=icon]:hidden",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className={cn(
            appMenuPanel,
            "bottom-full left-0 right-0 mb-1.5",
            "group-data-[collapsible=icon]:left-full group-data-[collapsible=icon]:right-auto group-data-[collapsible=icon]:bottom-0 group-data-[collapsible=icon]:ml-2 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:w-56"
          )}
        >
          <div className="px-3 py-2.5 border-b border-app-border-light">
            <p className="text-[14px] font-medium text-app-1 truncate">
              {displayName}
            </p>
            {email && (
              <p className="text-[12px] text-app-3 truncate mt-0.5">{email}</p>
            )}
          </div>

          <div className="py-1">
            <Link
              href={appPath("profile")}
              role="menuitem"
              onClick={handleMenuNavigate}
              className={appMenuItem}
            >
              <User className="w-4 h-4 text-app-3 shrink-0" />
              Profile
            </Link>
            <Link
              href={appPath("settings")}
              role="menuitem"
              onClick={handleMenuNavigate}
              className={appMenuItem}
            >
              <Settings className="w-4 h-4 text-app-3 shrink-0" />
              Settings
            </Link>
            <Link
              href={appPath("billing")}
              role="menuitem"
              onClick={handleMenuNavigate}
              className={appMenuItem}
            >
              <CreditCard className="w-4 h-4 text-app-3 shrink-0" />
              Billing
            </Link>
          </div>

          <div className="h-px bg-app-border-light" />

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={handleSignOut}
              className={cn(appMenuItemDanger, "disabled:opacity-50 disabled:cursor-not-allowed")}
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              ) : (
                <LogOut className="w-4 h-4 shrink-0" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
