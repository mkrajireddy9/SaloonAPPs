import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 5, duration: '30s', thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'] } };
export default function () { const response = http.get(`${__ENV.API_URL || 'http://localhost:3000'}/health`); check(response, { 'health is available': r => r.status === 200 }); sleep(1); }
