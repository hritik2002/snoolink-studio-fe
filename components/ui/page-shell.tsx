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
        "sticky top-0 z-[200] flex-shrink-0 border-b border-border bg-background/90 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="max-w-[1228px] mx-auto px-4 sm:px-6 lg:px-[60px] py-4">
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
        "text-xl font-semibold text-foreground tracking-tight font-[family-name:var(--font-display)]",
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
      className={cn("text-[15px] text-muted-foreground leading-relaxed", className)}
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
        "flex-1 min-h-0 max-w-[1228px] mx-auto w-full",
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
        "inline-flex rounded-[18px] border border-border bg-secondary p-0.5",
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
        "flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium rounded-[13px] transition-colors duration-200",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
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
        "shrink-0 px-3 py-1 text-[15px] font-medium rounded-[13px] border transition-colors duration-200",
        active
          ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-peach)]/30 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground hover:border-[var(--color-border-mid)]",
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
        "border border-border rounded-[24px] p-4 bg-background",
        className
      )}
    >
      <p className="text-[15px] text-muted-foreground mb-1">{label}</p>
      <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
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
      <div className="glue-card max-w-sm w-full p-8 relative">
        <div className="text-center space-y-4">
          {Icon && (
            <Icon className="h-8 w-8 text-[var(--color-accent-orange)] mx-auto" strokeWidth={1.5} aria-hidden />
          )}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1 font-[family-name:var(--font-display)]">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[28ch] mx-auto">
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
