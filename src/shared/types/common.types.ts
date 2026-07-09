export type TenantId = string;
export type UserId = string;

export interface BaseEntity {
  id: string;
  tenantId: TenantId;
  createdAt: Date;
  updatedAt: Date;
}
