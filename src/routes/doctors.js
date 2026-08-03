const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/doctors?spec=Cardiologue&ville=Alger
router.get("/", (req, res) => {
  const { spec, ville } = req.query;
  let doctors = db.all("doctors");
  if (spec && spec !== "Toutes spécialités") {
    doctors = doctors.filter((d) => d.spec === spec);
  }
  if (ville && ville !== "Toute l'Algérie") {
    doctors = doctors.filter((d) => d.ville === ville);
  }
  res.json(doctors);
});

// GET /api/doctors/:id
router.get("/:id", (req, res) => {
  const doctor = db.findById("doctors", parseInt(req.params.id));
  if (!doctor) return res.status(404).json({ error: "Médecin introuvable" });
  res.json(doctor);
});

// GET /api/doctors/:id/availability  -> créneaux ouverts (non pris) des 6 prochains jours
router.get("/:id/availability", (req, res) => {
  const doctorId = parseInt(req.params.id);
  const slots = db.all("availability").filter((s) => s.doctorId === doctorId);
  res.json(slots);
});

module.exports = router;
