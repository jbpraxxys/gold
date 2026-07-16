/**
 * Template Registry — Schema-driven presentation templates.
 * 
 * Each template defines slide layouts with JSON schemas.
 * The AI reads the schema and produces content that matches.
 * 
 * Architecture (inspired by Presenton):
 *   Template → Layouts → Schema → AI generates matching JSON
 *                                     ↓
 *                              Renderers: HTML (preview) + PPTX (export)
 */

import { z } from 'zod';

// ─── Template Types ─────────────────────────────────────────────────

export interface SlideLayout {
  /** Unique layout ID — referenced in presentation JSON */
  id: string
  /** Human-readable name for the AI */
  name: string
  /** Description that tells the AI when/how to use this layout */
  description: string
  /** Zod schema — validates the AI's content */
  schema: z.ZodObject<any>
  /** HTML renderer — takes validated content, returns slide HTML */
  renderHtml: (content: Record<string, any>) => string
  /** PPTX renderer — takes validated content, adds slide to presentation */
  renderPptx: (pres: any, content: Record<string, any>) => void
}

export interface PresentationTemplate {
  /** Unique template ID */
  id: string
  /** Display name */
  name: string
  /** Primary color (hex without #) */
  primaryColor: string
  /** Available slide layouts */
  layouts: SlideLayout[]
}

// ─── Registry ───────────────────────────────────────────────────────

const registry = new Map<string, PresentationTemplate>();

export function registerTemplate(template: PresentationTemplate) {
  registry.set(template.id, template);
}

export function getTemplate(id: string): PresentationTemplate | undefined {
  return registry.get(id);
}

export function listTemplates(): Array<{ id: string; name: string; layoutCount: number }> {
  return Array.from(registry.values()).map(t => ({
    id: t.id,
    name: t.name,
    layoutCount: t.layouts.length,
  }));
}

export function getLayoutsForTemplate(id: string): Array<{ id: string; name: string; description: string }> {
  const template = registry.get(id);
  if (!template) return [];
  return template.layouts.map(l => ({ id: l.id, name: l.name, description: l.description }));
}
