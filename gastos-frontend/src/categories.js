export const CATEGORIES = [
  { id: 'credit_card', icon: '💳', label: 'Tarjetas de crédito', color: '#6c63ff' },
  { id: 'health',      icon: '🏥', label: 'Obra social / Salud', color: '#e74c3c' },
  { id: 'tax',         icon: '🧾', label: 'AFIP / Monotributo',  color: '#e67e22' },
  { id: 'transport',   icon: '🚌', label: 'Transporte',           color: '#3498db' },
  { id: 'food_out',    icon: '☕', label: 'Cafeterías y salidas', color: '#f39c12' },
  { id: 'social',      icon: '🎉', label: 'Salidas sociales',     color: '#9b59b6' },
  { id: 'market',      icon: '🛒', label: 'Kiosco / Supermercado',color: '#27ae60' },
  { id: 'services',    icon: '📡', label: 'Servicios',            color: '#1abc9c' },
  { id: 'other',       icon: '📦', label: 'Otros gastos',         color: '#95a5a6' },
];

export const INCOME_TYPES = [
  { id: 'salary',       icon: '💼', label: 'Sueldo del mes' },
  { id: 'extra',        icon: '💰', label: 'Ingreso extra / Trabajo adicional' },
  { id: 'debt_received',icon: '🤝', label: 'Plata que me debían' },
];

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id);
export const getIncomeTypeById = (id) => INCOME_TYPES.find(t => t.id === id);