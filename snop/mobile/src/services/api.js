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
  // Configuration
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second base delay

  // Helper to create fetch with timeout
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.TIMEOUT / 1000}s`);
      }
      throw error;
    }
  },

  // Helper to retry failed requests with exponential backoff
  async retryFetch(fn, retries = this.MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = i === retries - 1;

        // Don't retry on 4xx errors (client errors) except 401 (handled separately)
        if (error.message && error.message.startsWith('HTTP 4') && !error.message.startsWith('HTTP 401')) {
          throw error;
        }

        if (isLastAttempt) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delayMs = this.RETRY_DELAY * Math.pow(2, i);
        if (__DEV__) {
          console.log(`Retry ${i + 1}/${retries} after ${delayMs}ms...`);
        }
        await delay(delayMs);
      }
    }
  },

  // Helper to handle fetch responses and provide clear error messages
  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = null;

      try {
        const errorData = await response.json();
        if (errorData.error || errorData.message) {
          errorMessage = errorData.error || errorData.message;
        }
        if (errorData.code) {
          errorCode = errorData.code;
        }
      } catch (e) {
        // Response body is not JSON, use status text
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = errorCode;
      throw error;
    }
    return response.json();
  },

  // Helper to handle 401 errors and retry with refreshed token
  async fetchWithAuth(url, options, token, refreshTokenFn) {
    try {
      // Add auth header
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };

      const response = await this.fetchWithTimeout(url, { ...options, headers });

      // If 401, try to refresh token and retry once
      if (response.status === 401) {
        if (__DEV__) {
          console.log('🔄 Got 401, refreshing token and retrying...');
        }

        if (refreshTokenFn) {
          const newToken = await refreshTokenFn();
          if (newToken) {
            // Retry with new token
            const retryHeaders = {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`
            };
            return await this.fetchWithTimeout(url, { ...options, headers: retryHeaders });
          }
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  async getFeed() {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/challenges/feed`);
      return this.handleResponse(res);
    });
  },
  async getChallenge(id) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/challenges/${id}`);
      return this.handleResponse(res);
    });
  },
  async submitAttempt(body) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/challenges/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return this.handleResponse(res);
    });
  },
  async getProfile() {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/user/profile`);
      return this.handleResponse(res);
    });
  },
  async scoreDaily(challengeId, audioUrl, token) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/scoreDaily`, {
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
      return this.handleResponse(res);
    });
  },
  async scoreWeekly(challengeId, audioUrl, token) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/scoreWeekly`, {
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
      return this.handleResponse(res);
    });
  },
  async scoreMonthly(challengeId, audioUrl, token) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/scoreMonthly`, {
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
      return this.handleResponse(res);
    });
  },
  async fetchDailyChallenges() {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/challenges/daily`);
      return this.handleResponse(res);
    });
  },
  async fetchWeeklyChallenges() {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/challenges/weekly`);
      return this.handleResponse(res);
    });
  },
  async fetchMonthlyChallenges() {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/challenges/monthly`);
      return this.handleResponse(res);
    });
  },
  async getUserStats(token) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/userStats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return this.handleResponse(res);
    });
  },
  async getLeaderboard(period = 'weekly') {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/leaderboard?period=${period}`);
      return this.handleResponse(res);
    });
  },

  // ===== CEFR ENDPOINTS =====

  async getTodaysChallenges(token) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/challenges/today`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return this.handleResponse(res);
    });
  },

  async submitChallengeAnswer(token, challengeId, userAnswer) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/challenges/submit`, {
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
      return this.handleResponse(res);
    });
  },

  async submitIRLChallenge(token, challengeId, photoBase64, options = {}) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/challenges/irl/verify`, {
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
      return this.handleResponse(res);
    });
  },

  async getUserProgress(token) {
    return this.retryFetch(async () => {
      const res = await this.fetchWithTimeout(`${API_BASE_URL}/api/user/progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return this.handleResponse(res);
    });
  }
};

// Log which adapter is being used and available methods
const selectedAdapter = USE_MOCK ? MockAdapter : HttpAdapter;

if (__DEV__) {
  console.log('API Mode:', USE_MOCK ? 'MOCK' : 'HTTP');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Available API methods:', Object.keys(selectedAdapter));
}

export const api = selectedAdapter;

