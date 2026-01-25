import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Media",
  description: "Upload images and videos to Snoolink. Our AI will process and index your media for semantic search.",
  openGraph: {
    title: "Upload Media to Snoolink",
    description: "Upload images and videos to your workspace. Our AI will process and index your media for semantic search.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Upload Media to Snoolink",
    description: "Upload images and videos to your workspace. Our AI will process and index your media for semantic search.",
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

