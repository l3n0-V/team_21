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
  async scoreWeekly(challengeId, audioUrl, token) {
    await delay(500); // Simulate API delay
    console.log('MockAdapter.scoreWeekly called with:', { challengeId, audioUrl, token });

    // Simulate random pronunciation scoring for testing
    const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const pass = randomScore >= 75;

    return {
      xp_gained: pass ? 25 : 10, // Higher XP for weekly challenges
      feedback: pass
        ? "Excellent work on this weekly challenge! (Mock response)"
        : "Good try! Practice more for better results. (Mock response)",
      pass: pass,
      pronunciation_score: randomScore,
      transcription: "Mock transcription of your audio",
      similarity: randomScore / 100
    };
  },
  async scoreMonthly(challengeId, audioUrl, token) {
    await delay(500); // Simulate API delay
    console.log('MockAdapter.scoreMonthly called with:', { challengeId, audioUrl, token });

    // Simulate random pronunciation scoring for testing
    const randomScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const pass = randomScore >= 75;

    return {
      xp_gained: pass ? 50 : 20, // Higher XP for monthly challenges
      feedback: pass
        ? "Outstanding! You've mastered this monthly challenge! (Mock response)"
        : "Good effort! Keep practicing to improve. (Mock response)",
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
  },
  async getUserStats(token) {
    await delay(500);
    console.log('MockAdapter.getUserStats called');
    return {
      xp_total: 245,
      streak_days: 7,
      last_attempt_at: new Date().toISOString()
    };
  },
  async getLeaderboard(period = 'weekly') {
    await delay(800);
    console.log(`MockAdapter.getLeaderboard called for period: ${period}`);
    return {
      period,
      top: [
        { uid: 'user1', name: 'Sarah Chen', xp: 485 },
        { uid: 'user2', name: 'Mike Johnson', xp: 420 },
        { uid: 'test-user-001', name: 'Test User', xp: 245 },
        { uid: 'user3', name: 'Emma Davis', xp: 210 },
        { uid: 'user4', name: 'Alex Kim', xp: 195 },
        { uid: 'user5', name: 'Chris Martinez', xp: 180 },
        { uid: 'user6', name: 'Jessica Lee', xp: 165 },
        { uid: 'user7', name: 'David Brown', xp: 150 },
        { uid: 'user8', name: 'Sophia White', xp: 135 },
        { uid: 'user9', name: 'Ryan Taylor', xp: 120 }
      ]
    };
  },

  // ===== CEFR ENDPOINTS =====

  async getTodaysChallenges(token) {
    await delay(500);
    console.log('MockAdapter.getTodaysChallenges called');
    // Filter challenges by type and return with completion status
    const irlChallenges = feed.filter(c => c.type === 'irl').slice(0, 2);
    const listeningChallenges = feed.filter(c => c.type === 'listening').slice(0, 5);
    const fillBlankChallenges = feed.filter(c => c.type === 'fill_blank').slice(0, 5);
    const multipleChoiceChallenges = feed.filter(c => c.type === 'multiple_choice').slice(0, 5);

    return {
      date: new Date().toISOString().split('T')[0],
      user_level: 'A1',
      challenges: {
        irl: {
          available: irlChallenges,
          completed_today: 0,
          limit: 1,
          can_complete_more: true
        },
        listening: {
          available: listeningChallenges,
          completed_today: 0,
          limit: 3,
          can_complete_more: true
        },
        fill_blank: {
          available: fillBlankChallenges,
          completed_today: 0,
          limit: 3,
          can_complete_more: true
        },
        multiple_choice: {
          available: multipleChoiceChallenges,
          completed_today: 0,
          limit: 3,
          can_complete_more: true
        }
      }
    };
  },

  async submitChallengeAnswer(token, challengeId, userAnswer) {
    await delay(500);
    console.log('MockAdapter.submitChallengeAnswer called', { challengeId, userAnswer });

    // Simulate 70% correct rate
    const correct = Math.random() > 0.3;

    return {
      success: true,
      correct: correct,
      xp_gained: correct ? 10 : 5,
      feedback: correct ? 'Correct! Well done!' : 'Not quite. Try again!',
      level_progress: {
        current_level: 'A1',
        completed: 6,
        required: 20,
        percentage: 30
      }
    };
  },

  async submitIRLChallenge(token, challengeId, photoBase64, options = {}) {
    await delay(800);
    console.log('MockAdapter.submitIRLChallenge called', { challengeId, hasPhoto: !!photoBase64, options });

    return {
      success: true,
      verified: true,
      xp_gained: 50,
      photo_url: 'https://example.com/mock-photo.jpg',
      feedback: 'Great job on your IRL challenge!',
      completion_status: {
        irl_completed_today: 1,
        irl_limit: 1,
        can_complete_more: false
      }
    };
  },

  async getUserProgress(token) {
    await delay(500);
    console.log('MockAdapter.getUserProgress called');

    return {
      current_level: 'A1',
      progress: {
        A1: {
          name: 'Beginner',
          completed: 6,
          required: 20,
          percentage: 30,
          unlocked: true,
          is_current: true
        },
        A2: {
          name: 'Elementary',
          completed: 0,
          required: 20,
          percentage: 0,
          unlocked: false,
          unlock_message: 'Complete 14 more A1 challenges to unlock A2'
        },
        B1: {
          name: 'Intermediate',
          completed: 0,
          required: 25,
          percentage: 0,
          unlocked: false,
          unlock_message: 'Complete A2 to unlock B1'
        },
        B2: {
          name: 'Upper Intermediate',
          completed: 0,
          required: 25,
          percentage: 0,
          unlocked: false,
          unlock_message: 'Complete B1 to unlock B2'
        },
        C1: {
          name: 'Advanced',
          completed: 0,
          required: 30,
          percentage: 0,
          unlocked: false,
          unlock_message: 'Complete B2 to unlock C1'
        },
        C2: {
          name: 'Mastery',
          completed: 0,
          required: 30,
          percentage: 0,
          unlocked: false,
          unlock_message: 'Complete C1 to unlock C2'
        }
      },
      recent_completions: []
    };
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
  async scoreWeekly(challengeId, audioUrl, token) {
    const res = await fetch(`${API_BASE_URL}/scoreWeekly`, {
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
  async scoreMonthly(challengeId, audioUrl, token) {
    const res = await fetch(`${API_BASE_URL}/scoreMonthly`, {
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
  },
  async getUserStats(token) {
    const res = await fetch(`${API_BASE_URL}/userStats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  },
  async getLeaderboard(period = 'weekly') {
    const res = await fetch(`${API_BASE_URL}/leaderboard?period=${period}`);
    return res.json();
  },

  // ===== CEFR ENDPOINTS =====

  async getTodaysChallenges(token) {
    const res = await fetch(`${API_BASE_URL}/api/challenges/today`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  },

  async submitChallengeAnswer(token, challengeId, userAnswer) {
    const res = await fetch(`${API_BASE_URL}/api/challenges/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        user_answer: userAnswer
      })
    });
    return res.json();
  },

  async submitIRLChallenge(token, challengeId, photoBase64, options = {}) {
    const res = await fetch(`${API_BASE_URL}/api/challenges/irl/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge_id: challengeId,
        photo_base64: photoBase64,
        ...options // gps_lat, gps_lng, text_description
      })
    });
    return res.json();
  },

  async getUserProgress(token) {
    const res = await fetch(`${API_BASE_URL}/api/user/progress`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  }
};

// Log which adapter is being used and available methods
const selectedAdapter = USE_MOCK ? MockAdapter : HttpAdapter;
console.log('API Mode:', USE_MOCK ? 'MOCK' : 'HTTP');
console.log('API Base URL:', API_BASE_URL);
console.log('Available API methods:', Object.keys(selectedAdapter));

export const api = selectedAdapter;

