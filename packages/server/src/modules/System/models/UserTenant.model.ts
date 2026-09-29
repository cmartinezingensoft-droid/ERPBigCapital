import { Model } from 'objection';
import { BaseModel } from '@/models/Model';
import { TenantModel } from './TenantModel';

export type UserTenantRole = 'owner' | 'member';

export class UserTenant extends BaseModel {
  public userId: number;
  public tenantId: number;
  public role: UserTenantRole;
  public tenant: TenantModel;

  static get tableName() {
    return 'userTenants';
  }

  static get relationMappings() {
    const { SystemUser } = require('./SystemUser');
    const { TenantModel } = require('./TenantModel');

    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: SystemUser,
        join: { from: 'userTenants.userId', to: 'USERS.id' },
      },
      tenant: {
        relation: Model.BelongsToOneRelation,
        modelClass: TenantModel,
        join: { from: 'userTenants.tenantId', to: 'TENANTS.id' },
      },
    };
  }
}
