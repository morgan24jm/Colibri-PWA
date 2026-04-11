// Mock de mongoose y modelos ANTES de importar cualquier cosa
jest.mock("../config/db", () => {});
jest.mock("../services/active.service", () => () => {});
jest.mock("../services/logging.service", () => ({
  write: jest.fn(),
}));
jest.mock("../socket", () => ({
  initializeSocket: jest.fn(),
}));

// Mock de modelos
jest.mock("../models/user.model", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/rider.model", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
}));
jest.mock("../models/blacklistToken.model", () => ({
  findOne: jest.fn(),
}));

const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const userRoutes = require("../routes/user.routes");
const riderRoutes = require("../routes/rider.routes");
const jwt = require("jsonwebtoken");

const userModel = require("../models/user.model");
const riderModel = require("../models/rider.model");
const blacklistTokenModel = require("../models/blacklistToken.model");

// App de prueba (sin levantar servidor real)
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/user", userRoutes);
app.use("/rider", riderRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
describe("GET /", () => {
  it("debe responder 200 con status ok", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─── USER REGISTER ───────────────────────────────────────────────────────────
describe("POST /user/register", () => {
  it("debe fallar si el email es inválido", async () => {
    const res = await request(app).post("/user/register").send({
      email: "no-es-email",
      password: "password123",
      fullname: { firstname: "Juan" },
      phone: "1234567890",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si la contraseña tiene menos de 8 caracteres", async () => {
    const res = await request(app).post("/user/register").send({
      email: "juan@test.com",
      password: "123",
      fullname: { firstname: "Juan" },
      phone: "1234567890",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si el firstname tiene menos de 2 caracteres", async () => {
    const res = await request(app).post("/user/register").send({
      email: "juan@test.com",
      password: "password123",
      fullname: { firstname: "J" },
      phone: "1234567890",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si el teléfono no tiene 10 dígitos", async () => {
    const res = await request(app).post("/user/register").send({
      email: "juan@test.com",
      password: "password123",
      fullname: { firstname: "Juan" },
      phone: "123",
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── USER LOGIN ──────────────────────────────────────────────────────────────
describe("POST /user/login", () => {
  it("debe fallar si el email es inválido", async () => {
    const res = await request(app).post("/user/login").send({
      email: "no-es-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si no se envía email", async () => {
    const res = await request(app).post("/user/login").send({
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── USER RUTAS PROTEGIDAS ───────────────────────────────────────────────────
describe("GET /user/profile (protegida)", () => {
  it("debe rechazar sin token con 401", async () => {
    blacklistTokenModel.findOne.mockResolvedValue(null);
    const res = await request(app).get("/user/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized User");
  });

  it("debe rechazar con token inválido con 401", async () => {
    blacklistTokenModel.findOne.mockResolvedValue(null);
    const res = await request(app)
      .get("/user/profile")
      .set("token", "token-invalido");
    expect(res.statusCode).toBe(401);
  });

  it("debe rechazar token en blacklist con 401", async () => {
    blacklistTokenModel.findOne.mockResolvedValue({ token: "token-blacklist" });
    const res = await request(app)
      .get("/user/profile")
      .set("token", "token-blacklist");
    expect(res.statusCode).toBe(401);
  });

  it("debe responder 200 con token válido", async () => {
    process.env.JWT_SECRET = "test-secret";
    const token = jwt.sign({ id: "user123" }, "test-secret");
    blacklistTokenModel.findOne.mockResolvedValue(null);
    userModel.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "user123",
        fullname: { firstname: "Juan", lastname: "Pérez" },
        email: "juan@test.com",
        phone: "1234567890",
        rides: [],
        socketId: null,
        emailVerified: true,
      }),
    });

    const res = await request(app)
      .get("/user/profile")
      .set("token", token);
    expect(res.statusCode).toBe(200);
  });
});

// ─── RIDER REGISTER ──────────────────────────────────────────────────────────
describe("POST /rider/register", () => {
  it("debe fallar si el email es inválido", async () => {
    const res = await request(app).post("/rider/register").send({
      email: "no-es-email",
      password: "password123",
      phone: "1234567890",
      fullname: { firstname: "Carlos" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si la contraseña tiene menos de 8 caracteres", async () => {
    const res = await request(app).post("/rider/register").send({
      email: "carlos@test.com",
      password: "123",
      phone: "1234567890",
      fullname: { firstname: "Carlos" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si el teléfono no tiene 10 dígitos", async () => {
    const res = await request(app).post("/rider/register").send({
      email: "carlos@test.com",
      password: "password123",
      phone: "123",
      fullname: { firstname: "Carlos" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si el firstname tiene menos de 3 caracteres", async () => {
    const res = await request(app).post("/rider/register").send({
      email: "carlos@test.com",
      password: "password123",
      phone: "1234567890",
      fullname: { firstname: "Ca" },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── RIDER LOGIN ─────────────────────────────────────────────────────────────
describe("POST /rider/login", () => {
  it("debe fallar si el email es inválido", async () => {
    const res = await request(app).post("/rider/login").send({
      email: "no-es-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
  });

  it("debe fallar si no se envía email", async () => {
    const res = await request(app).post("/rider/login").send({
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── RIDER RUTAS PROTEGIDAS ──────────────────────────────────────────────────
describe("GET /rider/profile (protegida)", () => {
  it("debe rechazar sin token con 401", async () => {
    blacklistTokenModel.findOne.mockResolvedValue(null);
    const res = await request(app).get("/rider/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Unauthorized User");
  });

  it("debe rechazar con token inválido con 401", async () => {
    blacklistTokenModel.findOne.mockResolvedValue(null);
    const res = await request(app)
      .get("/rider/profile")
      .set("token", "token-invalido");
    expect(res.statusCode).toBe(401);
  });

  it("debe responder 200 con token válido de rider", async () => {
    process.env.JWT_SECRET = "test-secret";
    const token = jwt.sign({ id: "rider123" }, "test-secret");
    blacklistTokenModel.findOne.mockResolvedValue(null);
    riderModel.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "rider123",
        fullname: { firstname: "Carlos", lastname: "López" },
        email: "carlos@test.com",
        phone: "1234567890",
        rides: [],
        socketId: null,
        emailVerified: true,
        vehicle: {},
        status: "active",
      }),
    });

    const res = await request(app)
      .get("/rider/profile")
      .set("token", token);
    expect(res.statusCode).toBe(200);
  });
});
