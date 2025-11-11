// services/api.js
import { USE_MOCK, API_BASE_URL } from '../../shared/config/endpoints';
import feed from '../data/challenges.json';
import profile from '../data/profile.json';

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
  async scoreDaily(challengeId, audioUrl, token) {
    await delay(500); // Simulate API delay
    console.log('MockAdapter.scoreDaily called with:', { challengeId, audioUrl, token });

    // Simulate random pronunciation scoring for testing
    const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const pass = randomScore >= 75;

    return {
      xp_gained: pass ? 15 : 5,
      feedback: pass
        ? "Great pronunciation! Keep up the good work. (Mock response)"
        : "Good effort! Try focusing on clarity. (Mock response)",
      pass: pass,
      pronunciation_score: randomScore,
      transcription: "Mock transcription of your audio",
      similarity: randomScore / 100
    };
  },
  async fetchDailyChallenges() {
    await delay(250);
    console.log('MockAdapter.fetchDailyChallenges called');
    // Filter feed for daily challenges or return all if no frequency field
    const dailyChallenges = feed.filter(c => c.frequency === 'daily' || !c.frequency);
    return { challenges: dailyChallenges };
  },
  async fetchWeeklyChallenges() {
    await delay(250);
    console.log('MockAdapter.fetchWeeklyChallenges called');
    const weeklyChallenges = feed.filter(c => c.frequency === 'weekly');
    return { challenges: weeklyChallenges };
  },
  async fetchMonthlyChallenges() {
    await delay(250);
    console.log('MockAdapter.fetchMonthlyChallenges called');
    const monthlyChallenges = feed.filter(c => c.frequency === 'monthly');
    return { challenges: monthlyChallenges };
  }
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
  async scoreDaily(challengeId, audioUrl, token) {
    const res = await fetch(`${API_BASE_URL}/scoreDaily`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        audio_url: audioUrl
      })
    });
    return res.json();
  },
  async fetchDailyChallenges() {
    const res = await fetch(`${API_BASE_URL}/challenges/daily`);
    return res.json();
  },
  async fetchWeeklyChallenges() {
    const res = await fetch(`${API_BASE_URL}/challenges/weekly`);
    return res.json();
  },
  async fetchMonthlyChallenges() {
    const res = await fetch(`${API_BASE_URL}/challenges/monthly`);
    return res.json();
  }
};

// Log which adapter is being used and available methods
const selectedAdapter = USE_MOCK ? MockAdapter : HttpAdapter;
console.log('API Mode:', USE_MOCK ? 'MOCK' : 'HTTP');
console.log('API Base URL:', API_BASE_URL);
console.log('Available API methods:', Object.keys(selectedAdapter));

export const api = selectedAdapter;

