'use client';

import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { Badge, Button, Card, Spinner } from '../ui';

const GROUP_ICONS = {
  dashboard: 'bx-tachometer',
  wallet: 'bx-wallet',
  invoice: 'bx-receipt',
  notifications: 'bx-bell',
  transactions: 'bx-transfer-alt',
  merchant: 'bx-store',
  admin: 'bx-cog'
};

function getGroupIcon(groupKey) {
  const base = groupKey.split('.')[0];
  return GROUP_ICONS[base] || 'bx-lock-alt';
}

function formatGroupLabel(groupKey) {
  return groupKey.replace(/\./g, ' / ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function sourceBadge(source) {
  if (source === 'granted') return { color: 'success', label: 'granted' };
  if (source === 'denied') return { color: 'danger', label: 'denied' };
  return { color: 'secondary', label: 'default' };
}

function getPermAction(permName) {
  const parts = permName.split('.');
  return parts[parts.length - 1] || '';
}

export default function PermissionGroupCard({ group, perms, color = 'primary', isCollapsed, overrideMap, actionLoading, onToggle, onDeny, onGrant, onRevert }) {
  const { t } = useAdminTranslation();
  const activeInGroup = perms.filter((p) => p.active).length;
  const groupIcon = getGroupIcon(group);

  return (
    <Card className="mb-3">
      <div
        className="px-5 py-3 border-b border-surface-200 cursor-pointer"

        onClick={() => onToggle(group)}>
        
        <div className="flex items-center justify-between">
          <h6 className="mb-0 flex items-center gap-2">
            <i className={`bx ${isCollapsed ? 'bx-chevron-right' : 'bx-chevron-down'} text-surface-500`}></i>
            <i className={`bx ${groupIcon} text-${color}`}></i>
            {formatGroupLabel(group)}
          </h6>
          <div className="flex items-center gap-2">
            <small className="text-surface-500">{activeInGroup}/{perms.length} {t('admin.roles.active', { defaultValue: 'active' }).toLowerCase()}</small>
            <Badge color={color} label className="rounded-full text-[0.7rem]">{perms.length}</Badge>
          </div>
        </div>
      </div>
      {!isCollapsed &&
      <div className="px-3">
          <ul className="divide-y divide-surface-200">
            {perms.map((p) => {
            const override = overrideMap[p.permission];
            const isOverridden = !!override;
            const isLoading = actionLoading === p.permission;
            const badge = sourceBadge(p.source);
            const action = getPermAction(p.permission);

            return (
              <li key={p.permission} className="flex items-center gap-3 py-2 px-3">
                  {/* Status icon */}
                  <div className="w-[24px] text-center shrink-0">
                    {p.active ?
                  <i className="bx bx-check-circle text-success text-[1.1rem]"></i> :

                  <i className="bx bx-x-circle text-danger text-[1.1rem]"></i>
                  }
                  </div>

                  {/* Permission info */}
                  <div className="grow overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-[0.8rem]">{p.permission}</code>
                      <Badge color={badge.color} label className="text-[0.6rem]">{badge.label}</Badge>
                      {isOverridden &&
                    <Badge color="warning" label className="text-[0.6rem]">
                          <i className="bx bx-edit-alt text-[0.55rem]"></i> {t('admin.roles.override', { defaultValue: 'override' })}
                        </Badge>
                    }
                    </div>
                    {isOverridden && override.reason &&
                  <small className="text-surface-500 block mt-1 text-xs">
                        <i className="bx bx-message-detail mr-1"></i>{override.reason}
                      </small>
                  }
                  </div>

                  {/* Actions */}
                  <div className="whitespace-nowrap shrink-0">
                    {isLoading ?
                  <Spinner className="w-4 h-4 text-primary" /> :

                  <div className="flex gap-1">
                        {isOverridden &&
                    <Button


                      onClick={(e) => {e.stopPropagation();onRevert(override.id, p.permission);}}
                      title={t('admin.roles.revertToDefault', { defaultValue: 'Revert to default' })} size="sm" className="border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white py-[0.15rem] px-[0.5rem] text-[0.7rem]">
                      
                            <i className="bx bx-undo mr-1"></i>{t('admin.roles.revert', { defaultValue: 'Revert' })}
                          </Button>
                    }
                        {p.active ?
                    <Button


                      onClick={(e) => {e.stopPropagation();onDeny(p.permission);}}
                      title={t('admin.roles.denyPermission', { defaultValue: 'Deny this permission' })} size="sm" className="border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white py-[0.15rem] px-[0.5rem] text-[0.7rem]">
                      
                            <i className="bx bx-x mr-1"></i>{t('admin.roles.deny', { defaultValue: 'Deny' })}
                          </Button> :

                    <Button


                      onClick={(e) => {e.stopPropagation();onGrant(p.permission);}}
                      title={t('admin.roles.grantPermission', { defaultValue: 'Grant this permission' })} size="sm" className="border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white py-[0.15rem] px-[0.5rem] text-[0.7rem]">
                      
                            <i className="bx bx-check mr-1"></i>{t('admin.roles.grant', { defaultValue: 'Grant' })}
                          </Button>
                    }
                      </div>
                  }
                  </div>
                </li>);

          })}
          </ul>
        </div>
      }
    </Card>);

}

export function groupPermissions(permissions) {
  const groups = {};
  permissions.forEach((p) => {
    const name = p.permission || '';
    if (!name) return;
    const parts = name.split('.');
    const groupKey = parts.length >= 3 ? parts.slice(0, 2).join('.') : parts[0];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(p);
  });
  return groups;
}