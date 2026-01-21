# Feature: File Preview - Side-by-Side Comparison

## Overview

When replacing evidence files, you can now **see a side-by-side preview** of both the **current file** and the **new file** before confirming the replacement.

---

## ✨ Features

### 1. Side-by-Side Comparison
- **Current file** displayed on the left (red header)
- **New file** displayed on the right (green header)
- Compare both files before replacing
- Clear visual distinction

### 2. Image Previews
- Actual image thumbnails for photos
- Max height: 150px (auto-scaled)
- Supports: JPG, PNG, GIF, BMP, WebP, etc.
- Loads directly from encrypted storage

### 3. File Type Icons
Different colored icons for different file types:
- 📄 **PDF** - Red icon
- 📝 **Word** - Blue icon
- 📊 **Excel** - Green icon
- 🎥 **Video** - Purple icon
- 🎵 **Audio** - Pink icon
- 📦 **Archive** - Orange icon
- 📁 **Generic** - Gray icon

### 4. File Information
Each file shows:
- **File name**
- **File size** (in KB)
- **File type** (MIME type)

### 5. Real-Time Preview
- New file previews **instantly** when selected
- No upload required to preview
- See exactly what you're replacing with

---

## 🎨 Visual Layout

```
┌────────────────────────────────────────────────────────────┐
│  📤 Replace Evidence File                             [×]  │
├────────────────────────────────────────────────────────────┤
│  ⚠️  Warning: Replacing will delete old file              │
│                                                            │
│  ┌─────────────────────────┐  ┌─────────────────────────┐ │
│  │ 📄 Current File (RED)   │  │ 📤 New File (GREEN)     │ │
│  ├─────────────────────────┤  ├─────────────────────────┤ │
│  │                         │  │                         │ │
│  │   [Image Preview]       │  │   [Image Preview]       │ │
│  │      or                 │  │      or                 │ │
│  │   [File Icon]           │  │   [File Icon]           │ │
│  │                         │  │                         │ │
│  ├─────────────────────────┤  ├─────────────────────────┤ │
│  │ photo.jpg               │  │ photo_v2.jpg            │ │
│  │ Size: 245.32 KB         │  │ Size: 312.45 KB         │ │
│  │ Type: image/jpeg        │  │ Type: image/jpeg        │ │
│  └─────────────────────────┘  └─────────────────────────┘ │
│                                                            │
│  Select New File: *                                        │
│  [Choose File: photo_v2.jpg]                               │
│  Maximum file size: 50MB                                   │
│                                                            │
│                              [Cancel]  [📤 Replace File]  │
└────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow

### Step 1: Open Replace Dialog
```
Click "Replace File" button
  ↓
Dialog opens with 2 panels
```

### Step 2: View Current File
```
Left panel loads automatically
  ↓
Shows image preview (if image)
  OR
Shows file icon (if non-image)
  ↓
Displays file name, size, type
```

### Step 3: Select New File
```
Click "Choose File"
  ↓
Select file from computer
  ↓
Right panel updates instantly
```

### Step 4: Preview New File
```
Image? → Shows thumbnail preview
  OR
Non-image? → Shows colored icon
  ↓
Displays file name, size, type
```

### Step 5: Compare & Replace
```
Compare both files side-by-side
  ↓
Click "Replace File" to confirm
  OR
Click "Cancel" to abort
```

---

## 🎯 Preview Types

### For Images
**Supported Formats:**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- SVG (.svg)

**Display:**
- Actual image thumbnail
- Scaled to fit (max 150px height)
- Maintains aspect ratio
- Center-aligned

### For Non-Images
**File Types with Icons:**

| File Type | Icon | Color |
|-----------|------|-------|
| PDF | fa-file-pdf | Red (#ef4444) |
| Word | fa-file-word | Blue (#2563eb) |
| Excel | fa-file-excel | Green (#059669) |
| Video | fa-file-video | Purple (#8b5cf6) |
| Audio | fa-file-audio | Pink (#ec4899) |
| Archive | fa-file-archive | Orange (#f59e0b) |
| Generic | fa-file | Gray (#6b7280) |

---

## 💡 Example Scenarios

### Scenario 1: Replacing Photo
```
Current File (Left):
  📷 crime_scene_001.jpg
  [Actual thumbnail image]
  Size: 245.32 KB
  Type: image/jpeg

New File (Right):
  📷 crime_scene_001_enhanced.jpg
  [Actual thumbnail image]
  Size: 312.45 KB
  Type: image/jpeg

User can:
- See both images side-by-side
- Compare quality/content
- Decide if replacement is correct
```

### Scenario 2: Replacing PDF
```
Current File (Left):
  📄 [Red PDF icon]
  lab_report_draft.pdf
  Size: 450.12 KB
  Type: application/pdf

New File (Right):
  📄 [Red PDF icon]
  lab_report_final.pdf
  Size: 520.89 KB
  Type: application/pdf

User can:
- See both file names
- Compare file sizes
- Verify correct file selected
```

### Scenario 3: Replacing Video
```
Current File (Left):
  🎥 [Purple video icon]
  interview_raw.mp4
  Size: 15240.50 KB
  Type: video/mp4

New File (Right):
  🎥 [Purple video icon]
  interview_edited.mp4
  Size: 10520.32 KB
  Type: video/mp4

User can:
- See file names clearly
- Notice size reduction (compressed)
- Confirm correct video file
```

---

## 🔧 Technical Implementation

### Current File Preview
```javascript
loadCurrentFilePreview(evidenceId) {
    // 1. Check if file is an image
    if (file_type.startsWith('image/')) {
        // 2. Fetch encrypted file
        fetch('/evidence/{id}/download')
        // 3. Convert to blob
        .then(response => response.blob())
        // 4. Create object URL
        // 5. Display as <img>
    } else {
        // Show appropriate icon
        showFileIcon(file_type);
    }
}
```

### New File Preview
```javascript
previewNewFile(input) {
    const file = input.files[0];
    
    // Update file info
    showFileInfo(file.name, file.size, file.type);
    
    // Check if image
    if (file.type.startsWith('image/')) {
        // Use FileReader to preview
        reader.readAsDataURL(file);
        // Display thumbnail
    } else {
        // Show colored icon
        showFileIcon(file.type);
    }
}
```

### Icon Selection
```javascript
showFileIcon(fileType) {
    // Determine icon and color based on MIME type
    if (fileType.includes('pdf')) return ['fa-file-pdf', '#ef4444'];
    if (fileType.includes('word')) return ['fa-file-word', '#2563eb'];
    if (fileType.includes('excel')) return ['fa-file-excel', '#059669'];
    // ... etc
}
```

---

## ✅ Benefits

### 1. Visual Confirmation
- See exactly what you're replacing
- Avoid wrong file uploads
- Visual comparison before commit

### 2. Reduced Errors
- Catch mistakes before upload
- Verify file quality
- Check file size differences

### 3. Better UX
- No blind replacement
- Clear visual feedback
- Professional interface

### 4. Confidence
- Know what you're doing
- See file details clearly
- Make informed decisions

---

## 🎯 Use Cases

### Evidence Quality Improvement
```
Scenario: Better photo available
Action: Replace low-res with high-res photo
Benefit: See quality difference before replacing
```

### Document Updates
```
Scenario: Updated report available
Action: Replace draft with final version
Benefit: Verify correct file selected
```

### File Corrections
```
Scenario: Wrong file uploaded initially
Action: Replace with correct file
Benefit: Compare to ensure different file
```

### Format Conversions
```
Scenario: Need different file format
Action: Replace with converted version
Benefit: See file type change clearly
```

---

## 🔐 Security

### Current File
- Decrypted on-the-fly for preview
- Never stored unencrypted
- Requires authentication
- Access control enforced

### New File
- Previewed client-side only
- Not uploaded until confirmed
- Validated before upload
- Encrypted after upload

---

## 📱 Responsive Design

### Desktop (>800px)
- Two-column layout
- Side-by-side comparison
- Larger previews

### Tablet (600-800px)
- Two-column layout
- Smaller previews
- Compact info display

### Mobile (<600px)
- Single-column layout
- Stacked previews
- Touch-friendly buttons

---

## 🧪 Testing Checklist

- [ ] Replace image file - see both previews
- [ ] Replace PDF file - see both icons
- [ ] Replace video file - see file info
- [ ] No file selected - see placeholder
- [ ] Large image - scales correctly
- [ ] Wrong format - shows correct icon
- [ ] File info displays correctly
- [ ] Can cancel replacement
- [ ] Can confirm replacement
- [ ] Preview loads on dialog open

---

## 🎨 Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Current File Header | Red (#dc2626) | Emphasizes "old" |
| New File Header | Green (#059669) | Emphasizes "new" |
| Background | Gray (#f9fafb) | Neutral container |
| Border | Light Gray (#e5e7eb) | Subtle separation |
| Warning | Yellow (#f59e0b) | Attention message |

---

## 📊 File Size Display

Automatically formats file sizes:
- Under 1 MB: Shows in KB (e.g., "245.32 KB")
- Over 1 MB: Could show in MB (e.g., "2.45 MB")
- Consistent decimal places (2 digits)

---

## 🚀 Performance

### Optimizations
- Lazy loading of current file
- Client-side preview for new file
- Thumbnail size limited to 150px
- Object URLs cleaned up after use

### Loading States
- Spinner while loading current file
- Instant preview for new file
- Smooth transitions

---

## 💬 User Feedback

### Visual Cues
- ✅ Loading spinner (current file)
- ✅ Upload icon (no file selected)
- ✅ Color-coded headers (red vs green)
- ✅ File size comparison visible
- ✅ Clear labeling

---

## 📝 Summary

**Before Preview Feature:**
```
- Select file blindly
- Hope it's correct
- Upload to see
```

**After Preview Feature:**
```
- See current file
- Select new file
- See new file
- Compare side-by-side
- Replace with confidence
```

---

**Status:** ✅ Complete and Ready  
**Version:** 1.5 (Preview Feature)  
**Date:** December 31, 2024  
**Enhancement:** Major UX improvement
