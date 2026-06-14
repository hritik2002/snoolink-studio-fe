import * as React from "react";
import { cn } from "@/lib/utils";
import { cardFeature, cardSurface, headingH3, bodyLg, caption } from "@/lib/cg-classes";

/** Sticky command-bar header used across app views */
function CommandBar({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky top-0 z-[200] flex-shrink-0 border-b border-cg-line bg-cg-bg/90 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="max-w-content mx-auto px-4 md:px-9 lg:px-15 py-4">
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
        "font-display text-h3 font-semibold text-cg-ink tracking-tight",
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
      className={cn(bodyLg, className)}
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
        "flex-1 min-h-0 max-w-content mx-auto w-full",
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
        "inline-flex rounded-btn border border-cg-line bg-cg-bg-alt p-0.5",
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
        "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-badge transition-colors duration-200 ease-cg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/20",
        active
          ? "bg-cg-surface text-cg-ink shadow-sm"
          : "text-cg-ink-4 hover:text-cg-ink",
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
        "shrink-0 px-3 py-1 text-sm font-medium rounded-badge border transition-colors duration-200 ease-cg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cg-ink/20",
        active
          ? "border-cg-orange bg-cg-peach/30 text-cg-ink"
          : "border-cg-line text-cg-ink-4 hover:text-cg-ink hover:border-cg-line-3",
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
        "border border-cg-line rounded-img p-4 bg-cg-surface",
        className
      )}
    >
      <p className={cn(caption, "mb-1")}>{label}</p>
      <p className="font-mono text-2xl font-bold text-cg-ink">{value}</p>
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
      <div className={cn(cardFeature, "max-w-sm w-full p-1")}>
        <div className={cn(cardSurface, "text-center space-y-4 border-0 shadow-none")}>
          {Icon && (
            <Icon className="h-8 w-8 text-cg-orange mx-auto" strokeWidth={1.5} aria-hidden />
          )}
          <div>
            <h3 className={cn(headingH3, "mb-1")}>{title}</h3>
            {description && (
              <p className={cn(bodyLg, "max-w-[28ch] mx-auto")}>
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
