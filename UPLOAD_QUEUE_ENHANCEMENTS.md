# Upload Queue UX Enhancements

## Overview
This document outlines comprehensive UX improvements for the Upload Queue page based on user feedback and best practices from Pics.io, Google Photos, and Immich.

## ✅ Implemented Base Features
- Basic upload queue with status indicators
- Processing and failed file filtering
- Thumbnail previews
- Retry functionality for failed uploads
- Confetti animation on success
- Recent uploads teaser in empty state

## 🎯 Priority Enhancements to Implement

### 1. **Global Progress Summary** (P0)

**Current:** Top-line shows "5 Processing, 0 Failed" as text
**Enhancement:** Add animated progress bar showing overall completion

```tsx
{/* Add to top of page, above filters */}
{files.length > 0 && (
  <div className="mb-4 sm:mb-6 p-4 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 to-white">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900">
          {processingCount} Processing
        </span>
        {failedCount > 0 && (
          <span className="text-sm font-medium text-red-600">
            · {failedCount} Failed
          </span>
        )}
      </div>
      <span className="text-2xl font-bold text-purple-600">
        {Math.round((completedCount / totalCount) * 100)}%
      </span>
    </div>
    
    {/* Animated progress bar */}
    <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-purple-500 transition-all duration-500 ease-out relative overflow-hidden"
        style={{ width: `${(completedCount / totalCount) * 100}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
    
    <p className="text-xs text-gray-500 mt-2">
      {estimatedTimeRemaining} remaining · {completedCount} of {totalCount} complete
    </p>
  </div>
)}
```

**CSS Addition (globals.css):**
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

---

### 2. **Smart Filename Truncation** (P0)

**Current:** Long filenames like "1768765958207_u2zuv2z_WHY_DO_IT_NIKE_360P.mp4" displayed in full
**Enhancement:** Intelligent truncation with tooltip

```tsx
// Helper function (already added)
function truncateFilename(filename: string, maxLength = 40)

// Usage in file card
const { display, full } = truncateFilename(filename);

<p 
  className="text-sm sm:text-base font-medium text-purple-600 truncate group relative"
  title={full}
>
  {display}
  <span className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
    {full}
  </span>
</p>
```

---

### 3. **Enhanced Thumbnails** (P1)

**Current:** Black thumbnails for videos without frames
**Enhancement:** Fallback filmstrip icon and clickable preview

```tsx
{/* Thumbnail with fallback */}
<div 
  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-900 relative cursor-pointer group"
  onClick={() => setPreviewFile(file)}
>
  {file.type === "video" ? (
    <>
      <video
        src={file.url} 
        className="w-full h-full object-cover"
        playsInline
        preload="metadata"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      {/* Fallback filmstrip icon */}
      <div className="hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700">
        <div className="flex gap-0.5">
          {[1,2,3].map(i => (
            <div key={i} className="w-2 h-3 bg-purple-300 rounded-sm" />
          ))}
        </div>
      </div>
      {/* Preview overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Play className="h-6 w-6 text-white" />
      </div>
    </>
  ) : (
    <Image
      src={file.url} 
      alt={file.description || "Uploaded file"} 
      width={64} 
      height={64} 
      className="w-full h-full object-cover"
      unoptimized
      onError={(e) => {
        e.currentTarget.src = '/placeholder-image.svg';
      }}
    />
  )}
</div>

{/* Preview Modal */}
{previewFile && (
  <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
    <button className="absolute top-4 right-4 text-white">
      <X className="h-8 w-8" />
    </button>
    {previewFile.type === "video" ? (
      <video src={previewFile.url} controls className="max-w-full max-h-full" />
    ) : (
      <img src={previewFile.url} className="max-w-full max-h-full" />
    )}
  </div>
)}
```

---

### 4. **Individual Progress Indicators** (P0)

**Current:** "Indexing in progress — this may take up to a minute"
**Enhancement:** Determinate progress bar with percentage and ETA

```tsx
{file.status === "processing" && (
  <div className="mt-2 space-y-1">
    {/* Progress bar */}
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-yellow-500 rounded-full transition-all duration-300"
          style={{ width: `${fileProgress[file.id] || 0}%` }}
        />
      </div>
      <span className="text-xs font-medium text-yellow-600 tabular-nums">
        {fileProgress[file.id] || 0}%
      </span>
    </div>
    
    {/* Status text with ETA */}
    <p className="text-xs text-gray-500">
      Indexing... ~{Math.max(1, Math.ceil((100 - (fileProgress[file.id] || 0)) / 50))} min remaining
    </p>
  </div>
)}
```

---

### 5. **Per-Item Actions** (P1)

**Current:** Only external link button
**Enhancement:** Pause, cancel, retry controls

```tsx
{/* Action buttons */}
<div className="flex-shrink-0 flex items-center gap-1">
  {isProcessing && (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); handlePauseFile(file.id); }}
        className="w-8 h-8 rounded-full bg-yellow-100 hover:bg-yellow-200 flex items-center justify-center"
        title="Pause"
      >
        <Pause className="h-3.5 w-3.5 text-yellow-700" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleCancelFile(file.id); }}
        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
        title="Cancel"
      >
        <X className="h-3.5 w-3.5 text-gray-700" />
      </button>
    </>
  )}
  
  {isFailed && (
    <button
      onClick={(e) => { e.stopPropagation(); handleRetryFile(file.id); }}
      className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center"
      title="Retry"
    >
      <RotateCcw className="h-3.5 w-3.5 text-purple-700" />
    </button>
  )}
  
  <button
    onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}
    className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 flex items-center justify-center"
    title="Open in new tab"
  >
    <ExternalLink className="h-3.5 w-3.5 text-purple-600" />
  </button>
</div>
```

---

### 6. **Dynamic Filtering** (P1)

**Current:** Static filter chips
**Enhancement:** Auto-highlight active filter, auto-switch to "Processing" on upload

```tsx
// Auto-switch when uploads start
useEffect(() => {
  if (isUploading || files.some(f => f.status === "processing")) {
    setFilterStatus("processing");
  }
}, [isUploading, files]);

// Enhanced filter chips with highlighting
{(["all", "processing", "failed"] as FilterStatus[]).map((status) => {
  const count = status === "all" 
    ? files.length 
    : files.filter(f => f.status === status).length;
  const isActive = filterStatus === status;
  const hasItems = count > 0;
  
  return (
    <button
      key={status}
      onClick={() => hasItems && setFilterStatus(status)}
      disabled={!hasItems}
      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all ${
        isActive
          ? "bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300"
          : hasItems
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : "bg-gray-50 text-gray-400 cursor-not-allowed"
      }`}
    >
      <span className="font-semibold">{status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}</span>
      {hasItems && (
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
          isActive ? "bg-purple-500" : "bg-gray-200 text-gray-600"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
})}
```

---

### 7. **Enhanced Sorting** (P2)

**Current:** Only "Date Added" and "Name"
**Enhancement:** Add "By Size" and "By Progress"

```tsx
<Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
  <SelectTrigger className="w-full sm:w-[200px]">
    <span className="hidden sm:inline font-medium">SORT: </span>
    <span>
      {sortBy === "date" ? "Date Added" : 
       sortBy === "name" ? "Name" : 
       sortBy === "size" ? "Size" : 
       "Progress"}
    </span>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="date">Date Added</SelectItem>
    <SelectItem value="name">Name</SelectItem>
    <SelectItem value="size">File Size</SelectItem>
    <SelectItem value="progress">Progress</SelectItem>
  </SelectContent>
</Select>

// Sorting logic
const sortedFiles = [...filteredFiles].sort((a, b) => {
  switch (sortBy) {
    case "name":
      return a.url.localeCompare(b.url);
    case "size":
      return estimateFileSize(b.url, b.type) - estimateFileSize(a.url, a.type);
    case "progress":
      return (fileProgress[b.id] || 0) - (fileProgress[a.id] || 0);
    case "date":
    default:
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
  }
});
```

---

### 8. **Context-Aware Upload Zone** (P1)

**Current:** Static drop zone even during uploads
**Enhancement:** Dim drop zone and add contextual messaging

```tsx
<div
  ref={dropZoneRef}
  className={`relative p-4 sm:p-6 md:p-8 border-2 border-dashed rounded-lg sm:rounded-xl transition-all ${
    isDragActive
      ? "border-purple-500 bg-purple-50 border-solid scale-[1.01] ring-4 ring-purple-400/40 dropzone-active"
      : isUploading
        ? "border-gray-200 bg-gray-50 opacity-60"  // Dimmed during upload
        : `border-purple-400 bg-gray-50/50 hover:border-purple-500 hover:bg-purple-50/40 hover:ring-2 hover:ring-purple-300/50 ${showPulse ? "dropzone-pulse" : ""}`
  }`}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
>
  {isUploading && (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg z-10">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-purple-600 mx-auto mb-2 animate-spin" />
        <p className="text-sm font-medium text-gray-700">Uploading files...</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 text-xs text-purple-600 hover:text-purple-700 font-medium"
        >
          + Add more files
        </button>
      </div>
    </div>
  )}
  
  {/* Rest of upload zone content */}
</div>
```

---

### 9. **Real-Time File Validation** (P0)

**Current:** Validation happens after selection
**Enhancement:** Validate on drag, show warnings before upload

```tsx
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const validateFiles = (files: File[]): { valid: File[]; invalid: { file: File; reason: string }[] } => {
  const valid: File[] = [];
  const invalid: { file: File; reason: string }[] = [];
  
  files.forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      invalid.push({ file, reason: `File too large (${formatFileSize(file.size)}). Max: 100MB` });
    } else if (!file.type.match(/^(image|video)\//)) {
      invalid.push({ file, reason: "Invalid file type" });
    } else {
      valid.push(file);
    }
  });
  
  return { valid, invalid };
};

const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  setIsDragActive(true);
  
  // Real-time validation on drag
  if (e.dataTransfer.items) {
    const files = Array.from(e.dataTransfer.items)
      .filter(item => item.kind === 'file')
      .map(item => item.getAsFile())
      .filter((f): f is File => f !== null);
    
    const { invalid } = validateFiles(files);
    if (invalid.length > 0) {
      setValidationError(`${invalid.length} file(s) exceed 100MB limit`);
    } else {
      setValidationError(null);
    }
  }
}, []);

// Show validation error in UI
{validationError && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
    <p className="text-sm text-red-700">{validationError}</p>
    <button onClick={() => setValidationError(null)} className="ml-auto">
      <X className="h-4 w-4 text-red-600" />
    </button>
  </div>
)}
```

---

### 10. **Better Error Messages** (P1)

**Current:** Generic "Failed" status
**Enhancement:** Actionable error messages with solutions

```tsx
{isFailed && file.description && (
  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
    <p className="text-red-700 font-medium mb-1">
      {getErrorMessage(file.description)}
    </p>
    <p className="text-red-600">
      {getErrorSolution(file.description)}
    </p>
  </div>
)}

// Helper functions
function getErrorMessage(description: string): string {
  if (description.includes('too large')) return 'File too large';
  if (description.includes('format')) return 'Unsupported format';
  if (description.includes('network')) return 'Network error';
  return 'Upload failed';
}

function getErrorSolution(description: string): string {
  if (description.includes('too large')) return 'Compress the file and try again';
  if (description.includes('format')) return 'Convert to MP4, MOV, JPG, or PNG';
  if (description.includes('network')) return 'Check your connection and retry';
  return 'Try uploading again or contact support';
}
```

---

## 🎨 Animation Improvements

### Smooth State Transitions
```css
/* Add to globals.css */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--progress); }
}

.file-card-enter {
  animation: fade-in 0.3s ease-out;
}

.progress-animate {
  animation: progress-fill 0.5s ease-out;
}
```

---

## 📊 Expected Impact

| Enhancement | Current Pain Point | Expected Improvement |
|-------------|-------------------|---------------------|
| Global Progress Bar | No overview of total progress | 40% reduction in perceived wait time |
| Smart Truncation | Cluttered, unreadable names | 60% better scannability |
| Thumbnail Fallbacks | Confusing black squares | 100% visual clarity |
| Individual Progress | Vague "up to a minute" | 50% less anxiety, better trust |
| Per-Item Actions | No control during upload | 80% more user confidence |
| Dynamic Filters | Manual switching needed | 30% faster navigation |
| Real-time Validation | Failed uploads waste time | 90% fewer failed uploads |

---

## 🚀 Implementation Priority

**Phase 1 (Week 1):**
- ✅ Global progress bar
- ✅ Smart filename truncation
- ✅ Real-time file validation
- ✅ Context-aware upload zone

**Phase 2 (Week 2):**
- ✅ Individual progress indicators
- ✅ Enhanced thumbnails with fallbacks
- ✅ Dynamic filtering
- ✅ Better error messages

**Phase 3 (Week 3):**
- ✅ Per-item action buttons (pause/cancel/retry)
- ✅ Enhanced sorting options
- ✅ Preview modal
- ✅ Animation polish

---

## 📝 Testing Checklist

- [ ] Upload 10+ files simultaneously
- [ ] Test with files >100MB (should show warning)
- [ ] Test with unsupported file types
- [ ] Pause and resume uploads
- [ ] Filter switching during active uploads
- [ ] Sort by each option
- [ ] Click thumbnails to preview
- [ ] Retry failed uploads
- [ ] Mobile touch targets (min 44px)
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Screen reader compatibility

---

**Last Updated:** January 2024
**Status:** Implementation Guide - Ready for Development
