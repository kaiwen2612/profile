---
title: "Singapore Weather"
slug: sg-weather
summary: "A static, installable PWA that shows whether it's about to rain and whether the air is OK in Singapore, reading live NEA data from data.gov.sg directly in the browser with no backend."
technologies:
  - name: "React 18 & TypeScript"
    why: "The single-screen UI, built as a small component tree (rain card, PSI card, heavy-rain banner, area picker, radar view) with strict typing over one weather-snapshot shape."
  - name: "Vite & vite-plugin-pwa"
    why: "Build tooling plus the Workbox service worker that makes the app installable to a phone home screen and serves a cached last-known reading when offline."
  - name: "TanStack Query"
    why: "Cache-first loading: it paints the last reading from localStorage immediately, then revalidates NEA in the background, which is what makes the app feel instant."
  - name: "Tailwind CSS"
    why: "A high-contrast, large-type, single-column layout aimed at a non-technical older user reading the screen at a glance."
  - name: "Vitest & Playwright"
    why: "Around 40 unit tests over the domain logic and components, plus end-to-end tests of the open-app-to-rain-status flow and the heavy-rain banner against stubbed NEA responses."
decisions:
  - decision: "Removed the entire server tier. The first version was an npm-workspace monorepo with a Fastify and SQLite backend and a 5-minute poller sending Web Push and email alerts. A follow-up interview with the target user found push notifications didn't matter to her except for flash floods, and notifications were the only feature that needed an always-on server, so cutting them collapsed the proxy, cache, database, scheduler, and second deploy target into a single static bundle."
    rejectedAlternative: "Keeping a small backend alive just for a flash-flood alert. There is no clean public realtime flash-flood feed to consume, and home-rolling a safety-critical warning on a rainfall proxy would be irresponsible, so the app links to PUB's (Singapore's national water agency) own official flood-alert Telegram channel instead."
  - decision: "Fetch NEA's data.gov.sg endpoints directly from the browser, with no proxy. This was checked against the live API: the environment endpoints return an `access-control-allow-origin: *` header and answer the CORS preflight, so the server's proxy role disappeared along with the notifications."
    rejectedAlternative: "A serverless function to front the API. Unnecessary once CORS was confirmed, and it would have re-introduced a deploy target and a cold-start delay that the cache-first design exists to avoid."
  - decision: "Render absent upstream data as an explicit 'unknown', never as a healthy default. The four NEA calls run through `Promise.allSettled`, so one failed endpoint degrades to 'Can't tell right now' or 'Air quality unavailable' rather than erroring the whole screen or, worse, showing 'Air: Normal' when the PSI feed is actually down."
    rejectedAlternative: "Treating a missing PSI reading as within the safe band. That is the intuitive default, and it was flagged in code review as unsafe for a tool people use to decide whether to close their windows."
result: "The app is live at sgweather.kwen.dev, installs to a phone home screen, and works offline with the last fetched reading. The concrete outcome is the simplification itself: a three-package monorepo with Fastify, SQLite, a cron poller, Web Push, and email was reduced to a single npm package with no backend, no environment variables, no secrets, and no database, deployed as one static folder to GitHub Pages. The full server version is preserved at the git tag v1.0-full."
learned: "The biggest architectural change on this project came from re-interviewing the user, not from a technical idea. Push notifications had felt central, since several of the v1 'must have' user stories were about being alerted, but a second conversation established they weren't wanted, and removing them took an entire server tier with them. The lesson was that the cheapest time to delete a whole subsystem is before you've talked to the user again, and that 'what does this person actually open the app to check' is worth asking more than once."
githubUrl: "https://github.com/kaiwen2612/sg-weather"
demoUrl: "https://sgweather.kwen.dev"
order: 4
---

**Singapore Weather** is a small progressive web app that answers one question quickly: is it about to rain where I am, and is the air OK? It reads Singapore-only NEA data live from `data.gov.sg` in the browser, with no backend of its own.

## Problem

The design started from an interview with a Singaporean in her mid-fifties who plans household routines around the weather: whether to hang laundry outside, whether to walk to the wet market. Two facts drive those decisions, "is it raining or about to?" and "is there haze right now?" (the PSI reading). She already got both from NEA's website and checkpoint.sg, but those sources load slowly, bury the two facts she cares about among many other readings, and make her keep checking rather than telling her when something changes. She also trusts observed data, like radar and current readings, over forecasts.

## Approach

One screen, mobile-first, installable to the home screen. It defaults to a saved area or the phone's location, then shows a plain-language rain state ("Raining now" / "Rain expected" / "No rain" / "Can't tell right now"), the current PSI value and band, a rough next-24-hour outlook clearly marked as a rough guide, and the timestamp of the last reading. An optional rain map (NEA's radar image) is one tap away. Everything is read live from NEA's `data.gov.sg` environment APIs: the 2-hour and 24-hour forecasts, PSI, and 5-minute rainfall.

## Technical decisions

The first version had a backend because it sent notifications: something has to poll every five minutes when no browser is open, hold push subscriptions, and call the Web Push API with a VAPID private key that cannot ship to the client. A second interview with the target user established that notifications were "not that important" to her, with flash floods the one exception. That removed the only reason for an always-on server, and with it the request proxy, the response cache, the SQLite database, the scheduled poller, and a separate hosting target. The flash-flood exception is handled by linking to PUB's existing official Telegram alert channel rather than rebuilding a safety-critical warning on top of a rainfall proxy.

Two smaller decisions followed from that. Because NEA's environment endpoints send `access-control-allow-origin: *`, the browser can call them directly and no proxy is needed. And because the app now depends entirely on a third party it doesn't control, missing data is rendered honestly: a failed PSI call shows "Air quality unavailable", not a reassuring default.

## Implementation

A single `buildSnapshot()` function fires the four NEA calls with `Promise.allSettled`, then for each result finds the nearest forecast area, PSI region, and rainfall station by haversine distance and folds everything into one typed `WeatherSnapshot`. Rain state comes from `classifyRain(forecastText, rainfallMm)`: a forecast counts as rain if, lowercased, it contains "rain", "showers", or "thundery", and "raining now" additionally requires the nearest station's latest reading to be above zero. PSI bands follow NEA's standard ranges, with "unhealthy" meaning a value above 100. A heavy-rain banner appears when the nearest station reports at least 20 mm in the last five minutes, and links to PUB. TanStack Query seeds from `localStorage` and revalidates on a 60-second stale time; the service worker caches the NEA origin `NetworkFirst` with a 3-second network timeout, so a returning user sees the previous reading in well under two seconds while the fresh one loads behind it.

## Testing

About 40 Vitest unit tests cover the domain logic (rain classification, PSI bands, geo distance, the snapshot builder) and each component, including the partial-outage cases: rainfall endpoint down, 2-hour forecast down, PSI down, and all four down, each with its own honest-unknown rendering. Playwright end-to-end tests stub the `api.data.gov.sg` responses with fixture payloads and assert that the picked area's rain status and PSI appear within two seconds, and that a fixture with a nearest-station reading over 20 mm shows the heavy-rain banner with its PUB link.

## Results

The app is live at [sgweather.kwen.dev](https://sgweather.kwen.dev), installable, and usable offline with the last fetched reading and its timestamp. The measurable change is the collapse in surface area: the v1 monorepo of three packages (`shared`, `server`, `web`) with Fastify, SQLite, a `node-cron` poller, Web Push, and email became a single npm package at the repo root with no backend, no environment variables, no secrets, and no database, built to a static `dist/` folder and deployed to GitHub Pages by a push to `main`. The full server-plus-notifications implementation is kept at the git tag `v1.0-full` in case those requirements return.

## What I learned

The largest architectural decision on this project, removing the whole server tier, came out of talking to the user a second time rather than from a technical insight. Notifications had shaped the v1 spec, several "must have" user stories were about being alerted, and it would have been easy to treat that as settled. Re-checking what she actually wanted removed the feature and an entire subsystem at once. The takeaway was to keep asking "what does this person open the app to check", because the answer moved, and the cheapest moment to delete a subsystem is before it has anything else built on top of it.
