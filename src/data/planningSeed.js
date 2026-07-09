// Default categories for the Planejamento module, matching the user's
// original spreadsheet legend. The weekly grid itself starts empty — there's
// no way to guess someone's actual routine.
// Colors are drawn from EVENT_COLORS (src/constants.js) so every default
// category also shows as "selected" in the manager's color swatch picker.
export const PLANNING_SEED_CATEGORIES = [
  { id: 'rotina', label: 'Rotina', color: '#7C3AED' },
  { id: 'trabalho', label: 'Trabalho', color: '#2563EB' },
  { id: 'aula-mandatoria', label: 'Aula Mandatória', color: '#1E3A8A' },
  { id: 'demandas', label: 'Demandas', color: '#DB2777' },
  { id: 'atualizacao', label: 'Atualização', color: '#0891B2' },
  { id: 'intervalo', label: 'Intervalo', color: '#D97706' },
  { id: 'limpeza', label: 'Limpeza', color: '#6B7280' },
  { id: 'academia', label: 'Academia', color: '#DC2626' },
  { id: 'livre', label: 'Livre', color: '#65A30D' },
]
