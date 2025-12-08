/**
 * Chunked upload utility
 * Splits large files into chunks to bypass Vercel's 4.5MB limit
 */

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks (safe for Vercel's 4.5MB limit)

export interface ChunkMetadata {
  fileId: string;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  chunkIndex: number;
  chunkSize: number;
  mimeType: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  uploaded: number;
  total: number;
  percentage: number;
}

/**
 * Splits a file into chunks
 */
export function splitFileIntoChunks(file: File): Blob[] {
  const chunks: Blob[] = [];
  let start = 0;

  while (start < file.size) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }

  return chunks;
}

/**
 * Uploads a file in chunks
 */
export async function uploadFileInChunks(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ fileId: string; success: boolean }> {
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const chunks = splitFileIntoChunks(file);
  const totalChunks = chunks.length;

  // Upload each chunk
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    const formData = new FormData();
    
    const metadata: ChunkMetadata = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      totalChunks,
      chunkIndex,
      chunkSize: chunk.size,
      mimeType: file.type,
    };

    formData.append("chunk", chunk);
    formData.append("metadata", JSON.stringify(metadata));

    const response = await fetch("/api/images/upload-chunk", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
    }

    // Report progress
    if (onProgress) {
      const uploaded = (chunkIndex + 1) * CHUNK_SIZE;
      onProgress({
        fileId,
        fileName: file.name,
        uploaded: Math.min(uploaded, file.size),
        total: file.size,
        percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100),
      });
    }
  }

  // Finalize upload
  const finalizeResponse = await fetch("/api/images/finalize-chunks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileId }),
  });

  if (!finalizeResponse.ok) {
    const error = await finalizeResponse.json().catch(() => ({}));
    throw new Error(error.error || "Failed to finalize upload");
  }

  return { fileId, success: true };
}

/**
 * Uploads multiple files in chunks
 */
export async function uploadMultipleFilesInChunks(
  files: File[],
  onFileProgress?: (fileId: string, progress: UploadProgress) => void
): Promise<{ fileId: string; fileName: string; success: boolean }[]> {
  // Upload files sequentially to avoid overwhelming the server
  const results: { fileId: string; fileName: string; success: boolean }[] = [];

  for (const file of files) {
    try {
      const result = await uploadFileInChunks(file, (progress) => {
        if (onFileProgress) {
          onFileProgress(progress.fileId, progress);
        }
      });
      results.push({
        fileId: result.fileId,
        fileName: file.name,
        success: result.success,
      });
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      results.push({
        fileId: "",
        fileName: file.name,
        success: false,
      });
    }
  }

  return results;
}

