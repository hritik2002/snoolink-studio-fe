import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Snoolink Studio to access your AI-powered semantic image and video search workspace.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Sign In to Snoolink Studio",
    description: "Sign in to access your AI-powered semantic search workspace.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sign In to Snoolink Studio",
    description: "Sign in to access your AI-powered semantic search workspace.",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

