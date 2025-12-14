import type { UserRole } from '../api/types';

export type Permissions = {
  canEditNomenclature: boolean;
  canCreateProductionDocuments: boolean;
  canCancelDocuments: boolean;
  canAdjustStock: boolean;
  canExportReports: boolean;
};

export function getPermissions(role: UserRole | null | undefined): Permissions {
  const isManager = role === 'manager';

  return {
    canEditNomenclature: isManager,
    canCreateProductionDocuments: isManager,
    canCancelDocuments: isManager,
    canAdjustStock: isManager,
    canExportReports: isManager,
  };
}
