import type { FastifyReply, FastifyRequest } from 'fastify';

export type AdminPermission =
  | 'dashboard.view'
  | 'orders.view'
  | 'orders.update_status'
  | 'orders.cancel'
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.price'
  | 'products.archive'
  | 'inventory.view'
  | 'inventory.adjust'
  | 'customers.view'
  | 'media.manage'
  | 'content.manage'
  | 'materos.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'admins.manage';

const ALL_PERMISSIONS: AdminPermission[] = [
  'dashboard.view','orders.view','orders.update_status','orders.cancel','products.view','products.create','products.edit','products.price','products.archive',
  'inventory.view','inventory.adjust','customers.view','media.manage','content.manage','materos.manage','settings.manage','audit.view','admins.manage',
];

const ROLE_PERMISSIONS: Record<'superadmin'|'manager'|'operator', Set<AdminPermission>> = {
  superadmin: new Set(ALL_PERMISSIONS),
  manager: new Set([
    'dashboard.view','orders.view','orders.update_status','orders.cancel','products.view','products.create','products.edit','products.price','products.archive',
    'inventory.view','inventory.adjust','customers.view','media.manage','content.manage','materos.manage','settings.manage','audit.view',
  ]),
  operator: new Set(['dashboard.view','orders.view','orders.update_status','inventory.view','inventory.adjust','customers.view','products.view']),
};

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ code: 'SESSION_EXPIRED', error: 'Tu sesión venció. Volvé a ingresar.' });
  }
}

export function permissionsForRole(role: string): AdminPermission[] {
  const set = ROLE_PERMISSIONS[(role in ROLE_PERMISSIONS ? role : 'operator') as keyof typeof ROLE_PERMISSIONS] || ROLE_PERMISSIONS.operator;
  return [...set];
}

export function hasPermission(request: FastifyRequest, permission: AdminPermission) {
  return ROLE_PERMISSIONS[request.user?.role || 'operator']?.has(permission) ?? false;
}

export function requirePermission(permission: AdminPermission) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAdmin(request, reply);
    if (reply.sent) return;
    if (!hasPermission(request, permission)) {
      return reply.code(403).send({ code: 'FORBIDDEN', error: 'No tenés permiso para realizar esta acción.' });
    }
  };
}

export function canAccessBrand(request: FastifyRequest, brandId?: string | null) {
  if (!brandId) return true;
  const scope = request.user?.brandScope;
  return !scope || scope === brandId;
}

export function effectiveBrand(request: FastifyRequest, requested?: string | null) {
  if (requested && !canAccessBrand(request, requested)) return '__forbidden__';
  return requested || request.user?.brandScope || null;
}
