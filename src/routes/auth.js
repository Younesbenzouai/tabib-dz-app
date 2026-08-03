const express = require("express");
const router = express.Router();
const db = require("../db");
const auth = require("../auth");

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { email, password, fullName, phone, role } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: "Email, mot de passe et nom complet sont requis." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
  }
  const users = db.all("users");
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
  }

  const finalRole = role === "doctor" ? "doctor" : "patient";
  const user = db.insert("users", {
    role: finalRole,
    email,
    passwordHash: auth.hashPassword(password),
    fullName,
    phone: phone || ""
  });

  // Si c'est un médecin, on crée aussi sa fiche pro (à compléter ensuite)
  if (finalRole === "doctor") {
    db.insert("doctors", {
      userId: user.id,
      name: fullName,
      spec: "À préciser",
      ville: "À préciser",
      addr: "",
      price: "",
      tele: false,
      rating: 0,
      reviews: 0,
      init: fullName.split(" ").slice(-1)[0].slice(0, 2).toUpperCase()
    });
  }

  auth.setAuthCookie(res, user);
  res.status(201).json({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.all("users").find((u) => u.email.toLowerCase() === (email || "").toLowerCase());
  if (!user || !auth.verifyPassword(password || "", user.passwordHash)) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect." });
  }
  auth.setAuthCookie(res, user);
  res.json({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  auth.clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non authentifié" });
  res.json(req.user);
});

module.exports = router;
