import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { $saveStatus } from '../../game/projectStore.mjs';

export default function StatusBar({ codeError, saveStatusOverride }) {
  const saveStatus = saveStatusOverride ?? useStore($saveStatus);
  const codeMessage = useMemo(() => {
    if (!codeError) return '';
    return codeError.message || String(codeError);
  }, [codeError]);
  const saveMessage = useMemo(() => {
    if (saveStatus?.status !== 'error') return '';
    const err = saveStatus?.error;
    return err?.message || String(err || 'Save error');
  }, [saveStatus]);

  const hasIssues = Boolean(codeMessage) || Boolean(saveMessage);
  const messageKey = `${codeMessage}::${saveMessage}`;
  const [dismissedKey, setDismissedKey] = useState('');

  useEffect(() => {
    if (!hasIssues) {
      setDismissedKey('');
      return;
    }
    if (dismissedKey && dismissedKey !== messageKey) {
      setDismissedKey('');
    }
  }, [dismissedKey, hasIssues, messageKey]);

  if (!hasIssues || dismissedKey === messageKey) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 pb-3">
      <div className="w-full max-w-4xl rounded-xl border border-red-400/40 bg-background/95 px-4 py-3 text-xs text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            {codeMessage && (
              <div>
                <span className="mr-2 rounded-full border border-red-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-red-300">
                  code
                </span>
                <span className="text-foreground/90">{codeMessage}</span>
              </div>
            )}
            {saveMessage && (
              <div>
                <span className="mr-2 rounded-full border border-red-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-red-300">
                  save
                </span>
                <span className="text-foreground/90">{saveMessage}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDismissedKey(messageKey)}
            className="h-7 w-7 rounded-full border border-foreground/20 text-sm uppercase tracking-wide hover:opacity-70"
            aria-label="Dismiss status"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
