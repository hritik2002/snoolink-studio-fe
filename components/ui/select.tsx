"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export function Select({ value, onValueChange, children, className }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div ref={selectRef} className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      type="button"
      onClick={() => context.setIsOpen(!context.isOpen)}
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 text-sm",
        "bg-transparent border border-white/10 rounded-md",
        "hover:border-white/20 transition-colors",
        "text-white/80",
        "dark:bg-transparent dark:border-white/10 dark:text-white/80",
        "bg-white border-gray-300 text-gray-700",
        "hover:border-gray-400",
        "cursor-pointer",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 text-white/60 transition-transform", context.isOpen && "rotate-180")} />
    </button>
  );
}

export function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.isOpen) return null;

  return (
    <div
      className={cn(
        "absolute top-full mt-1 right-0 z-50",
        "bg-[#1a1a1a] border border-white/10 rounded-md shadow-lg",
        "dark:bg-[#1a1a1a] dark:border-white/10",
        "bg-white border-gray-200 shadow-xl",
        "min-w-[150px]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      onClick={() => {
        context.onValueChange(value);
        context.setIsOpen(false);
      }}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm",
        "hover:bg-white/5 transition-colors",
        "text-white/80",
        "dark:hover:bg-white/5 dark:text-white/80",
        "hover:bg-gray-50 text-gray-700",
        "cursor-pointer",
        className
      )}
    >
      <span>{children}</span>
      {isSelected && <Check className="h-4 w-4 text-white/60" />}
    </button>
  );
}

