import { useEffect, useRef, useState } from 'react';
import { AccountSaveQueue, type SaveNotice } from './accountSave';
import type { GameState } from './engine';
import type { SaveSettings } from './storage';
const OFFLINE_MESSAGES: Record<SaveNotice['status'], string> = { saved: '本机已自动保存（离线单人模式）', pending: '进度已保留在本机（离线单人模式）', saving: '正在保存到本机…', error: '本机保存失败，请导出存档备份。', conflict: '本机存档版本冲突' };
export function useAccountSave(userId: string, state: GameState, settings: SaveSettings, revision: number, dirty: boolean) {
 const offline = userId === 'guest-local';
 const [notice, setNotice] = useState<SaveNotice>({ status: dirty ? 'pending' : 'saved', message: dirty ? '恢复了尚未同步的本机进度' : '账号进度已载入' });
 const queue = useRef<AccountSaveQueue | null>(null);
 if (!queue.current) queue.current = new AccountSaveQueue(userId, state, settings, revision, dirty, value => queueMicrotask(() => setNotice(offline ? { ...value, message: OFFLINE_MESSAGES[value.status] } : value)), offline ? async value => ({ userId: value.userId, revision: value.revision + 1 }) : undefined);
 useEffect(() => { queue.current!.update(state, settings); }, [state, settings.sound, settings.wallpaper, settings.language]);
 useEffect(() => {
  queue.current!.activate();
  const timer = setInterval(() => { void queue.current!.flush().catch(() => {}); }, 5000);
  const save = () => { void queue.current!.flush(true).catch(() => {}); };
  const visibility = () => { if (document.hidden) save(); };
  window.addEventListener('pagehide', save); window.addEventListener('online', save); document.addEventListener('visibilitychange', visibility);
  if (dirty) void queue.current!.flush().catch(() => {});
  return () => { clearInterval(timer); window.removeEventListener('pagehide', save); window.removeEventListener('online', save); document.removeEventListener('visibilitychange', visibility); queue.current!.dispose(); };
 }, []);
 return { notice, flush: () => queue.current!.flush(), replace: (state: GameState, settings: SaveSettings, revision: number) => queue.current!.replace(state, settings, revision) };
}
