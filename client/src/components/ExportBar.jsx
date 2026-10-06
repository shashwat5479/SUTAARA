import { useState } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

// "Download Excel" control for an admin list. The file is built by the server
// (so it always contains ALL matching records, not just what is on screen) and
// can be narrowed by a date range and, optionally, a status.
//   path       API path of the export endpoint, e.g. '/orders/export'
//   filePrefix download name, e.g. 'sutaara-orders' → sutaara-orders-2026-10-06.xlsx
//   dateLabel  what the date range applies to ("Order date"). Omit for no date filter.
//   statuses   optional list of status values to offer as a filter
export default function ExportBar({ label, path, filePrefix, dateLabel, statuses }) {
  const toast = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (from && to && from > to) {
      toast('“From” date must be on or before “To” date');
      return;
    }
    setBusy(true);
    try {
      const q = new URLSearchParams();
      if (from) q.set('from', from);
      if (to) q.set('to', to);
      if (status !== 'all') q.set('status', status);
      const qs = q.toString();
      await api.downloadDocument(
        `${path}${qs ? `?${qs}` : ''}`,
        `${filePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast('Excel file downloaded');
    } catch (err) {
      toast(err.message || 'Could not create the Excel file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="export-bar">
      {dateLabel && (
        <>
          <label>
            <span>{dateLabel} from</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            <span>to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </>
      )}
      {statuses && (
        <label>
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{String(s).replace(/_/g, ' ')}</option>
            ))}
          </select>
        </label>
      )}
      <button type="button" className="btn btn--gold export-bar__btn" onClick={download} disabled={busy}>
        ⬇ {busy ? 'Preparing…' : label || 'Download Excel'}
      </button>
    </div>
  );
}
