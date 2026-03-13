import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const generateDuration = new Trend('generate_duration');

export const options = {
  stages: [
    { duration: '30s', target: 100 },   // ramp up to 100 users
    { duration: '1m',  target: 500 },   // ramp up to 500 users
    { duration: '1m',  target: 1000 },  // ramp up to 1000 users
    { duration: '2m',  target: 1000 },  // hold at 1000 users
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:   ['rate<0.05'],   // less than 5% errors
    error_rate:        ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';

// Fake JWT for testing (won't work for auth routes but tests rate limiting)
const FAKE_TOKEN = 'Bearer test_token_invalid';

export default function () {
  // Test 1 — Public tips (no auth needed)
  const publicTips = http.get(`${BASE_URL}/api/tip/public`);
  check(publicTips, {
    'public tips status 200': (r) => r.status === 200,
    'public tips fast':       (r) => r.timings.duration < 1000,
  });
  errorRate.add(publicTips.status !== 200);
  sleep(0.5);

  // Test 2 — Credits endpoint (returns 401 without auth — tests server stability)
  const credits = http.get(`${BASE_URL}/api/user/credits`, {
    headers: { Authorization: FAKE_TOKEN },
  });
  check(credits, {
    'credits returns 401 or 200': (r) => [200, 401, 403].includes(r.status),
    'credits fast':               (r) => r.timings.duration < 500,
  });
  sleep(0.3);

  // Test 3 — Contact form
  const contact = http.post(
    `${BASE_URL}/api/contact`,
    JSON.stringify({ name: 'Load Test', email: 'test@test.com', message: 'k6 test' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(contact, {
    'contact returns non-500': (r) => r.status !== 500,
  });
  sleep(0.5);

  // Test 4 — Generate tip (unauthorized — tests rate limiting + server stability)
  const startTime = Date.now();
  const generate = http.post(
    `${BASE_URL}/api/tip/generate`,
    JSON.stringify({ title: 'Insuffisance aortique', type: 'Mnemonic', aspect: 'memory_boost' }),
    { headers: { 'Content-Type': 'application/json', Authorization: FAKE_TOKEN } }
  );
  generateDuration.add(Date.now() - startTime);
  check(generate, {
    'generate returns 401 or 403 (not 500)': (r) => [401, 403].includes(r.status),
  });
  sleep(1);
}