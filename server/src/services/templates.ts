/**
 * Starter breakdowns for project templates (Req 3.5, FEATURES.md §10).
 * These are only starting points — users can freely restructure afterwards.
 */
export interface TemplateNode {
  name: string;
  type: string;
  children?: TemplateNode[];
}

export const TEMPLATES: Record<string, TemplateNode[]> = {
  residential: [
    {
      name: 'Building A',
      type: 'building',
      children: [
        { name: 'Foundation', type: 'phase', children: [
          { name: 'Excavation', type: 'work' },
          { name: 'Footings', type: 'work' },
          { name: 'Slab', type: 'work' },
        ] },
        { name: 'Ground Floor', type: 'floor', children: [
          { name: 'Living Room', type: 'room' },
          { name: 'Kitchen', type: 'room' },
          { name: 'Bedroom', type: 'room' },
        ] },
        { name: 'First Floor', type: 'floor', children: [
          { name: 'Bedroom 1', type: 'room' },
          { name: 'Bedroom 2', type: 'room' },
        ] },
        { name: 'Electrical', type: 'trade', children: [
          { name: 'Wiring', type: 'work' },
          { name: 'Lighting', type: 'work' },
          { name: 'Panel', type: 'work' },
        ] },
        { name: 'Plumbing', type: 'trade' },
      ],
    },
  ],
  commercial: [
    {
      name: 'Main Building',
      type: 'building',
      children: [
        { name: 'Foundation', type: 'phase' },
        { name: 'Ground Floor', type: 'floor' },
        { name: 'Mezzanine', type: 'floor' },
        { name: 'HVAC', type: 'trade' },
        { name: 'Electrical', type: 'trade' },
        { name: 'Fire Safety', type: 'trade' },
      ],
    },
  ],
  road: [
    {
      name: 'Roadway',
      type: 'area',
      children: [
        { name: 'Earthworks', type: 'phase' },
        { name: 'Sub-base', type: 'phase' },
        { name: 'Base Course', type: 'phase' },
        { name: 'Paving', type: 'phase' },
        { name: 'Drainage', type: 'trade' },
      ],
    },
  ],
  custom: [],
};

export function templateFor(type: string): TemplateNode[] {
  return TEMPLATES[type] ?? TEMPLATES.custom;
}
