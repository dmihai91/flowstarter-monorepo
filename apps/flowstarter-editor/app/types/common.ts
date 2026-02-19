/**
 * Common shared types used across the application.
 * This file provides type-safe alternatives to `any` types.
 */

/*
 * ============================================================================
 * Window Size Types (for Preview)
 * ============================================================================
 */

export type DeviceFrameType = 'mobile' | 'tablet' | 'desktop' | 'none';

export interface WindowSize {
  name: string;
  width: number;
  height: number;
  icon: string;
  frameType?: DeviceFrameType;
  hasFrame?: boolean;
}

/*
 * ============================================================================
 * Tool Result Types
 * ============================================================================
 */

export interface ToolResultValue {
  type: string;
  content?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export type ToolResultCallback = (params: { toolCallId: string; result: ToolResultValue }) => void;

/*
 * ============================================================================
 * Settings Search Types
 * ============================================================================
 */

export interface SettingSearchItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  value: string | boolean | number | null;
  type: 'toggle' | 'input' | 'select' | 'action';
}

export type SettingValue = string | boolean | number | null | undefined;

/*
 * ============================================================================
 * API Response Types
 * ============================================================================
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/*
 * ============================================================================
 * Storage Types
 * ============================================================================
 */

export type StorageValue = string | number | boolean | object | null;

/*
 * ============================================================================
 * Markdown/AST Types
 * ============================================================================
 */

export interface MarkdownNode {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  data?: Record<string, unknown>;
  position?: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  [key: string]: unknown;
}

/*
 * ============================================================================
 * Process Info Types
 * ============================================================================
 */

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status?: string;
}

/*
 * ============================================================================
 * Memory Info Types
 * ============================================================================
 */

export interface MemoryInfo {
  total: number;
  free: number;
  used: number;
  percentage: number;
  swap?: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
}

/*
 * ============================================================================
 * File Upload Types
 * ============================================================================
 */

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  dataUrl?: string;
}

export interface ImageData {
  url: string;
  width?: number;
  height?: number;
  name?: string;
}

/*
 * ============================================================================
 * Chat/Message Annotation Types
 * ============================================================================
 */

export interface MessageAnnotation {
  type: string;
  value?: unknown;
  [key: string]: unknown;
}

/*
 * ============================================================================
 * Provider Configuration Types
 * ============================================================================
 */

export interface ProviderOptions {
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  fetch?: typeof fetch;
}

/*
 * ============================================================================
 * Error Types
 * ============================================================================
 */

export interface ApplicationError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/*
 * ============================================================================
 * Convex Types (for type-safe mutations/queries)
 * ============================================================================
 */

export type ConvexFunctionReference = `${string}:${string}`;

/*
 * ============================================================================
 * Form/Input Types
 * ============================================================================
 */

export interface FormFieldProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
}

