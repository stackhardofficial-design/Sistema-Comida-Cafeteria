// Librería de íconos SVG profesionales para categorías (nano-style)
// 50 íconos de comida, bebidas y más

export const CATEGORY_ICONS = [
  // ── COMIDAS ──
  {
    id: 'pizza',
    label: 'Pizza',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M20 4 L36 34 L4 34 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
        <circle cx="16" cy="22" r="2.5" fill="#EF4444"/>
        <circle cx="23" cy="28" r="2.5" fill="#EF4444"/>
        <circle cx="20" cy="17" r="1.8" fill="#10B981"/>
        <circle cx="12" cy="28" r="1.5" fill="#10B981"/>
        <path d="M20 4 L36 34" stroke="#D97706" strokeWidth="0.8"/>
        <path d="M20 4 L4 34" stroke="#D97706" strokeWidth="0.8"/>
      </svg>
    )
  },
  {
    id: 'hamburger',
    label: 'Hamburguesa',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="11" rx="15" ry="8" fill="#D97706" stroke="#92400E" strokeWidth="1.2"/>
        <rect x="5" y="17" width="30" height="4" rx="1" fill="#10B981"/>
        <rect x="5" y="19" width="30" height="3" rx="0" fill="#EF4444"/>
        <rect x="6" y="22" width="28" height="5" rx="1" fill="#FBBF24"/>
        <ellipse cx="20" cy="31" rx="14" ry="5" fill="#D97706" stroke="#92400E" strokeWidth="1.2"/>
        <circle cx="12" cy="10" r="1.5" fill="#FDE68A"/>
        <circle cx="18" cy="8" r="1" fill="#FDE68A"/>
        <circle cx="26" cy="11" r="1.2" fill="#FDE68A"/>
      </svg>
    )
  },
  {
    id: 'sushi',
    label: 'Sushi',
    group: 'Internacional',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="22" rx="14" ry="10" fill="#F9FAFB" stroke="#374151" strokeWidth="1.5"/>
        <ellipse cx="20" cy="22" rx="11" ry="7" fill="#374151"/>
        <ellipse cx="20" cy="22" rx="8" ry="5" fill="#F9FAFB"/>
        <ellipse cx="20" cy="22" rx="5" ry="3" fill="#EF4444"/>
        <ellipse cx="20" cy="22" rx="3" ry="1.8" fill="#FCA5A5"/>
        <rect x="8" y="32" width="4" height="14" rx="2" fill="#9CA3AF" transform="rotate(-20 8 32)"/>
        <rect x="28" y="32" width="4" height="14" rx="2" fill="#9CA3AF" transform="rotate(20 28 32)"/>
      </svg>
    )
  },
  {
    id: 'taco',
    label: 'Taco',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 30 Q20 8 36 30" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M8 30 Q20 12 32 30" fill="none" stroke="#D97706" strokeWidth="0.5"/>
        <ellipse cx="14" cy="26" rx="3" ry="2" fill="#EF4444"/>
        <ellipse cx="20" cy="24" rx="3" ry="2" fill="#10B981"/>
        <ellipse cx="26" cy="26" rx="3" ry="2" fill="#F59E0B"/>
        <path d="M4 30 Q20 34 36 30" fill="#D97706" stroke="#92400E" strokeWidth="1"/>
      </svg>
    )
  },
  {
    id: 'pasta',
    label: 'Pasta',
    group: 'Principales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="26" rx="16" ry="8" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M8 26 Q14 20 20 26 Q26 32 32 26" stroke="#F59E0B" strokeWidth="2" fill="none"/>
        <path d="M10 24 Q16 18 22 24 Q28 30 34 24" stroke="#F59E0B" strokeWidth="1.5" fill="none"/>
        <path d="M6 28 Q12 22 18 28 Q24 34 30 28" stroke="#FBBF24" strokeWidth="1.5" fill="none"/>
        <circle cx="14" cy="20" r="2.5" fill="#EF4444"/>
        <circle cx="22" cy="19" r="2" fill="#EF4444"/>
        <circle cx="28" cy="22" r="2.5" fill="#EF4444"/>
        <ellipse cx="20" cy="26" rx="16" ry="8" fill="none" stroke="#D97706" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'empanada',
    label: 'Empanada',
    group: 'Regionales / Clásicos',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 24 Q20 6 34 24 Q30 34 20 34 Q10 34 6 24Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M8 22 Q20 8 32 22" stroke="#D97706" strokeWidth="1" fill="none" strokeDasharray="3,2"/>
        <circle cx="17" cy="22" r="2" fill="#EF4444"/>
        <circle cx="23" cy="24" r="2" fill="#EF4444"/>
        <circle cx="20" cy="19" r="1.5" fill="#10B981"/>
        <path d="M6 24 Q8 26 10 24 Q12 22 14 24 Q16 26 18 24 Q20 22 22 24 Q24 26 26 24 Q28 22 30 24 Q32 26 34 24" stroke="#92400E" strokeWidth="1.2" fill="none"/>
      </svg>
    )
  },
  {
    id: 'hotdog',
    label: 'Pancho / Hot Dog',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="20" rx="18" ry="10" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
        <rect x="4" y="18" width="32" height="4" fill="#FDE68A"/>
        <ellipse cx="20" cy="20" rx="12" ry="5" fill="#EF4444" stroke="#DC2626" strokeWidth="0.8"/>
        <path d="M8 18 Q20 14 32 18" stroke="#FDE68A" strokeWidth="1.5" fill="none"/>
        <path d="M8 22 Q20 26 32 22" stroke="#FDE68A" strokeWidth="1.5" fill="none"/>
        <path d="M10 18 Q12 17 14 18 Q16 19 18 18 Q20 17 22 18 Q24 19 26 18 Q28 17 30 18" stroke="#FBBF24" strokeWidth="1" fill="none"/>
      </svg>
    )
  },
  {
    id: 'nuggets',
    label: 'Nuggets / Papas',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="13" y="6" width="5" height="18" rx="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2"/>
        <rect x="20" y="4" width="5" height="20" rx="2.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2"/>
        <rect x="27" y="7" width="5" height="17" rx="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2"/>
        <path d="M10 24 Q15 28 20 24 Q25 28 30 24 L32 38 Q26 36 20 38 Q14 36 8 38 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.2"/>
        <text x="13" y="34" fontSize="7" fill="white" fontWeight="bold">M</text>
      </svg>
    )
  },
  {
    id: 'sandwich',
    label: 'Sándwich',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="32" height="7" rx="3.5" fill="#D97706" stroke="#92400E" strokeWidth="1.2"/>
        <rect x="6" y="15" width="28" height="3" rx="1" fill="#10B981"/>
        <rect x="6" y="18" width="28" height="3" rx="1" fill="#FCA5A5"/>
        <rect x="6" y="21" width="28" height="3" rx="1" fill="#FBBF24"/>
        <rect x="6" y="24" width="28" height="3" rx="1" fill="#10B981"/>
        <rect x="4" y="27" width="32" height="7" rx="3.5" fill="#D97706" stroke="#92400E" strokeWidth="1.2"/>
        <circle cx="12" cy="11" r="1.5" fill="#FDE68A"/>
        <circle cx="20" cy="10" r="1.5" fill="#FDE68A"/>
        <circle cx="28" cy="11" r="1.5" fill="#FDE68A"/>
      </svg>
    )
  },
  {
    id: 'wrap',
    label: 'Wrap / Burrito',
    group: 'Comidas Rápidas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="20" rx="14" ry="16" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" transform="rotate(30 20 20)"/>
        <ellipse cx="20" cy="18" rx="10" ry="13" fill="none" stroke="#D97706" strokeWidth="0.8" transform="rotate(30 20 20)"/>
        <ellipse cx="19" cy="17" rx="6" ry="9" fill="#10B981" opacity="0.7" transform="rotate(30 20 20)"/>
        <ellipse cx="21" cy="19" rx="5" ry="7" fill="#EF4444" opacity="0.7" transform="rotate(30 20 20)"/>
        <path d="M14 8 Q20 4 26 8" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'salad',
    label: 'Ensalada',
    group: 'Saludable',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="28" rx="16" ry="8" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <circle cx="14" cy="22" r="5" fill="#16A34A"/>
        <circle cx="22" cy="20" r="6" fill="#22C55E"/>
        <circle cx="28" cy="24" r="4.5" fill="#16A34A"/>
        <circle cx="16" cy="26" r="4" fill="#86EFAC"/>
        <circle cx="12" cy="22" r="1.5" fill="#EF4444"/>
        <circle cx="26" cy="21" r="1.5" fill="#EF4444"/>
        <circle cx="20" cy="24" r="1.5" fill="#FCA5A5"/>
        <ellipse cx="20" cy="28" rx="16" ry="8" fill="none" stroke="#16A34A" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'soup',
    label: 'Sopas',
    group: 'Entradas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 20 Q6 36 20 36 Q34 36 34 20 Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5"/>
        <rect x="6" y="18" width="28" height="4" rx="2" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2"/>
        <circle cx="14" cy="28" r="2" fill="#EF4444"/>
        <circle cx="20" cy="30" r="2" fill="#F59E0B"/>
        <circle cx="26" cy="28" r="2" fill="#10B981"/>
        <path d="M14 10 Q14 14 17 14 Q14 14 14 18" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M20 8 Q20 12 23 12 Q20 12 20 16" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M26 10 Q26 14 29 14 Q26 14 26 18" stroke="#10B981" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <rect x="32" y="18" width="6" height="3" rx="1.5" fill="#9CA3AF"/>
      </svg>
    )
  },
  {
    id: 'steak',
    label: 'Carnes / Parrilla',
    group: 'Carnes',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="24" rx="16" ry="10" fill="#7C2D12" stroke="#431407" strokeWidth="1.5"/>
        <ellipse cx="20" cy="22" rx="13" ry="8" fill="#991B1B"/>
        <ellipse cx="18" cy="21" rx="9" ry="5" fill="#B91C1C"/>
        <path d="M12 24 Q16 20 20 24 Q24 28 28 24" stroke="#7F1D1D" strokeWidth="1.5" fill="none"/>
        <circle cx="14" cy="19" r="1.5" fill="#FBBF24"/>
        <circle cx="22" cy="18" r="1.5" fill="#FBBF24"/>
        <ellipse cx="20" cy="24" rx="16" ry="10" fill="none" stroke="#431407" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'chicken',
    label: 'Pollo',
    group: 'Principales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 30 Q8 20 14 16 Q18 12 22 14 Q28 14 30 20 Q34 28 30 34 Q22 38 14 34 Z" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
        <path d="M14 16 Q12 10 16 8 Q20 6 20 10" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1"/>
        <circle cx="26" cy="18" r="2" fill="#1F2937"/>
        <circle cx="26.8" cy="17.2" r="0.7" fill="white"/>
        <path d="M10 30 L6 34" stroke="#D97706" strokeWidth="3" strokeLinecap="round"/>
        <path d="M30 34 L34 36" stroke="#D97706" strokeWidth="3" strokeLinecap="round"/>
        <ellipse cx="20" cy="24" rx="8" ry="6" fill="#FBBF24" opacity="0.4"/>
      </svg>
    )
  },
  {
    id: 'fish',
    label: 'Pescados',
    group: 'Principales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M34 20 Q26 10 14 14 Q6 18 8 26 Q10 34 20 30 Q30 28 34 20Z" fill="#93C5FD" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M8 20 Q4 14 2 20 Q4 26 8 20Z" fill="#60A5FA" stroke="#2563EB" strokeWidth="1"/>
        <path d="M22 18 Q24 16 26 18 Q24 20 22 18Z" fill="white" stroke="#93C5FD" strokeWidth="0.5"/>
        <circle cx="30" cy="18" r="2" fill="#1E3A8A"/>
        <circle cx="30.8" cy="17.2" r="0.8" fill="white"/>
        <path d="M18 18 Q20 20 22 18" stroke="#2563EB" strokeWidth="0.8" fill="none"/>
        <path d="M16 22 Q18 24 20 22" stroke="#2563EB" strokeWidth="0.8" fill="none"/>
      </svg>
    )
  },
  {
    id: 'vegan',
    label: 'Vegano',
    group: 'Saludable',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/>
        <path d="M20 8 Q28 14 26 24 Q20 32 14 24 Q12 14 20 8Z" fill="#16A34A"/>
        <path d="M20 8 Q20 20 20 32" stroke="#86EFAC" strokeWidth="1.5" fill="none"/>
        <path d="M20 16 Q24 18 26 24" stroke="#86EFAC" strokeWidth="1" fill="none"/>
        <path d="M20 22 Q16 20 14 24" stroke="#86EFAC" strokeWidth="1" fill="none"/>
        <text x="10" y="36" fontSize="8" fill="#16A34A" fontWeight="bold">VEG</text>
      </svg>
    )
  },
  {
    id: 'breakfast',
    label: 'Desayuno',
    group: 'Cafetería',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="26" rx="14" ry="8" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="1.5"/>
        <circle cx="20" cy="24" r="8" fill="#FDE68A" stroke="#D97706" strokeWidth="1"/>
        <circle cx="20" cy="24" r="4.5" fill="#FCD34D"/>
        <path d="M6 18 Q8 14 12 14" stroke="#D97706" strokeWidth="1.5" fill="none"/>
        <ellipse cx="9" cy="14" rx="3" ry="4" fill="#EF4444" stroke="#DC2626" strokeWidth="1" transform="rotate(-20 9 14)"/>
        <path d="M8 10 Q8 7 10 7 Q12 7 12 10" stroke="#DC2626" strokeWidth="1" fill="none"/>
      </svg>
    )
  },
  {
    id: 'dessert',
    label: 'Postres',
    group: 'Postres',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20 Q10 36 20 36 Q30 36 30 20 Z" fill="#FDE8D8" stroke="#F97316" strokeWidth="1.5"/>
        <rect x="10" y="18" width="20" height="4" rx="2" fill="#F97316"/>
        <path d="M15 18 Q15 10 20 8 Q25 10 25 18" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
        <path d="M16 8 Q18 4 20 6 Q22 4 24 8" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="20" cy="4" r="2" fill="#EF4444"/>
        <circle cx="14" cy="28" r="2" fill="#F97316"/>
        <circle cx="26" cy="28" r="2" fill="#F97316"/>
        <circle cx="20" cy="30" r="1.5" fill="#FDE68A"/>
      </svg>
    )
  },
  {
    id: 'snack',
    label: 'Snacks',
    group: 'Entradas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12 L12 8 L32 8 L36 12 L36 30 Q36 36 30 36 L10 36 Q4 36 4 30 L4 12 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M4 16 L36 16" stroke="#D97706" strokeWidth="0.8"/>
        <circle cx="12" cy="24" r="2.5" fill="#EF4444"/>
        <circle cx="20" cy="22" r="2.5" fill="#3B82F6"/>
        <circle cx="28" cy="24" r="2.5" fill="#10B981"/>
        <circle cx="16" cy="29" r="2" fill="#8B5CF6"/>
        <circle cx="24" cy="29" r="2" fill="#F59E0B"/>
        <rect x="8" y="8" width="24" height="3" rx="1" fill="#FDE68A"/>
      </svg>
    )
  },
  {
    id: 'kids',
    label: 'Menú Niños',
    group: 'Infantil',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="10" fill="#FDE68A"/>
        <circle cx="15" cy="17" r="2" fill="#1F2937"/>
        <circle cx="25" cy="17" r="2" fill="#1F2937"/>
        <circle cx="15.8" cy="16.2" r="0.8" fill="white"/>
        <circle cx="25.8" cy="16.2" r="0.8" fill="white"/>
        <path d="M14 24 Q17 27 20 25 Q23 27 26 24" stroke="#D97706" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="12" cy="20" rx="2" ry="3" fill="#FCA5A5" opacity="0.6"/>
        <ellipse cx="28" cy="20" rx="2" ry="3" fill="#FCA5A5" opacity="0.6"/>
        <path d="M17 12 Q18 9 20 10 Q22 9 23 12" stroke="#D97706" strokeWidth="1.5" fill="none"/>
      </svg>
    )
  },

  // ── BEBIDAS ──
  {
    id: 'coffee',
    label: 'Café',
    group: 'Cafetería',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 16 L34 16 L30 34 Q30 36 26 36 L14 36 Q10 36 10 34 Z" fill="#6B3A2A" stroke="#431407" strokeWidth="1.5"/>
        <rect x="6" y="13" width="28" height="5" rx="2.5" fill="#92400E" stroke="#431407" strokeWidth="1"/>
        <path d="M30 22 Q36 22 36 26 Q36 30 30 30" stroke="#92400E" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M14 8 Q14 11 16 11 Q14 11 14 14" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M20 6 Q20 9 22 9 Q20 9 20 12" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M26 8 Q26 11 28 11 Q26 11 26 14" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <ellipse cx="18" cy="26" rx="5" ry="3" fill="#92400E" opacity="0.5"/>
      </svg>
    )
  },
  {
    id: 'beer',
    label: 'Cerveza',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="14" width="18" height="24" rx="3" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
        <rect x="10" y="8" width="18" height="8" rx="3" fill="white" stroke="#9CA3AF" strokeWidth="1.2"/>
        <path d="M28 20 Q34 20 34 24 Q34 28 28 28" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <rect x="12" y="16" width="14" height="8" rx="1" fill="#FDE68A" opacity="0.5"/>
        <path d="M12 26 L26 26" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2,2"/>
        <path d="M12 30 L26 30" stroke="#D97706" strokeWidth="0.8" strokeDasharray="2,2"/>
        <rect x="10" y="8" width="18" height="4" rx="2" fill="white"/>
      </svg>
    )
  },
  {
    id: 'cocktail',
    label: 'Cócteles / Tragos',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 8 L20 24 L32 8 Z" fill="#E879F9" stroke="#A21CAF" strokeWidth="1.5"/>
        <path d="M8 8 L32 8" stroke="#A21CAF" strokeWidth="2"/>
        <rect x="18" y="24" width="4" height="10" fill="#C084FC" stroke="#A21CAF" strokeWidth="1"/>
        <rect x="12" y="34" width="16" height="3" rx="1.5" fill="#A21CAF"/>
        <circle cx="26" cy="14" r="3" fill="#F9A8D4" stroke="#EC4899" strokeWidth="1"/>
        <path d="M28 8 Q30 6 32 4" stroke="#A21CAF" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M30 8 Q32 8 34 6" stroke="#EC4899" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M10 14 L20 22" stroke="white" strokeWidth="0.5" opacity="0.4"/>
      </svg>
    )
  },
  {
    id: 'wine',
    label: 'Vinos',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4 L28 4 L26 20 Q26 28 20 30 Q14 28 14 20 Z" fill="#7C3AED" stroke="#5B21B6" strokeWidth="1.5"/>
        <path d="M14 20 Q18 26 26 20" fill="#A855F7" opacity="0.6"/>
        <rect x="18" y="30" width="4" height="8" fill="#7C3AED" stroke="#5B21B6" strokeWidth="1"/>
        <rect x="12" y="38" width="16" height="3" rx="1.5" fill="#5B21B6"/>
        <path d="M14 12 Q16 10 18 12" stroke="#C4B5FD" strokeWidth="1" fill="none"/>
        <path d="M22 10 Q24 8 26 10" stroke="#C4B5FD" strokeWidth="1" fill="none"/>
        <path d="M12 4 L28 4" stroke="#5B21B6" strokeWidth="2"/>
      </svg>
    )
  },
  {
    id: 'smoothie',
    label: 'Smoothies',
    group: 'Bebidas sin Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12 L14 36 Q14 38 20 38 Q26 38 26 36 L28 12 Z" fill="#EC4899" stroke="#BE185D" strokeWidth="1.5"/>
        <rect x="10" y="10" width="20" height="4" rx="2" fill="#F9A8D4" stroke="#BE185D" strokeWidth="1"/>
        <path d="M20 10 L20 2" stroke="#9CA3AF" strokeWidth="1.5" strokeDasharray="3,2"/>
        <ellipse cx="20" cy="2" rx="4" ry="1.5" fill="#9CA3AF"/>
        <circle cx="16" cy="22" r="2" fill="#FDE68A" opacity="0.7"/>
        <circle cx="23" cy="26" r="1.5" fill="#FDE68A" opacity="0.7"/>
        <circle cx="17" cy="30" r="1.5" fill="white" opacity="0.4"/>
        <path d="M14 16 Q17 14 20 16 Q23 18 26 16" stroke="#F9A8D4" strokeWidth="1" fill="none"/>
      </svg>
    )
  },
  {
    id: 'soda',
    label: 'Gaseosas / Refrescos',
    group: 'Bebidas sin Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="10" width="20" height="28" rx="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5"/>
        <rect x="10" y="6" width="20" height="6" rx="3" fill="#93C5FD" stroke="#1D4ED8" strokeWidth="1.2"/>
        <path d="M20 6 L20 2" stroke="#9CA3AF" strokeWidth="1.5"/>
        <circle cx="20" cy="2" r="1.5" fill="#9CA3AF"/>
        <rect x="13" y="14" width="14" height="8" rx="2" fill="#60A5FA" opacity="0.5"/>
        <circle cx="16" cy="26" r="1.5" fill="white" opacity="0.5"/>
        <circle cx="21" cy="30" r="1" fill="white" opacity="0.5"/>
        <circle cx="25" cy="25" r="1" fill="white" opacity="0.5"/>
        <path d="M13 20 L27 20" stroke="#1D4ED8" strokeWidth="0.5"/>
      </svg>
    )
  },
  {
    id: 'juice',
    label: 'Jugos Naturales',
    group: 'Bebidas sin Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 16 L12 36 Q12 38 20 38 Q28 38 28 36 L30 16 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
        <rect x="8" y="13" width="24" height="5" rx="2.5" fill="#FDE68A" stroke="#D97706" strokeWidth="1.2"/>
        <circle cx="26" cy="10" r="4" fill="#22C55E" stroke="#15803D" strokeWidth="1"/>
        <circle cx="14" cy="8" r="3" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
        <path d="M12 20 Q16 18 20 20 Q24 22 28 20" stroke="#D97706" strokeWidth="1" fill="none"/>
        <path d="M11 26 Q15 24 20 26 Q25 28 29 26" stroke="#D97706" strokeWidth="0.8" fill="none"/>
        <circle cx="18" cy="30" r="1.5" fill="#FDE68A" opacity="0.7"/>
      </svg>
    )
  },
  {
    id: 'tea',
    label: 'Té / Infusiones',
    group: 'Cafetería',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 18 L32 18 L30 36 Q30 38 20 38 Q10 38 10 36 Z" fill="#10B981" stroke="#047857" strokeWidth="1.5"/>
        <rect x="8" y="15" width="24" height="5" rx="2.5" fill="#34D399" stroke="#047857" strokeWidth="1"/>
        <path d="M32 24 Q38 24 38 28 Q38 32 32 32" stroke="#047857" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M14 10 Q14 13 16 13 Q14 13 14 16" stroke="#9CA3AF" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M20 8 Q20 11 22 11 Q20 11 20 14" stroke="#9CA3AF" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <path d="M26 10 Q26 13 28 13 Q26 13 26 16" stroke="#9CA3AF" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        <circle cx="18" cy="28" r="2" fill="#34D399" opacity="0.6"/>
        <circle cx="24" cy="30" r="1.5" fill="#A7F3D0" opacity="0.8"/>
      </svg>
    )
  },
  {
    id: 'water',
    label: 'Agua / Aguas',
    group: 'Bebidas sin Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="10" width="16" height="28" rx="8" fill="#BAE6FD" stroke="#0284C7" strokeWidth="1.5"/>
        <rect x="12" y="6" width="16" height="6" rx="3" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1"/>
        <path d="M16 4 L24 4" stroke="#0284C7" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 18 Q20 14 26 18" fill="#7DD3FC" stroke="none"/>
        <path d="M14 26 Q20 22 26 26" fill="#7DD3FC" stroke="none" opacity="0.6"/>
        <circle cx="17" cy="32" r="1.5" fill="white" opacity="0.6"/>
        <circle cx="23" cy="30" r="1" fill="white" opacity="0.4"/>
      </svg>
    )
  },
  {
    id: 'milkshake',
    label: 'Milkshakes',
    group: 'Postres',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 16 L12 38 Q12 40 20 40 Q28 40 28 38 L30 16 Z" fill="#FDE8D8" stroke="#F97316" strokeWidth="1.5"/>
        <path d="M10 12 Q10 8 20 8 Q30 8 30 12 L10 12 Z" fill="white" stroke="#9CA3AF" strokeWidth="1.2"/>
        <path d="M10 12 Q10 16 10 16 L30 16 Q30 12 30 12" fill="#F9A8D4" stroke="#F97316" strokeWidth="1"/>
        <path d="M20 8 L20 2" stroke="#9CA3AF" strokeWidth="1.5"/>
        <ellipse cx="20" cy="2" rx="3" ry="1.2" fill="#9CA3AF"/>
        <circle cx="17" cy="8" r="2.5" fill="#F97316"/>
        <circle cx="23" cy="8" r="2.5" fill="#EF4444"/>
        <circle cx="20" cy="8" r="2" fill="#FBBF24"/>
        <path d="M14 22 Q17 20 20 22 Q23 24 26 22" stroke="#F97316" strokeWidth="1" fill="none"/>
        <circle cx="16" cy="30" r="1.5" fill="#F9A8D4" opacity="0.8"/>
        <circle cx="24" cy="28" r="1" fill="#F9A8D4" opacity="0.8"/>
      </svg>
    )
  },
  {
    id: 'champagne',
    label: 'Champagne / Espumante',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 4 L26 4 L24 18 Q24 26 20 28 Q16 26 16 18 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M16 18 Q18 22 24 18" fill="#FBBF24" opacity="0.5"/>
        <rect x="18" y="28" width="4" height="10" fill="#FDE68A" stroke="#D97706" strokeWidth="1"/>
        <rect x="12" y="38" width="16" height="3" rx="1.5" fill="#D97706"/>
        <circle cx="28" cy="12" r="1.5" fill="#FDE68A"/>
        <circle cx="30" cy="8" r="1" fill="#FBBF24"/>
        <circle cx="26" cy="6" r="1" fill="#FDE68A"/>
        <circle cx="32" cy="16" r="1" fill="#FBBF24"/>
        <path d="M14 4 L26 4" stroke="#D97706" strokeWidth="2"/>
      </svg>
    )
  },
  {
    id: 'spirits',
    label: 'Destilados / Whisky',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="18" width="16" height="20" rx="3" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
        <path d="M14 14 L12 18 L28 18 L26 14 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
        <rect x="15" y="10" width="10" height="6" rx="2" fill="#FDE68A" stroke="#D97706" strokeWidth="1"/>
        <rect x="18" y="6" width="4" height="6" rx="2" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1"/>
        <rect x="14" y="24" width="12" height="4" rx="1" fill="#FBBF24" opacity="0.5"/>
        <path d="M14 32 L26 32" stroke="#92400E" strokeWidth="0.8" strokeDasharray="2,2"/>
        <path d="M14 36 L26 36" stroke="#92400E" strokeWidth="0.8" strokeDasharray="2,2"/>
      </svg>
    )
  },

  // ── ESPECIALES ──
  {
    id: 'promo',
    label: 'Promociones',
    group: 'Especiales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,4 24,15 36,15 26,22 30,34 20,27 10,34 14,22 4,15 16,15" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
        <polygon points="20,9 23,17 31,17 25,22 27,30 20,25 13,30 15,22 9,17 17,17" fill="#FDE68A"/>
      </svg>
    )
  },
  {
    id: 'combo',
    label: 'Combos',
    group: 'Especiales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="22" r="9" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5"/>
        <circle cx="26" cy="22" r="9" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
        <path d="M20 14 Q22 18 22 22 Q22 26 20 30 Q18 26 18 22 Q18 18 20 14Z" fill="#8B5CF6"/>
        <text x="10" y="25" fontSize="7" fill="white" fontWeight="bold">+</text>
        <text x="23" y="25" fontSize="7" fill="white" fontWeight="bold">=</text>
      </svg>
    )
  },
  {
    id: 'especiales',
    label: 'Especiales del día',
    group: 'Especiales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="22" r="14" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="20" cy="22" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
        <path d="M20 8 Q22 6 24 8" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M20 8 L20 12" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M14 16 L16 18 M20 14 L20 16 M26 16 L24 18" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M20 22 L23 25 L26 19" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'glutenfree',
    label: 'Sin Gluten',
    group: 'Saludable',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#ECFDF5" stroke="#16A34A" strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="10" fill="none" stroke="#16A34A" strokeWidth="1"/>
        <path d="M14 14 L26 26" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M26 14 L14 26" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round"/>
        <text x="6" y="37" fontSize="6" fill="#16A34A" fontWeight="bold">GF</text>
      </svg>
    )
  },
  {
    id: 'spicy',
    label: 'Picante',
    group: 'Especiales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 36 Q14 28 16 18 Q18 8 22 6 Q26 4 28 8 Q24 8 22 12 Q26 10 28 16 Q30 22 28 30 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
        <path d="M22 6 Q24 4 26 6" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M18 22 Q20 20 22 22" stroke="#FDE68A" strokeWidth="1.5" fill="none"/>
        <path d="M19 28 Q20 26 21 28" stroke="#FDE68A" strokeWidth="1" fill="none"/>
        <path d="M32 10 Q34 8 36 10 Q34 12 32 10Z" fill="#F59E0B"/>
        <path d="M34 14 Q36 14 36 16" stroke="#F59E0B" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'ice_cream',
    label: 'Helados',
    group: 'Postres',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 24 L20 38 L26 24 Z" fill="#D97706" stroke="#92400E" strokeWidth="1.2"/>
        <circle cx="14" cy="20" r="8" fill="#F9A8D4" stroke="#EC4899" strokeWidth="1.2"/>
        <circle cx="26" cy="20" r="8" fill="#A5F3FC" stroke="#0891B2" strokeWidth="1.2"/>
        <circle cx="20" cy="16" r="8" fill="#FDE68A" stroke="#D97706" strokeWidth="1.2"/>
        <circle cx="12" cy="18" r="2" fill="#EC4899" opacity="0.4"/>
        <circle cx="28" cy="18" r="2" fill="#0891B2" opacity="0.4"/>
        <circle cx="20" cy="13" r="2" fill="#D97706" opacity="0.4"/>
      </svg>
    )
  },
  {
    id: 'cake',
    label: 'Tortas / Pasteles',
    group: 'Postres',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="24" width="28" height="14" rx="3" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <rect x="10" y="18" width="20" height="8" rx="2" fill="#FDE8D8" stroke="#F97316" strokeWidth="1.2"/>
        <path d="M6 26 Q20 22 34 26" stroke="#FBBF24" strokeWidth="1" fill="none"/>
        <path d="M6 30 Q20 26 34 30" stroke="#FBBF24" strokeWidth="0.8" fill="none"/>
        <rect x="14" y="10" width="4" height="10" fill="#9CA3AF" rx="2"/>
        <rect x="22" y="8" width="4" height="12" fill="#9CA3AF" rx="2"/>
        <ellipse cx="16" cy="9" rx="3" ry="2" fill="#EF4444"/>
        <ellipse cx="24" cy="7" rx="3" ry="2" fill="#FBBF24"/>
        <circle cx="16" cy="9" r="1" fill="#FDE68A"/>
        <circle cx="24" cy="7" r="1" fill="#F97316"/>
      </svg>
    )
  },
  {
    id: 'donut',
    label: 'Donuts / Factura',
    group: 'Cafetería',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="22" r="14" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
        <circle cx="20" cy="22" r="14" fill="#FBBF24"/>
        <path d="M8 18 Q14 10 26 14 Q32 18 30 26 Q28 32 20 34 Q10 34 8 26 Q7 22 8 18Z" fill="#F9A8D4"/>
        <path d="M16 14 Q18 12 22 14" stroke="#EC4899" strokeWidth="1" fill="none"/>
        <path d="M26 18 Q28 20 26 24" stroke="#EC4899" strokeWidth="1" fill="none"/>
        <circle cx="20" cy="22" r="5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="14" cy="16" r="1.5" fill="white"/>
        <circle cx="28" cy="20" r="1" fill="white"/>
        <circle cx="22" cy="30" r="1.5" fill="#FDE68A"/>
      </svg>
    )
  },

  // ── MÁS COMIDAS ──
  {
    id: 'bread',
    label: 'Panadería',
    group: 'Cafetería',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 20 Q6 12 20 10 Q34 12 34 20 L32 34 Q28 38 20 38 Q12 38 8 34 Z" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/>
        <path d="M8 22 Q14 16 20 18 Q26 16 32 22" stroke="#FBBF24" strokeWidth="2" fill="none"/>
        <path d="M8 28 Q14 24 20 26 Q26 24 32 28" stroke="#FBBF24" strokeWidth="1.5" fill="none"/>
        <ellipse cx="20" cy="14" rx="10" ry="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
      </svg>
    )
  },
  {
    id: 'rice',
    label: 'Arroz / Risotto',
    group: 'Principales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="28" rx="16" ry="8" fill="#F9FAFB" stroke="#9CA3AF" strokeWidth="1.5"/>
        <ellipse cx="20" cy="26" rx="14" ry="6" fill="#FFFBEB"/>
        <circle cx="14" cy="24" r="1.5" fill="white"/>
        <circle cx="18" cy="22" r="1.5" fill="white"/>
        <circle cx="22" cy="23" r="1.5" fill="white"/>
        <circle cx="26" cy="22" r="1.5" fill="white"/>
        <circle cx="16" cy="27" r="1.5" fill="white"/>
        <circle cx="24" cy="27" r="1.5" fill="white"/>
        <circle cx="20" cy="25" r="1" fill="#FDE68A"/>
        <ellipse cx="20" cy="28" rx="16" ry="8" fill="none" stroke="#9CA3AF" strokeWidth="1.5"/>
        <path d="M14 12 Q16 8 20 10 Q22 8 26 12" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M20 10 L20 18" stroke="#9CA3AF" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'noodles',
    label: 'Fideos / Ramen',
    group: 'Principales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 20 Q6 34 20 36 Q34 34 34 20 Z" fill="#FEF9C3" stroke="#D97706" strokeWidth="1.5"/>
        <rect x="6" y="17" width="28" height="5" rx="2.5" fill="#FBBF24" stroke="#D97706" strokeWidth="1.2"/>
        <path d="M10 22 Q14 18 18 22 Q22 26 26 22 Q28 20 30 22" stroke="#D97706" strokeWidth="1.5" fill="none"/>
        <path d="M8 26 Q12 22 16 26 Q20 30 24 26 Q28 24 30 26" stroke="#F59E0B" strokeWidth="1.5" fill="none"/>
        <circle cx="14" cy="30" r="1.5" fill="#EF4444"/>
        <circle cx="22" cy="32" r="1.5" fill="#10B981"/>
        <circle cx="28" cy="30" r="1.5" fill="#FBBF24"/>
        <rect x="20" y="8" width="3" height="12" rx="1.5" fill="#9CA3AF" transform="rotate(-20 20 8)"/>
        <rect x="22" y="8" width="3" height="12" rx="1.5" fill="#9CA3AF" transform="rotate(10 22 8)"/>
      </svg>
    )
  },
  {
    id: 'cheese',
    label: 'Quesos',
    group: 'Entradas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 28 L20 10 L36 28 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/>
        <rect x="4" y="28" width="32" height="8" rx="2" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="14" cy="26" r="2.5" fill="#FDE68A"/>
        <circle cx="22" cy="22" r="2" fill="#FDE68A"/>
        <circle cx="28" cy="27" r="2" fill="#FDE68A"/>
        <circle cx="18" cy="30" r="1.5" fill="#D97706" opacity="0.5"/>
        <circle cx="26" cy="31" r="1.5" fill="#D97706" opacity="0.5"/>
      </svg>
    )
  },
  {
    id: 'dips',
    label: 'Salsas / Aderezos',
    group: 'Entradas',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="28" rx="14" ry="8" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5"/>
        <ellipse cx="20" cy="26" rx="11" ry="5" fill="#FCA5A5"/>
        <path d="M24 10 Q26 4 28 6 Q28 12 24 16 Q20 12 24 10Z" fill="#16A34A" stroke="#15803D" strokeWidth="1"/>
        <path d="M24 16 L24 26" stroke="#15803D" strokeWidth="1.5" fill="none" strokeDasharray="3,2"/>
        <circle cx="14" cy="26" r="2" fill="#DC2626" opacity="0.5"/>
        <circle cx="26" cy="24" r="2" fill="#DC2626" opacity="0.5"/>
        <circle cx="20" cy="28" r="1.5" fill="#FBBF24"/>
      </svg>
    )
  },
  {
    id: 'vino_copa',
    label: 'Copa de Vino',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6 L28 6 L26 18 Q26 24 20 26 Q14 24 14 18 Z" fill="#C084FC" stroke="#7C3AED" strokeWidth="1.5"/>
        <path d="M14 18 Q18 22 26 18" fill="#A855F7" opacity="0.5"/>
        <rect x="18" y="26" width="4" height="10" fill="#C084FC" stroke="#7C3AED" strokeWidth="1"/>
        <rect x="12" y="36" width="16" height="3" rx="1.5" fill="#7C3AED"/>
        <path d="M14 12 Q16 10 18 12" stroke="#E879F9" strokeWidth="1" fill="none"/>
        <path d="M22 10 Q24 8 26 10" stroke="#E879F9" strokeWidth="1" fill="none"/>
        <circle cx="22" cy="16" r="1.5" fill="#F0ABFC" opacity="0.6"/>
      </svg>
    )
  },
  {
    id: 'fruta',
    label: 'Frutas',
    group: 'Saludable',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="24" r="8" fill="#EF4444" stroke="#DC2626" strokeWidth="1.2"/>
        <circle cx="26" cy="22" r="7" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2"/>
        <circle cx="22" cy="30" r="6" fill="#22C55E" stroke="#16A34A" strokeWidth="1.2"/>
        <path d="M16 16 Q18 12 20 14" stroke="#16A34A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M26 15 Q28 11 30 13" stroke="#16A34A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <circle cx="13" cy="22" r="1.5" fill="#FCA5A5" opacity="0.6"/>
      </svg>
    )
  },
  {
    id: 'energy',
    label: 'Energizantes',
    group: 'Bebidas sin Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="6" width="20" height="32" rx="6" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5"/>
        <rect x="14" y="6" width="12" height="4" rx="2" fill="#6EE7B7" stroke="#059669" strokeWidth="1"/>
        <path d="M22 14 L18 22 L22 22 L18 30" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="12" y="8" width="16" height="26" rx="5" fill="none" stroke="#A7F3D0" strokeWidth="0.5"/>
        <circle cx="22" cy="32" r="1.5" fill="#059669"/>
      </svg>
    )
  },
  {
    id: 'bar',
    label: 'Bar / Bebidas alcohólicas',
    group: 'Bebidas con Alcohol',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 10 L20 26 L32 10 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <path d="M8 10 L32 10" stroke="#D97706" strokeWidth="2"/>
        <rect x="18" y="26" width="4" height="8" fill="#FBBF24" stroke="#D97706" strokeWidth="1"/>
        <rect x="12" y="34" width="16" height="3" rx="1.5" fill="#D97706"/>
        <path d="M22 12 Q24 16 22 18 Q20 16 22 12Z" fill="white" opacity="0.3"/>
        <circle cx="30" cy="8" r="3" fill="#EF4444" stroke="#DC2626" strokeWidth="1"/>
        <path d="M30 5 L30 3" stroke="#DC2626" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    id: 'frozen',
    label: 'Congelados / Fríos',
    group: 'Postres',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 4 L20 36" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M4 20 L36 20" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M8.7 8.7 L31.3 31.3" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M31.3 8.7 L8.7 31.3" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5"/>
        <circle cx="20" cy="8" r="2" fill="#7DD3FC"/>
        <circle cx="20" cy="32" r="2" fill="#7DD3FC"/>
        <circle cx="8" cy="20" r="2" fill="#7DD3FC"/>
        <circle cx="32" cy="20" r="2" fill="#7DD3FC"/>
        <circle cx="11.5" cy="11.5" r="1.5" fill="#7DD3FC"/>
        <circle cx="28.5" cy="28.5" r="1.5" fill="#7DD3FC"/>
        <circle cx="28.5" cy="11.5" r="1.5" fill="#7DD3FC"/>
        <circle cx="11.5" cy="28.5" r="1.5" fill="#7DD3FC"/>
      </svg>
    )
  },
  {
    id: 'sin_tacc',
    label: 'Sin TACC',
    group: 'Saludable',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="16" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="1.5"/>
        <path d="M14 20 L18 24 L26 16" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="5" y="36" fontSize="6" fill="#CA8A04" fontWeight="900">SIN TACC</text>
      </svg>
    )
  },
  {
    id: 'plato_dia',
    label: 'Plato del Día',
    group: 'Especiales',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="26" rx="16" ry="8" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5"/>
        <ellipse cx="20" cy="24" rx="14" ry="6" fill="white" stroke="#94A3B8" strokeWidth="1"/>
        <path d="M6 24 L34 24" stroke="#94A3B8" strokeWidth="0.5"/>
        <circle cx="15" cy="22" r="4" fill="#10B981"/>
        <circle cx="23" cy="21" r="3.5" fill="#EF4444"/>
        <circle cx="20" cy="24" r="3" fill="#F59E0B"/>
        <path d="M20 12 Q22 8 24 10 Q22 10 22 14" stroke="#9CA3AF" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M16 10 Q16 14 16 18" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M18 10 Q18 14 18 18" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'brunch',
    label: 'Brunch',
    group: 'Cafetería',
    svg: (
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="20" cy="28" rx="16" ry="8" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/>
        <circle cx="14" cy="24" r="5" fill="#F9FAFB" stroke="#D97706" strokeWidth="1.2"/>
        <circle cx="14" cy="24" r="3" fill="#FBBF24"/>
        <rect x="20" y="20" width="12" height="4" rx="2" fill="#D97706" stroke="#92400E" strokeWidth="1"/>
        <rect x="22" y="16" width="8" height="4" rx="2" fill="#EF4444" stroke="#DC2626" strokeWidth="1"/>
        <path d="M10 18 Q12 14 14 18" stroke="#D97706" strokeWidth="1.5" fill="none"/>
        <circle cx="26" cy="18" r="2" fill="#FBBF24"/>
        <circle cx="30" cy="20" r="1.5" fill="#EF4444"/>
      </svg>
    )
  },
,
  { id: 'milanesa', label: 'Milanesa', group: 'Regionales / Clásicos', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="20" rx="14" ry="10" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/><circle cx="16" cy="18" r="1.5" fill="#B45309"/><circle cx="24" cy="22" r="1.5" fill="#B45309"/><circle cx="12" cy="22" r="1" fill="#B45309"/></svg> },
  { id: 'choripan', label: 'Choripán', group: 'Regionales / Clásicos', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20 Q20 10 32 20 Q20 30 8 20" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/><ellipse cx="20" cy="20" rx="12" ry="4" fill="#991B1B" stroke="#7F1D1D" strokeWidth="1"/></svg> },
  { id: 'locro', label: 'Locro', group: 'Regionales / Clásicos', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 24 C6 32, 14 36, 20 36 C26 36, 34 32, 34 24" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5"/><path d="M4 24 L36 24" stroke="#D97706" strokeWidth="2"/><circle cx="16" cy="22" r="2" fill="#EF4444"/><circle cx="24" cy="22" r="1.5" fill="#FDE68A"/></svg> },
  { id: 'pastel_papa', label: 'Pastel de Papa', group: 'Regionales / Clásicos', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="20" height="12" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/><path d="M10 20 L30 20" stroke="#92400E" strokeWidth="2" strokeDasharray="2 2"/></svg> },
  { id: 'alfajor', label: 'Alfajor', group: 'Cafetería', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="10" fill="#FCD34D" stroke="#D97706" strokeWidth="1.5"/><circle cx="20" cy="20" r="8" fill="#78350F"/></svg> },
  { id: 'medialuna', label: 'Medialuna', group: 'Cafetería', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20 C10 10, 30 10, 30 20 C30 22, 28 24, 26 24 C24 24, 22 20, 20 20 C18 20, 16 24, 14 24 C12 24, 10 22, 10 20" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/></svg> },
  { id: 'mate', label: 'Mate', group: 'Cafetería', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 14 C14 32, 26 32, 26 14 Z" fill="#22C55E" stroke="#166534" strokeWidth="1.5"/><line x1="28" y1="6" x2="24" y2="14" stroke="#9CA3AF" strokeWidth="2"/></svg> },
  { id: 'fernet', label: 'Fernet', group: 'Bebidas con Alcohol', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="10" width="12" height="20" fill="#000000" stroke="#374151" strokeWidth="1.5"/><rect x="14" y="10" width="12" height="6" fill="#F3F4F6"/></svg> },
  { id: 'lomito', label: 'Lomito', group: 'Comidas Rápidas', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="20" cy="14" rx="14" ry="6" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/><rect x="6" y="18" width="28" height="4" fill="#991B1B"/><rect x="6" y="22" width="28" height="2" fill="#10B981"/><ellipse cx="20" cy="26" rx="14" ry="6" fill="#D97706" stroke="#92400E" strokeWidth="1.5"/></svg> },
  { id: 'churros', label: 'Churros', group: 'Postres', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 10 L16 30 M20 10 L24 30 M28 10 L32 30" stroke="#FDE68A" strokeWidth="4" strokeLinecap="round"/><path d="M12 10 L16 30 M20 10 L24 30 M28 10 L32 30" stroke="#D97706" strokeWidth="1" strokeDasharray="2 4"/></svg> },
  { id: 'parrilla', label: 'Parrillada', group: 'Carnes', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 20 L32 20 M12 20 L12 28 M20 20 L20 28 M28 20 L28 28" stroke="#374151" strokeWidth="2"/><ellipse cx="20" cy="16" rx="10" ry="4" fill="#991B1B"/><ellipse cx="14" cy="14" rx="4" ry="2" fill="#D97706"/></svg> },
  { id: 'tarta', label: 'Tarta', group: 'Principales', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10 L36 28 L4 28 Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/><path d="M16 18 L24 18" stroke="#10B981" strokeWidth="2"/></svg> },
  { id: 'picada', label: 'Picada', group: 'Entradas', svg: <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="14" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5"/><circle cx="14" cy="16" r="3" fill="#EF4444"/><circle cx="24" cy="14" r="3" fill="#FBBF24"/><circle cx="18" cy="26" r="3" fill="#991B1B"/><circle cx="26" cy="22" r="3" fill="#10B981"/></svg> }

];

// Ícono por defecto cuando no hay ninguno asignado
export function DefaultCategoryIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="16" fill="var(--surface-2, #f1f5f9)" stroke="var(--border, #e2e8f0)" strokeWidth="1.5"/>
      <path d="M12 20 Q12 14 20 12 Q28 14 28 20 L26 28 Q24 32 20 32 Q16 32 14 28 Z" fill="var(--text-muted, #94a3b8)" opacity="0.5"/>
      <path d="M20 12 Q22 10 24 12" stroke="var(--text-muted, #94a3b8)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function CategoryIconDisplay({ iconId, size = 32 }) {
  const icon = CATEGORY_ICONS.find(i => i.id === iconId);
  if (!icon) return <DefaultCategoryIcon size={size} />;
  return (
    <span style={{ display: 'inline-flex', width: size, height: size }}>
      {icon.svg}
    </span>
  );
}
