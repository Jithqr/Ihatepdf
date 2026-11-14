import { Capacitor } from "@capacitor/core";
import { toast } from "@/hooks/use-toast";
import { renderPdfThumbnail } from "./pdfjs";

/**
 * Generates a preview URL for a file
 */
export const generateFilePreview = async (file: File): Promise<string> => {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) {
    return renderPdfThumbnail(file, 1.15);
  }

  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to generate image preview'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      reader.readAsDataURL(file);
    } else {
      reject(new Error('Unsupported file type for preview'));
    }
  });
};

/**
 * Creates a file with the specified content and name
 */
export const createFile = (
  content: Blob | string,
  fileName: string,
  type: string
): File => {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  return new File([blob], fileName, { type });
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.readAsDataURL(blob);
  });

/**
 * Android WebViews ignore blob: downloads, so inside the native app the file
 * is written to the app cache and handed to the system share sheet, from which
 * the user can pick "Save to Files", Drive, WhatsApp, etc.
 */
const saveNative = async (blob: Blob, fileName: string): Promise<void> => {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);
  const safeName = fileName.replace(/[\\/:*?"<>|]+/g, "_").trim() || "download";
  const written = await Filesystem.writeFile({
    path: safeName,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
  });
  await Share.share({
    title: safeName,
    files: [written.uri],
    dialogTitle: "Save or share",
  });
};

/**
 * Downloads a file to the user's device
 */
export const downloadFile = (content: Blob | string, fileName: string, type?: string): void => {
  const blob = content instanceof Blob ? content : new Blob([content], { type });

  if (Capacitor.isNativePlatform()) {
    saveNative(blob, fileName).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      // Closing the share sheet without choosing anything is not an error.
      if (/cancel/i.test(message)) return;
      console.error("Saving file failed:", error);
      toast({
        title: "Could not save file",
        description: message,
        variant: "destructive",
      });
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Formats a file size in bytes to a human-readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Checks if a file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Checks if a file is a PDF
 */
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};

/**
 * Validates a file against size and type constraints
 */
export const validateFile = (
  file: File,
  { maxSizeInMB = 50, acceptedTypes = [] }: { maxSizeInMB?: number; acceptedTypes?: string[] } = {}
): { valid: boolean; error?: string } => {
  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${maxSizeInMB}MB`,
    };
  }

  // Check file type if acceptedTypes is provided
  if (acceptedTypes.length > 0) {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const mimeType = file.type;
    
    const isAcceptedType = acceptedTypes.some((type) => {
      // Check for MIME type pattern
      if (type.includes('/')) {
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0];
          return mimeType.startsWith(`${mainType}/`);
        }
        return mimeType === type;
      }
      // Check for file extension
      return fileExtension === type;
    });

    if (!isAcceptedType) {
      return {
        valid: false,
        error: `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`,
      };
    }
  }

  return { valid: true };
};
