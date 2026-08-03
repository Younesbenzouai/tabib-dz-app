const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireAuth } = require("../auth");

// POST /api/appointments  (patient connecté)  { doctorId, date, time, type, reason }
router.post("/", requireAuth("patient"), (req, res) => {
  const { doctorId, date, time, type, reason } = req.body;
  const slot = db
    .all("availability")
    .find((s) => s.doctorId === parseInt(doctorId) && s.date === date && s.time === time);

  if (!slot) return res.status(404).json({ error: "Ce créneau n'existe pas." });
  if (slot.status !== "open") return res.status(409).json({ error: "Ce créneau n'est plus disponible." });

  db.update("availability", slot.id, { status: "booked" });

  const appt = db.insert("appointments", {
    doctorId: parseInt(doctorId),
    patientId: req.user.id,
    date,
    time,
    type: type === "tele" ? "tele" : "cabinet",
    reason: reason || "",
    status: "confirmed",
    createdAt: new Date().toISOString()
  });

  res.status(201).json(appt);
});

// GET /api/appointments/me  (patient connecté) -> ses rendez-vous, avec infos médecin
router.get("/me", requireAuth("patient"), (req, res) => {
  const appts = db.all("appointments").filter((a) => a.patientId === req.user.id);
  const doctors = db.all("doctors");
  const enriched = appts
    .map((a) => ({ ...a, doctor: doctors.find((d) => d.id === a.doctorId) }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(enriched);
});

// PATCH /api/appointments/:id  (patient connecté, annulation)
router.patch("/:id", requireAuth("patient"), (req, res) => {
  const appt = db.findById("appointments", parseInt(req.params.id));
  if (!appt || appt.patientId !== req.user.id) return res.status(404).json({ error: "Introuvable" });

  if (req.body.status === "cancelled") {
    db.update("appointments", appt.id, { status: "cancelled" });
    const slot = db
      .all("availability")
      .find((s) => s.doctorId === appt.doctorId && s.date === appt.date && s.time === appt.time);
    if (slot) db.update("availability", slot.id, { status: "open" });
  }
  res.json(db.findById("appointments", appt.id));
});

module.exports = router;
