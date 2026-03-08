/**
 * State Restoration - Unit Tests
 *
 * Tests the restoration flow when opening existing projects.
 * Covers:
 * - Restoring conversation state from Convex
 * - Restoring business info, template, palette, font, logo
 * - Handling interrupted builds
 * - Template restoration when templates load asynchronously
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InitialChatState } from '../types';

