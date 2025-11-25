/**
 * Tipos para el módulo de Cloudinary
 */

export interface CloudinaryUploadOptions {
  folder?: 'products' | 'seo' | 'general';
  quality?: number;
  width?: number;
  height?: number;
  format?: 'auto' | 'jpg' | 'png' | 'webp';
}

export interface CloudinaryUploadResult {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
  folder: string;
  createdAt?: string;
}

export interface CloudinaryUploadResponse {
  image: CloudinaryUploadResult;
}

export interface CloudinaryMultipleUploadResponse {
  successful: CloudinaryUploadResult[];
  failed?: { error: string; file: string }[];
}

export interface CloudinaryGalleryResponse {
  images: CloudinaryUploadResult[];
}

export interface CloudinaryStats {
  usage: {
    credits?: number;
    usedCredits?: number;
    bandwidth?: number | null;
    storage?: number | null;
    requests?: number;
    resources?: number;
  };
  folders: {
    name: string;
    count?: number;
  }[];
  limits: {
    maxFileSize?: string;
    allowedFormats?: string[];
    maxFilesPerUpload?: number;
  };
}

export interface CloudinaryError {
  message: string;
  code?: string;
  details?: any;
}