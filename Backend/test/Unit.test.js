const jwt = require("jsonwebtoken");

const SECRET = "test-secret";

// Funciones utilitarias que replica la lógica del backend
const generateToken = (payload, secret, options = {}) => {
  return jwt.sign(payload, secret, options);
};

const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

// ─── GENERACIÓN DE TOKEN ─────────────────────────────────────────────────────
describe("JWT - Generación de token", () => {
  it("debe generar un token válido", () => {
    const token = generateToken({ id: "user123" }, SECRET);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // header.payload.signature
  });

  it("debe incluir el payload en el token", () => {
    const token = generateToken({ id: "user123", email: "test@test.com" }, SECRET);
    const decoded = jwt.decode(token);
    expect(decoded.id).toBe("user123");
    expect(decoded.email).toBe("test@test.com");
  });

  it("debe generar tokens distintos para distintos payloads", () => {
    const token1 = generateToken({ id: "user1" }, SECRET);
    const token2 = generateToken({ id: "user2" }, SECRET);
    expect(token1).not.toBe(token2);
  });
});

// ─── VERIFICACIÓN DE TOKEN ───────────────────────────────────────────────────
describe("JWT - Verificación de token", () => {
  it("debe verificar un token válido correctamente", () => {
    const token = generateToken({ id: "user123" }, SECRET);
    const decoded = verifyToken(token, SECRET);
    expect(decoded.id).toBe("user123");
  });

  it("debe lanzar error con secret incorrecto", () => {
    const token = generateToken({ id: "user123" }, SECRET);
    expect(() => verifyToken(token, "secret-incorrecto")).toThrow(
      "invalid signature"
    );
  });

  it("debe lanzar error con token malformado", () => {
    expect(() => verifyToken("token.invalido.xxx", SECRET)).toThrow();
  });

  it("debe lanzar error con token vacío", () => {
    expect(() => verifyToken("", SECRET)).toThrow();
  });
});

// ─── TOKEN EXPIRADO ──────────────────────────────────────────────────────────
describe("JWT - Token expirado", () => {
  it("debe lanzar error jwt expired cuando el token expira", () => {
    const token = generateToken({ id: "user123" }, SECRET, { expiresIn: "1ms" });
    return new Promise((resolve) => setTimeout(resolve, 10)).then(() => {
      expect(() => verifyToken(token, SECRET)).toThrow("jwt expired");
    });
  });

  it("debe ser válido antes de expirar", () => {
    const token = generateToken({ id: "user123" }, SECRET, { expiresIn: "1h" });
    const decoded = verifyToken(token, SECRET);
    expect(decoded.id).toBe("user123");
  });
});

// ─── ESTRUCTURA DEL TOKEN ────────────────────────────────────────────────────
describe("JWT - Estructura del token", () => {
  it("debe contener iat (issued at) automáticamente", () => {
    const token = generateToken({ id: "user123" }, SECRET);
    const decoded = jwt.decode(token);
    expect(decoded.iat).toBeDefined();
  });

  it("debe contener exp cuando se especifica expiresIn", () => {
    const token = generateToken({ id: "user123" }, SECRET, { expiresIn: "1h" });
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it("no debe contener exp si no se especifica expiresIn", () => {
    const token = generateToken({ id: "user123" }, SECRET);
    const decoded = jwt.decode(token);
    expect(decoded.exp).toBeUndefined();
  });
});
