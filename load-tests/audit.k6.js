import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://brandaudit.aiden.services';
const AUTH_COOKIE = __ENV.AUTH_COOKIE || '';
const BRAND_URL = __ENV.BRAND_URL || 'https://example.com';
const BRAND_NAME = __ENV.BRAND_NAME || 'Example Brand';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 3 },
        { duration: '2m', target: 8 },
        { duration: '1m', target: 8 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<120000'],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/api/audit`,
    JSON.stringify({
      brands: [{ name: BRAND_NAME, website: BRAND_URL }],
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Cookie: AUTH_COOKIE ? `aiden-gw=${AUTH_COOKIE}` : '',
      },
      timeout: '300s',
    }
  );

  check(res, {
    'status is 200 or 402 or 503': (r) => [200, 402, 503].includes(r.status),
    'not 5xx other than 503': (r) => r.status < 500 || r.status === 503,
  });

  sleep(Math.random() * 5 + 5);
}
