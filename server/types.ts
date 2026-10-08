export type BrandId = 'amargos' | 'enyerbados';

export interface AdminToken {
  id: number;
  name: string;
  email: string;
  role: 'superadmin' | 'manager' | 'operator';
  brandScope: BrandId | null;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AdminToken;
    user: AdminToken;
  }
}
