import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Rate } from "k6/metrics";

const duracionRespuesta = new Trend("duracion_respuesta");
const tasaExito = new Rate("tasa_exito");

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 10 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    tasa_exito: ["rate>0.95"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const USER_EMAIL = __ENV.USER_EMAIL || "";
const USER_PASSWORD = __ENV.USER_PASSWORD || "";
const RIDER_EMAIL = __ENV.RIDER_EMAIL || "";
const RIDER_PASSWORD = __ENV.RIDER_PASSWORD || "";

const RUN_MAPS = (__ENV.RUN_MAPS || "false").toLowerCase() === "true";
const RUN_RIDE = (__ENV.RUN_RIDE || "false").toLowerCase() === "true";

const MAP_ADDRESS = __ENV.MAP_ADDRESS || "Mexico City";
const ORIGIN = __ENV.ORIGIN || "Mexico City";
const DESTINATION = __ENV.DESTINATION || "Guadalajara";
const MAP_INPUT = __ENV.MAP_INPUT || "Av Reforma";
const LAT = __ENV.LAT || "19.4326";
const LNG = __ENV.LNG || "-99.1332";
const RIDE_VEHICLE = __ENV.RIDE_VEHICLE || "car";

function loginUser() {
  if (!USER_EMAIL || !USER_PASSWORD) return null;

  const payload = JSON.stringify({
    email: USER_EMAIL,
    password: USER_PASSWORD,
  });

  const res = http.post(`${BASE_URL}/user/login`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  const ok = check(res, {
    "POST /user/login 200": (r) => r.status === 200,
  });
  tasaExito.add(ok);
  duracionRespuesta.add(res.timings.duration);

  if (!ok) return null;
  try {
    const body = res.json();
    return body.token || null;
  } catch (_) {
    return null;
  }
}

function loginRider() {
  if (!RIDER_EMAIL || !RIDER_PASSWORD) return null;

  const payload = JSON.stringify({
    email: RIDER_EMAIL,
    password: RIDER_PASSWORD,
  });

  const res = http.post(`${BASE_URL}/rider/login`, payload, {
    headers: { "Content-Type": "application/json" },
  });

  const ok = check(res, {
    "POST /rider/login 200": (r) => r.status === 200,
  });
  tasaExito.add(ok);
  duracionRespuesta.add(res.timings.duration);

  if (!ok) return null;
  try {
    const body = res.json();
    return body.token || null;
  } catch (_) {
    return null;
  }
}

export function setup() {
  const userToken = loginUser();
  const riderToken = loginRider();
  return { userToken, riderToken };
}

export default function (data) {
  group("health", () => {
    const resRoot = http.get(`${BASE_URL}/`);
    const okRoot = check(resRoot, {
      "GET / 200": (r) => r.status === 200,
    });
    tasaExito.add(okRoot);
    duracionRespuesta.add(resRoot.timings.duration);

    const resReload = http.get(`${BASE_URL}/reload`);
    const okReload = check(resReload, {
      "GET /reload 200": (r) => r.status === 200,
    });
    tasaExito.add(okReload);
    duracionRespuesta.add(resReload.timings.duration);
  });

  if (RUN_MAPS) {
    group("map-public", () => {
      const resCoords = http.get(
        `${BASE_URL}/map/get-coordinates?address=${encodeURIComponent(MAP_ADDRESS)}`
      );
      const okCoords = check(resCoords, {
        "GET /map/get-coordinates 200": (r) => r.status === 200,
      });
      tasaExito.add(okCoords);
      duracionRespuesta.add(resCoords.timings.duration);
    });
  }

  if (data.userToken) {
    const authHeaders = {
      headers: {
        "Content-Type": "application/json",
        token: data.userToken,
      },
    };

    group("user", () => {
      const resProfile = http.get(`${BASE_URL}/user/profile`, authHeaders);
      const okProfile = check(resProfile, {
        "GET /user/profile 200": (r) => r.status === 200,
      });
      tasaExito.add(okProfile);
      duracionRespuesta.add(resProfile.timings.duration);
    });

    if (RUN_MAPS) {
      group("map-auth", () => {
        const resDistance = http.get(
          `${BASE_URL}/map/get-distance-time?origin=${encodeURIComponent(
            ORIGIN
          )}&destination=${encodeURIComponent(DESTINATION)}`,
          authHeaders
        );
        const okDistance = check(resDistance, {
          "GET /map/get-distance-time 200": (r) => r.status === 200,
        });
        tasaExito.add(okDistance);
        duracionRespuesta.add(resDistance.timings.duration);

        const resSuggestions = http.get(
          `${BASE_URL}/map/get-suggestions?input=${encodeURIComponent(MAP_INPUT)}`,
          authHeaders
        );
        const okSuggestions = check(resSuggestions, {
          "GET /map/get-suggestions 200": (r) => r.status === 200,
        });
        tasaExito.add(okSuggestions);
        duracionRespuesta.add(resSuggestions.timings.duration);

        const resAddress = http.get(
          `${BASE_URL}/map/get-address?lat=${encodeURIComponent(
            LAT
          )}&lng=${encodeURIComponent(LNG)}`,
          authHeaders
        );
        const okAddress = check(resAddress, {
          "GET /map/get-address 200": (r) => r.status === 200,
        });
        tasaExito.add(okAddress);
        duracionRespuesta.add(resAddress.timings.duration);
      });
    }

    if (RUN_RIDE) {
      group("ride", () => {
        const fareRes = http.get(
          `${BASE_URL}/ride/get-fare?pickup=${encodeURIComponent(
            ORIGIN
          )}&destination=${encodeURIComponent(DESTINATION)}`,
          authHeaders
        );
        const okFare = check(fareRes, {
          "GET /ride/get-fare 200": (r) => r.status === 200,
        });
        tasaExito.add(okFare);
        duracionRespuesta.add(fareRes.timings.duration);

        const ridePayload = JSON.stringify({
          pickup: ORIGIN,
          destination: DESTINATION,
          vehicleType: RIDE_VEHICLE,
          pickupCoordinates: { lat: parseFloat(LAT), lng: parseFloat(LNG) },
          destinationCoordinates: { lat: parseFloat(LAT), lng: parseFloat(LNG) },
        });

        const createRes = http.post(`${BASE_URL}/ride/create`, ridePayload, authHeaders);
        const okCreate = check(createRes, {
          "POST /ride/create 201": (r) => r.status === 201,
        });
        tasaExito.add(okCreate);
        duracionRespuesta.add(createRes.timings.duration);
      });
    }
  }

  if (data.riderToken) {
    const riderHeaders = {
      headers: {
        "Content-Type": "application/json",
        token: data.riderToken,
      },
    };

    group("rider", () => {
      const resProfile = http.get(`${BASE_URL}/rider/profile`, riderHeaders);
      const okProfile = check(resProfile, {
        "GET /rider/profile 200": (r) => r.status === 200,
      });
      tasaExito.add(okProfile);
      duracionRespuesta.add(resProfile.timings.duration);
    });
  }

  sleep(1);
}
