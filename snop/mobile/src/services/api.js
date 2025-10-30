// services/api.js
import { USE_MOCK, API_BASE_URL } from '../shared/config/endpoints';
import feed from '../src/data/challenges.json'; // eks. feed
import profile from '../src/data/profile.json'; // lag denne

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const MockAdapter = {
  async getFeed() {
    await delay(250);
    return feed; // array av challenges
  },
  async getChallenge(id) {
    await delay(200);
    // enten ha egne filer per id eller finn i feed:
    return feed.find((c) => c.id === id);
  },
  async submitAttempt(body) {
    await delay(250);
    // enkel logikk for demo:
    const challenge = feed.find((c) => c.id === body.challengeId);
    const correct = challenge?.answer
      ? (Array.isArray(challenge.answer)
          ? challenge.answer.map(a=>a.toLowerCase().trim()).includes(String(body.userAnswer||'').toLowerCase().trim())
          : String(challenge.answer).toLowerCase().trim() === String(body.userAnswer||'').toLowerCase().trim())
      : true; // ikke-auto-evaluerbare typer → bare true for demo
    return { correct, score: correct ? 1 : 0, newXp: correct ? 10 : 0 };
  },
  async getProfile() {
    await delay(200);
    return profile;
  },
};

const HttpAdapter = {
  async getFeed() {
    const res = await fetch(`${API_BASE_URL}/challenges/feed`);
    return res.json();
  },
  async getChallenge(id) {
    const res = await fetch(`${API_BASE_URL}/challenges/${id}`);
    return res.json();
  },
  async submitAttempt(body) {
    const res = await fetch(`${API_BASE_URL}/challenges/attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async getProfile() {
    const res = await fetch(`${API_BASE_URL}/user/profile`);
    return res.json();
  },
};

export const api = USE_MOCK ? MockAdapter : HttpAdapter;

