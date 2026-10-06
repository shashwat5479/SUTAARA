import { useEffect, useId, useRef, useState } from 'react';
import { STATES, citiesFor } from '../utils/india.js';
import { getCurrentAddress, lookupPincode } from '../utils/location.js';

const LABELS = ['Home', 'Work', 'Other'];

const PinIcon = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <circle cx="12" cy="12" r="8" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
);

// The address inputs, shared by checkout and the Account > Addresses page.
// Controlled: the parent owns `form` ({ label, fullName, phone, pincode, line1,
// line2, city, state }) and passes `setForm`. Renders inputs only (no <form>),
// so it can sit inside the checkout form.
//
//  - "Use my current location" fills the address from the device's GPS.
//  - Typing a 6-digit PIN fills the city and state automatically.
//  - State and city have type-ahead suggestions.
//  - `autoLocate`: bump this number to trigger the location lookup from outside.
export default function AddressFields({ form, setForm, autoLocate = 0 }) {
  const listId = useId();
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [pinStatus, setPinStatus] = useState('');

  // Only look a PIN up when the person changes it — not for a saved address
  // that is merely being opened for editing.
  const lastPin = useRef(form.pincode);
  const reqId = useRef(0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const pin = form.pincode;
    if (pin.length !== 6) {
      setPinStatus('');
      return;
    }
    if (pin === lastPin.current) return;
    lastPin.current = pin;
    const mine = ++reqId.current;
    setPinStatus('looking');
    lookupPincode(pin).then((r) => {
      if (mine !== reqId.current) return;
      if (r) {
        setForm((f) => ({ ...f, city: r.city || f.city, state: r.state || f.state }));
        setPinStatus('ok');
      } else {
        setPinStatus('unknown');
      }
    });
  }, [form.pincode, setForm]);

  const locate = async () => {
    setLocating(true);
    setLocError('');
    try {
      const found = await getCurrentAddress();
      lastPin.current = found.pincode; // don't let the PIN lookup overwrite what we just found
      let { city, state } = found;
      if ((!city || !state) && found.pincode) {
        const byPin = await lookupPincode(found.pincode);
        city = city || byPin?.city || '';
        state = state || byPin?.state || '';
      }
      setForm((f) => ({
        ...f,
        line1: found.line1 || f.line1,
        line2: found.line2 || f.line2,
        city: city || f.city,
        state: state || f.state,
        pincode: found.pincode || f.pincode,
      }));
      setPinStatus('');
    } catch (err) {
      setLocError(err.message);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    if (autoLocate) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLocate]);

  return (
    <div className="addr-fields">
      <button type="button" className="addr-locate" onClick={locate} disabled={locating}>
        <PinIcon />
        {locating ? 'Finding your location…' : 'Use my current location'}
      </button>
      {locError && <div className="form-error">{locError}</div>}
      {!locError && !locating && (
        <p className="addr-hint">We’ll fill in what we can — please check the house / flat number.</p>
      )}

      <div className="field__row">
        <div className="field">
          <label>Full name</label>
          <input value={form.fullName} onChange={set('fullName')} required autoComplete="name" />
        </div>
        <div className="field">
          <label>Mobile number</label>
          <input value={form.phone} onChange={set('phone')} required inputMode="tel" autoComplete="tel" />
        </div>
      </div>

      <div className="field">
        <label>
          PIN code
          {pinStatus === 'looking' && <span className="addr-pin"> · checking…</span>}
          {pinStatus === 'ok' && <span className="addr-pin addr-pin--ok"> · city &amp; state filled in</span>}
          {pinStatus === 'unknown' && <span className="addr-pin"> · couldn’t find this PIN — enter city &amp; state</span>}
        </label>
        <input
          value={form.pincode}
          onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          title="6-digit PIN code"
          autoComplete="postal-code"
        />
      </div>

      <div className="field">
        <label>Address (house no., building, street)</label>
        <input value={form.line1} onChange={set('line1')} required autoComplete="address-line1" />
      </div>
      <div className="field">
        <label>Locality / area (optional)</label>
        <input value={form.line2} onChange={set('line2')} autoComplete="address-line2" />
      </div>

      <div className="field__row">
        <div className="field">
          <label>City</label>
          <input value={form.city} onChange={set('city')} required list={`${listId}-cities`} autoComplete="address-level2" />
          <datalist id={`${listId}-cities`}>
            {citiesFor(form.state).map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>State</label>
          <input value={form.state} onChange={set('state')} required list={`${listId}-states`} autoComplete="address-level1" />
          <datalist id={`${listId}-states`}>
            {STATES.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="field">
        <label>Save as</label>
        <div className="addr-labels">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              className={form.label === l ? 'active' : ''}
              onClick={() => setForm((f) => ({ ...f, label: l }))}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
