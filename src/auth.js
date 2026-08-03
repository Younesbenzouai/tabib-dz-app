// src/auth.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// En production: mettre cette clé dans une variable d'environnement, jamais dans le code.
const JWT_SECRET = process.env.JWT_SECRET || "tabib-dz-dev-secret-change-me";
const COOKIE_NAME = "tabib_token";

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 8);
}
function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, user) {
  const token = signToken(user);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}
function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

function readUserFromRequest(req) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Middleware: attache req.user si connecté (sans bloquer si absent)
function attachUser(req, res, next) {
  req.user = readUserFromRequest(req);
  next();
}

// Middleware: exige d'être connecté, optionnellement avec un rôle précis
function requireAuth(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Non authentifié" });
    if (role && req.user.role !== role) {
      return res.status(403).json({ error: "Accès réservé aux comptes " + role });
    }
    next();
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  setAuthCookie,
  clearAuthCookie,
  attachUser,
  requireAuth
};
