import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';


const tendenciaRespuesta = new Trend('duracion_respuesta');
const tasaExito = new Rate('tasa_exito');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  
    { duration: '1m',  target: 10 },  
    { duration: '10s', target: 0  },  
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  
    tasa_exito: ['rate>0.95'],         
  },
};


const BASE_URL = 'https://jsonplaceholder.typicode.com';

export default function () {
 
  const res1 = http.get(`${BASE_URL}/users`);
  
  check(res1, {
    'GET /users - status 200':        (r) => r.status === 200,
    'GET /users - tiempo < 500ms':    (r) => r.timings.duration < 500,
    'GET /users - body no vacío':     (r) => r.body.length > 0,
  });

  tendenciaRespuesta.add(res1.timings.duration);
  tasaExito.add(res1.status === 200);

  sleep(1);


  const userId = Math.floor(Math.random() * 10) + 1;
  const res2 = http.get(`${BASE_URL}/users/${userId}`);

  check(res2, {
    'GET /users/:id - status 200':     (r) => r.status === 200,
    'GET /users/:id - tiempo < 500ms': (r) => r.timings.duration < 500,
    'GET /users/:id - tiene email':    (r) => JSON.parse(r.body).email !== undefined,
  });

  tendenciaRespuesta.add(res2.timings.duration);
  tasaExito.add(res2.status === 200);

  sleep(1);


  const payload = JSON.stringify({
    title:  'Prueba de carga',
    body:   'Simulación de creación de registro',
    userId: userId,
  });

  const res3 = http.post(`${BASE_URL}/posts`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res3, {
    'POST /posts - status 201':     (r) => r.status === 201,
    'POST /posts - tiempo < 800ms': (r) => r.timings.duration < 800,
    'POST /posts - tiene id':       (r) => JSON.parse(r.body).id !== undefined,
  });

  tendenciaRespuesta.add(res3.timings.duration);
  tasaExito.add(res3.status === 201);

  sleep(1);
}
