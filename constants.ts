import { LeadStatus } from './types';

export const BOT_KANBAN_COLUMNS = [
  { id: LeadStatus.NUEVO, title: 'NUEVO', description: 'Entró el lead; falta pedir datos mínimos.' },
  { id: LeadStatus.CALIFICADO, title: 'CALIFICADO', description: 'Ya tenemos fecha, pax y región/origen-destino.' },
  { id: LeadStatus.PRE_COTIZADO, title: 'PRE-COTIZADO', description: 'El bot envió un estimado o un transfer.' },
  { id: LeadStatus.INTERESADO, title: 'INTERESADO → PASAR A HUMANO', description: 'Cliente mostró intención real; requiere representante.' },
  { id: LeadStatus.FRIO, title: 'FRÍO / SIN RESPUESTA', description: 'No respondió; se puede insistir una vez.' },
  { id: LeadStatus.CANCELADO, title: 'CANCELADO', description: 'Dijo que no / no sigue.' },
];

export const HUMAN_KANBAN_COLUMNS = [
  { id: LeadStatus.EN_GESTION, title: 'EN GESTIÓN', description: 'Representante tomó el caso y continúa la conversación.' },
  { id: LeadStatus.COORDINANDO, title: 'COORDINANDO', description: 'Se ajustan detalles (horarios, paradas, itinerario).' },
  { id: LeadStatus.PROGRAMADO, title: 'PROGRAMADO', description: 'Quedó confirmado fecha/hora y logística.' },
  { id: LeadStatus.REALIZADO, title: 'REALIZADO', description: 'Servicio completado.' },
  { id: LeadStatus.CANCELADO, title: 'CANCELADO', description: 'Se cayó antes de realizarse.' },
];

export const REGION_OPTIONS = [
  'Ciudad',
  'Primera Zona (Luján + Maipú)',
  'Valle de Uco',
  'Alta Montaña',
  'Valle Sur',
  'Valle Este'
];

