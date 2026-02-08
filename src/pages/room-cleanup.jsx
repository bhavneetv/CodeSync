import { useCallback, useEffect, useState } from 'react';
import { showToast } from '../Components/toast-notification.jsx';
import { cleanupStaleRooms } from '../function/rooms/room-functions.js';

const numberOrZero = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export default function RoomCleanupPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [lastRunAt, setLastRunAt] = useState(null);

  const runCleanup = useCallback(async () => {
    if (running) return;
    setRunning(true);

    try {
      const response = await cleanupStaleRooms();
      setResult(response);
      setLastRunAt(new Date());

      if (!response.success) {
        showToast(`Cleanup failed: ${response.error}`, 'error', 3000);
        return;
      }

      const summary = response.summary || {};
      const deactivated = numberOrZero(summary.deactivatedInactive) + numberOrZero(summary.deactivatedTemporary);
      showToast(
        `Cleanup done. Deactivated ${deactivated} room(s).`,
        'success',
        3000
      );
    } catch (err) {
      showToast(`Cleanup failed: ${err.message}`, 'error', 3000);
    } finally {
      setRunning(false);
    }
  }, [running]);

  useEffect(() => {
    runCleanup();
  }, [runCleanup]);

  const summary = result?.summary || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Room Cleanup</h1>
          <p className="text-sm text-slate-400 mt-2">
            Auto-runs on page load. Cleans temporary rooms after 48h and inactive rooms after 14 days.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="text-sm">
            Status: {running ? 'Running...' : 'Idle'}
          </div>
          {lastRunAt && (
            <div className="text-xs text-slate-400">
              Last run: {lastRunAt.toLocaleString()}
            </div>
          )}
          <button
            onClick={runCleanup}
            disabled={running}
            className={`px-4 py-2 rounded-lg text-sm ${running ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
          >
            {running ? 'Running...' : 'Run Cleanup Again'}
          </button>
        </div>

        {result && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2 text-sm">
            <div>Success: {String(!!result.success)}</div>
            <div>Scanned: {numberOrZero(summary.scanned)}</div>
            <div>Deactivated (Inactive): {numberOrZero(summary.deactivatedInactive)}</div>
            <div>Deactivated (Temporary): {numberOrZero(summary.deactivatedTemporary)}</div>
            <div>Failures: {Array.isArray(summary.failures) ? summary.failures.length : 0}</div>

            {Array.isArray(summary.failures) && summary.failures.length > 0 && (
              <pre className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-auto">
                {JSON.stringify(summary.failures, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
