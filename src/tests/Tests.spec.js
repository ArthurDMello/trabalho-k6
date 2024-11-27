import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.30'],
    get_contacts: ['p(95)<5700'],
    content_OK: ['rate>0.95']
  },
  stages: [
    { duration: '1m', target: 10 }, // 10 VUs no primeiro minuto
    { duration: '1m', target: 50 }, // 50 VUs no segundo minuto
    { duration: '1m', target: 100 }, // 100 VUs no terceiro minuto
    { duration: '1m', target: 200 }, // 200 VUs no quarto minuto
    { duration: '1m', target: 300 } // 300 VUs no quinto minuto
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://dog.ceo/api/breeds/list/all';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(baseUrl, params);

  getContactsDuration.add(res.timings.duration);
  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Breeds List - Status 200': () => res.status === OK,
    'Resposta contém status "success"': () => res.json('status') === 'success',
    'Resposta contém a chave "message"': () => res.json('message') !== undefined
  });
}
