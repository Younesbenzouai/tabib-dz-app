const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireAuth } = require("../auth");

function doctorForUser(userId) {
  return db.all("doctors").find((d) => d.userId === userId);
}

// GET /api/pro/me -> fiche médecin du compte connecté
router.get("/me", requireAuth("doctor"), (req, res) => {
  const doctor = doctorForUser(req.user.id);
  if (!doctor) return res.status(404).json({ error: "Fiche médecin introuvable" });
  res.json(doctor);
});

// PATCH /api/pro/me -> mise à jour de la fiche (spécialité, ville, adresse, tarif...)
router.patch("/me", requireAuth("doctor"), (req, res) => {
  const doctor = doctorForUser(req.user.id);
  if (!doctor) return res.status(404).json({ error: "Fiche médecin introuvable" });
  const { spec, ville, addr, price, tele } = req.body;
  const updated = db.update("doctors", doctor.id, {
    ...(spec !== undefined ? { spec } : {}),
    ...(ville !== undefined ? { ville } : {}),
    ...(addr !== undefined ? { addr } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(tele !== undefined ? { tele: !!tele } : {})
  });
  res.json(updated);
});

// GET /api/pro/appointments -> tous les RDV du médecin connecté, avec infos patient
router.get("/appointments", requireAuth("doctor"), (req, res) => {
  const doctor = doctorForUser(req.user.id);
  if (!doctor) return res.status(404).json({ error: "Fiche médecin introuvable" });
  const users = db.all("users");
  const appts = db
    .all("appointments")
    .filter((a) => a.doctorId === doctor.id && a.status !== "cancelled")
    .map((a) => {
      const patient = users.find((u) => u.id === a.patientId);
      return { ...a, patientName: patient ? patient.fullName : "Patient", patientPhone: patient ? patient.phone : "" };
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(appts);
});

// PATCH /api/pro/appointments/:id -> marquer vu / annuler côté médecin
router.patch("/appointments/:id", requireAuth("doctor"), (req, res) => {
  const doctor = doctorForUser(req.user.id);
  const appt = db.findById("appointments", parseInt(req.params.id));
  if (!appt || appt.doctorId !== doctor.id) return res.status(404).json({ error: "Introuvable" });

  db.update("appointments", appt.id, { status: req.body.status });
  if (req.body.status === "cancelled") {
    const slot = db
      .all("availability")
      .find((s) => s.doctorId === appt.doctorId && s.date === appt.date && s.time === appt.time);
    if (slot) db.update("availability", slot.id, { status: "open" });
  }
  res.json(db.findById("appointments", appt.id));
});

// GET /api/pro/availability -> agenda complet (ouverts/bloqués/pris) du médecin connecté
router.get("/availability", requireAuth("doctor"), (req, res) => {
  const doctor = doctorForUser(req.user.id);
  if (!doctor) return res.status(404).json({ error: "Fiche médecin introuvable" });
  res.json(db.all("availability").filter((s) => s.doctorId === doctor.id));
});

// POST /api/pro/availability/toggle -> ouvrir/fermer un créneau (impossible si déjà pris)
router.post("/availability/toggle", requireAuth("doctor"), (req, res) => {
  const doctor = doctorForUser(req.user.id);
  const { date, time } = req.body;
  let slot = db.all("availability").find((s) => s.doctorId === doctor.id && s.date === date && s.time === time);

  if (!slot) {
    slot = db.insert("availability", { doctorId: doctor.id, date, time, status: "open" });
    return res.json(slot);
  }
  if (slot.status === "booked") {
    return res.status(409).json({ error: "Ce créneau est déjà réservé par un patient." });
  }
  const newStatus = slot.status === "open" ? "blocked" : "open";
  res.json(db.update("availability", slot.id, { status: newStatus }));
});

module.exports = router;
