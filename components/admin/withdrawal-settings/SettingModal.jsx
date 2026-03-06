'use client';

import { useEffect, useRef } from 'react';
import { Button, Spinner } from '@/components/ui';

export default function SettingModal({ title, onClose, onSave, saving, children, t }) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !saving) onCloseRef.current(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [saving]);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40"></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center" tabIndex="-1" onClick={() => !saving && onClose()}>
        <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-card rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-300">
              <h5 className="text-lg font-semibold text-surface-800">{title}</h5>
              <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose} disabled={saving}><i className="bx bx-x"></i></button>
            </div>
            <div className="p-5">{children}</div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200 dark:border-surface-300">
              <Button type="button" onClick={onClose} disabled={saving} variant="outline-secondary">
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ?
                  <><Spinner className="w-4 h-4 mr-2" />{t('actions.saving', { defaultValue: 'Saving...' })}</> :
                  <><i className="bx bx-save mr-1"></i>{t('actions.save', { defaultValue: 'Save' })}</>
                }
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
