// Address helpers: "use my current location" and PIN-code lookup.
//
// Both use free public services that need no API key and allow browser calls:
//   - OpenStreetMap Nominatim  → reverse-geocodes the device's GPS position
//   - api.postalpincode.in     → India Post data: PIN → district + state
import { STATES } from './india.js';

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STATE_ALIASES = {
  'nct of delhi': 'Delhi',
  'national capital territory of delhi': 'Delhi',
  'orissa': 'Odisha',
  'pondicherry': 'Puducherry',
  'jammu and kashmir': 'Jammu and Kashmir',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
};

// Maps whatever a service returned to the exact name in our list, so the
// state field matches the suggestion list ("NCT of Delhi" → "Delhi").
export function matchState(name) {
  const n = norm(name);
  if (!n) return '';
  if (STATE_ALIASES[n]) return STATE_ALIASES[n];
  return STATES.find((s) => norm(s) === n) || String(name).trim();
}

// 6-digit PIN → { city, state } (city = the post office's district), or null.
export async function lookupPincode(pin) {
  if (!/^\d{6}$/.test(pin)) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    const office = data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : null;
    if (!office) return null;
    return { city: office.District || office.Block || '', state: matchState(office.State) };
  } catch {
    return null;
  }
}

// Asks the browser for the device position, then turns it into address fields.
// Rejects with a human-readable message that can be shown straight to the user.
export function getCurrentAddress() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Your browser does not support location access. Please enter the address manually.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url =
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18` +
            `&accept-language=en&lat=${coords.latitude}&lon=${coords.longitude}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('lookup failed');
          const { address: a = {} } = await res.json();

          const street = [a.house_number, a.road].filter(Boolean).join(' ');
          const area = [a.neighbourhood, a.suburb, a.city_district, a.village].filter(Boolean);
          const line1 = street || area[0] || '';
          const line2 = (street ? area : area.slice(1)).filter((x, i, arr) => arr.indexOf(x) === i).join(', ');
          resolve({
            line1,
            line2,
            city: a.city || a.town || a.municipality || a.county || a.state_district || '',
            state: matchState(a.state),
            pincode: String(a.postcode || '').replace(/\s/g, ''),
          });
        } catch {
          reject(new Error('We found you, but could not work out the address. Please enter it manually.'));
        }
      },
      (err) => {
        reject(
          new Error(
            err.code === 1
              ? 'Location permission was denied. Allow location access in your browser, or enter the address manually.'
              : 'We could not get your location. Please enter the address manually.'
          )
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}
