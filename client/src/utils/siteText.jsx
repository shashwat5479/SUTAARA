import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

// Editable storefront copy. Admins override any of these from
// Admin → Site Text; anything not overridden keeps the wording below.
//
// Text format (same look as before, now typeable in the admin):
//   *word*   → italic (gold on the dark pages)
//   Enter    → line break
export const SITE_TEXT_DEFAULTS = {
  home_story: {
    chapter: 'Chapter III — Sutaara Edits',
    eyebrow: 'The story of a saree',
    title: 'Barish & *Dhoop*',
    body:
      'Our signature red mul cotton was born of two seasons at once — light as monsoon ' +
      'air, warm as afternoon sun. Woven to move with you, and to last long enough to be ' +
      'handed down.',
    button: 'Explore Sutaara Edits',
    link: '/story',
  },
  edits_hero: {
    kicker: 'Sutaara Edits',
    title: 'Woven by hand,\n*worn with meaning*',
    body:
      'Every Sutaara piece begins as a story, not a stock number. Scroll on to ' +
      'follow the thread — from the loom in Lucknow to the drape that becomes yours.',
    button: 'Begin the story',
  },
  story_intro: {
    kicker: 'Discover',
    title: 'Our Story',
    body:
      'Sutaara began in a small Lucknow studio with a single belief — that a ' +
      'saree should carry the mark of the hand that made it. Every piece is ' +
      'painted, woven or embroidered in small batches by artisans we know by ' +
      'name, so what you drape is never mass-produced, and never quite like ' +
      'anyone else\u2019s.',
    linkLabel: 'More about us',
    link: '/shop',
  },
  story_cloth: {
    kicker: 'The Cloth',
    title: 'Barish & Dhoop',
    body:
      'Our signature red mul cotton was born of two seasons at once — light ' +
      'as monsoon air, warm as afternoon sun. Woven to move with you, and to ' +
      'last long enough to be handed down.',
    linkLabel: 'Discover the piece',
    link: '/product/maroon-patola-ikat',
  },
  story_hand: {
    kicker: 'The Hand',
    title: 'Painted, not printed',
    body:
      'Kalamkari and madhubani motifs are drawn by hand, one line at a time. ' +
      'No two peacocks turn their head the same way — the small differences ' +
      'are the signature of a real maker, not a machine.',
    linkLabel: 'See the sarees',
    link: '/shop?category=saree',
  },
  story_wardrobe: {
    kicker: 'The Wardrobe',
    title: 'Made to be worn',
    body:
      'Chikankari suits, one-of-a-kind blouses and festive sets — pieces meant ' +
      'for the everyday and the once-in-a-lifetime alike. Kept in small ' +
      'batches so each finds the person it was made for.',
    linkLabel: 'Explore the collection',
    link: '/shop',
  },
};

// Section → friendly label + field list, used by the admin editor.
export const SITE_TEXT_SECTIONS = [
  { key: 'home_story', label: 'Homepage — "Barish & Dhoop" story band', fields: [
    ['chapter', 'Chapter line (small, top)'], ['eyebrow', 'Eyebrow'], ['title', 'Heading', 'line'],
    ['body', 'Paragraph', 'area'], ['button', 'Button text'], ['link', 'Button link'] ] },
  { key: 'edits_hero', label: 'Sutaara Edits page — top banner', fields: [
    ['kicker', 'Small line above heading'], ['title', 'Heading', 'area2'], ['body', 'Paragraph', 'area'], ['button', 'Button text'] ] },
  { key: 'story_intro', label: 'Sutaara Edits page — "Our Story" card', fields: [
    ['kicker', 'Small line'], ['title', 'Heading', 'line'], ['body', 'Paragraph', 'area'],
    ['linkLabel', 'Link text'], ['link', 'Link address'] ] },
  { key: 'story_cloth', label: 'Sutaara Edits page — "The Cloth" chapter', fields: [
    ['kicker', 'Small line'], ['title', 'Heading', 'line'], ['body', 'Paragraph', 'area'],
    ['linkLabel', 'Link text'], ['link', 'Link address'] ] },
  { key: 'story_hand', label: 'Sutaara Edits page — "The Hand" chapter', fields: [
    ['kicker', 'Small line'], ['title', 'Heading', 'line'], ['body', 'Paragraph', 'area'],
    ['linkLabel', 'Link text'], ['link', 'Link address'] ] },
  { key: 'story_wardrobe', label: 'Sutaara Edits page — "The Wardrobe" chapter', fields: [
    ['kicker', 'Small line'], ['title', 'Heading', 'line'], ['body', 'Paragraph', 'area'],
    ['linkLabel', 'Link text'], ['link', 'Link address'] ] },
];

// Merge saved overrides over defaults. Blank saved fields fall back to the
// default so an accidental empty box never blanks the page.
export function mergeSiteText(saved) {
  const out = {};
  for (const [section, defs] of Object.entries(SITE_TEXT_DEFAULTS)) {
    out[section] = { ...defs };
    const s = saved && saved[section];
    if (s) for (const k of Object.keys(defs)) if (typeof s[k] === 'string' && s[k].trim() !== '') out[section][k] = s[k];
  }
  return out;
}

// One shared fetch per page load; every component reuses the result.
let cache = null;
let inflight = null;
export function invalidateSiteText() { cache = null; inflight = null; }

export function useSiteText() {
  const [text, setText] = useState(() => mergeSiteText(cache));
  useEffect(() => {
    let alive = true;
    if (cache) { setText(mergeSiteText(cache)); return undefined; }
    if (!inflight) inflight = api.getSiteText().then((d) => { cache = d || {}; return cache; }).catch(() => { inflight = null; return null; });
    inflight.then((d) => { if (alive && d) setText(mergeSiteText(d)); });
    return () => { alive = false; };
  }, []);
  return text;
}

// Turn "*italic*" and newlines into React nodes (no raw HTML, so it's safe).
export function Rich({ text }) {
  const lines = String(text || '').split('\n');
  return lines.map((line, li) => (
    <span key={li}>
      {li > 0 && <br />}
      {line.split(/(\*[^*]+\*)/g).map((part, i) =>
        /^\*[^*]+\*$/.test(part) ? <em key={i}>{part.slice(1, -1)}</em> : part
      )}
    </span>
  ));
}
