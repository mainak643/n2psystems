/**
 * File Security & Magic Byte Verification Utilities
 *
 * Protects Supabase Storage and downstream automated pipelines (like Gemini AI screening)
 * from malicious disguised files (e.g. executables renamed to .pdf or scripts masked as documents).
 */

// Well-known magic byte signatures
const MAGIC_BYTES = {
  // "%PDF" -> 0x25, 0x50, 0x44, 0x46
  pdf: [0x25, 0x50, 0x44, 0x46],
  // "PK\x03\x04" (Zip container for modern OOXML .docx)
  docx: [0x50, 0x4b, 0x03, 0x04],
  // Compound File Binary Format (Legacy Microsoft Office .doc)
  doc: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
};

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'so', 'bin', 'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1',
  'vbs', 'js', 'mjs', 'ts', 'jsx', 'tsx', 'php', 'phtml', 'py', 'rb',
  'pl', 'cgi', 'jar', 'apk', 'msi', 'com', 'scr', 'hta', 'app',
]);

/**
 * Checks if a filename has suspicious double extensions (e.g. `invoice.pdf.exe`).
 */
export function hasDangerousDoubleExtension(filename: string): boolean {
  const parts = filename.toLowerCase().split('.').filter(Boolean);
  if (parts.length > 2) {
    for (const part of parts.slice(1)) {
      if (DANGEROUS_EXTENSIONS.has(part)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Sanitizes a filename to prevent path traversal and object key tampering.
 */
export function sanitizeFilename(filename: string): string {
  // Strip path traversal and null bytes
  let clean = filename
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\0/g, '')
    .trim();

  // Strip leading dots to prevent hidden/dotfiles
  clean = clean.replace(/^\.+/, '');

  // Bound length to 100 characters while preserving extension
  if (clean.length > 100) {
    const extIndex = clean.lastIndexOf('.');
    if (extIndex > 0) {
      const ext = clean.slice(extIndex);
      const name = clean.slice(0, 100 - ext.length);
      clean = `${name}${ext}`;
    } else {
      clean = clean.slice(0, 100);
    }
  }

  return clean || 'document.pdf';
}

/**
 * Verifies that the file's raw binary magic bytes match its declared extension.
 * Reads only the first 16 bytes of the file for ultra-fast, zero-overhead verification.
 */
export async function verifyFileMagicBytes(file: File): Promise<{ valid: boolean; reason?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (hasDangerousDoubleExtension(file.name)) {
    return { valid: false, reason: 'The file name contains dangerous file extensions.' };
  }

  if (!['pdf', 'docx', 'doc'].includes(ext)) {
    return { valid: false, reason: 'Only PDF, DOCX, or DOC documents are accepted.' };
  }

  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (ext === 'pdf') {
      // PDF must start with %PDF- (0x25, 0x50, 0x44, 0x46)
      const isPdf =
        bytes[0] === MAGIC_BYTES.pdf[0] &&
        bytes[1] === MAGIC_BYTES.pdf[1] &&
        bytes[2] === MAGIC_BYTES.pdf[2] &&
        bytes[3] === MAGIC_BYTES.pdf[3];

      if (!isPdf) {
        return {
          valid: false,
          reason: 'File content does not match a valid PDF format. Please attach a genuine PDF document.',
        };
      }
    } else if (ext === 'docx') {
      // DOCX is a zip archive starting with PK\x03\x04
      const isDocx =
        bytes[0] === MAGIC_BYTES.docx[0] &&
        bytes[1] === MAGIC_BYTES.docx[1] &&
        bytes[2] === MAGIC_BYTES.docx[2] &&
        bytes[3] === MAGIC_BYTES.docx[3];

      if (!isDocx) {
        return {
          valid: false,
          reason: 'File content does not match a valid DOCX format. Please attach a genuine DOCX document.',
        };
      }
    } else if (ext === 'doc') {
      // DOC compound file binary format
      const isDoc =
        bytes[0] === MAGIC_BYTES.doc[0] &&
        bytes[1] === MAGIC_BYTES.doc[1] &&
        bytes[2] === MAGIC_BYTES.doc[2] &&
        bytes[3] === MAGIC_BYTES.doc[3];

      if (!isDoc) {
        return {
          valid: false,
          reason: 'File content does not match a valid DOC format. Please attach a genuine DOC document.',
        };
      }
    }

    return { valid: true };
  } catch (err) {
    console.error('[File Security] Error reading file bytes:', err);
    // If browser cannot read the slice, fail securely
    return { valid: false, reason: 'Could not verify file integrity. Please try saving as a standard PDF.' };
  }
}

