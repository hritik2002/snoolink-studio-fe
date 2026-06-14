import * as React from "react";
import { cn } from "@/lib/utils";

/** Sticky command-bar header used across app views */
function CommandBar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky top-0 z-[200] flex-shrink-0 border-b border-[#333333] bg-[#010010]/90 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="max-w-[1563px] mx-auto border-x border-[#333333] px-4 sm:px-6 py-4">
        {children}
      </div>
    </div>
  );
}

function PageTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "text-lg font-medium text-white tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

function PageDescription({
  className,
  children,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[13px] text-[#71717a] leading-relaxed", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function PageBody({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 max-w-[1563px] mx-auto w-full border-x border-[#333333]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Segmented control — Videos | Images style */
function SegmentedControl({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex border border-[rgba(51,51,51,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function SegmentedItem({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-primary text-black"
          : "text-white/60 hover:text-white/80 hover:bg-white/5",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Flat filter chip */
function FilterChip({
  active,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 px-2.5 py-1 text-[13px] font-medium border transition-colors duration-150",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-[rgba(51,51,51,0.5)] text-white/60 hover:text-white/80",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function StatBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-[rgba(51,51,51,0.5)] p-3",
        className
      )}
    >
      <p className="text-[13px] text-[#71717a] mb-1">{label}</p>
      <p className="font-mono-beetle text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center flex-1 py-20 px-4",
        className
      )}
    >
      <div className="beetle-card max-w-sm w-full p-8 relative backdrop-blur-3xl">
        <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
        <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
        <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
        <span className="beetle-bracket beetle-bracket-br" aria-hidden />
        <div className="text-center space-y-4">
          {Icon && (
            <Icon className="h-8 w-8 text-primary mx-auto" strokeWidth={1.5} aria-hidden />
          )}
          <div>
            <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-white/60 leading-relaxed max-w-[28ch] mx-auto">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}

export {
  CommandBar,
  PageTitle,
  PageDescription,
  PageBody,
  SegmentedControl,
  SegmentedItem,
  FilterChip,
  StatBlock,
  EmptyPanel,
};
