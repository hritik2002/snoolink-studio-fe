import * as React from "react"
import { cn } from "@/lib/utils"
import { badgeSection, headingH2, bodyLg } from "@/lib/cg-classes"

interface PageShellProps {
  children: React.ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("min-h-screen bg-cg-bg antialiased font-body", className)}>
      {children}
    </div>
  )
}

interface SectionProps {
  children: React.ReactNode
  theme?: "light" | "alt"
  className?: string
  id?: string
}

export function Section({ children, theme = "light", className, id }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "w-full flex flex-col items-center",
        theme === "light" ? "bg-cg-bg" : "bg-cg-bg-alt",
        className
      )}
    >
      {children}
    </section>
  )
}

interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("w-full max-w-content px-9 md:px-15 mx-auto", className)}>
      {children}
    </div>
  )
}

interface SectionHeadingProps {
  badge?: string
  heading: React.ReactNode
  sub?: string
  align?: "center" | "left"
  className?: string
}

export function SectionHeading({
  badge,
  heading,
  sub,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {badge && <span className={badgeSection}>{badge}</span>}
      <h2 className={headingH2}>{heading}</h2>
      {sub && <p className={cn(bodyLg, "max-w-prose")}>{sub}</p>}
    </div>
  )
}
