// src/db.js
// Couche de persistance. Utilise un fichier JSON comme base de données.
// Toutes les écritures sont synchrones et immédiatement persistées sur disque,
// donc les rendez-vous survivent à un redémarrage du serveur.
// (Pour une mise en production réelle, remplacer par PostgreSQL / MySQL.)

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

let cache = null;

function load() {
  if (cache) return cache;
  if (!fs.existsSync(DB_PATH)) {
    cache = seed();
    save();
  } else {
    cache = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  }
  return cache;
}

function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), "utf-8");
}

function nextId(collection) {
  return collection.length ? Math.max(...collection.map((x) => x.id)) + 1 : 1;
}

function dayKey(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function seed() {
  const passwordHash = bcrypt.hashSync("demo1234", 8);

  const doctorSeeds = [
    { name: "Dr. Yacine Belkacem", spec: "Cardiologue", ville: "Alger", addr: "12 rue Didouche Mourad, Alger", price: "3000 DA", tele: true, rating: 4.8, reviews: 126, email: "yacine.belkacem@tabib.dz" },
    { name: "Dr. Amina Cherif", spec: "Dermatologue", ville: "Oran", addr: "8 bd Front de Mer, Oran", price: "2500 DA", tele: false, rating: 4.6, reviews: 84, email: "amina.cherif@tabib.dz" },
    { name: "Dr. Karim Bouzid", spec: "Généraliste", ville: "Constantine", addr: "Cité Boussouf, Constantine", price: "2000 DA", tele: true, rating: 4.9, reviews: 203, email: "karim.bouzid@tabib.dz" },
    { name: "Dr. Nadia Haddad", spec: "Pédiatre", ville: "Alger", addr: "22 rue Larbi Ben M'hidi, Alger", price: "2800 DA", tele: true, rating: 4.7, reviews: 97, email: "nadia.haddad@tabib.dz" },
    { name: "Dr. Sofiane Meziane", spec: "Dentiste", ville: "Annaba", addr: "Rue Ibn Khaldoun, Annaba", price: "2200 DA", tele: false, rating: 4.5, reviews: 61, email: "sofiane.meziane@tabib.dz" }
  ];

  const users = [];
  const doctors = [];
  const availability = [];

  doctorSeeds.forEach((d, i) => {
    const userId = i + 1;
    users.push({
      id: userId,
      role: "doctor",
      email: d.email,
      passwordHash,
      fullName: d.name,
      phone: "05 55 00 00 0" + userId
    });
    const doctorId = i + 1;
    doctors.push({
      id: doctorId,
      userId,
      name: d.name,
      spec: d.spec,
      ville: d.ville,
      addr: d.addr,
      price: d.price,
      tele: d.tele,
      rating: d.rating,
      reviews: d.reviews,
      init: d.name.split(" ").slice(-1)[0].slice(0, 2).toUpperCase()
    });

    // generate 6 days of availability, a few slots per day
    for (let dayOffset = 0; dayOffset < 6; dayOffset++) {
      const seedVal = (doctorId * 7 + dayOffset * 3) % 5;
      if (seedVal === 0) continue; // day off
      const base = 9 + ((doctorId + dayOffset) % 4) * 2;
      const count = 2 + (seedVal % 3);
      for (let t = 0; t < count; t++) {
        const h = base + t;
        const time = (h < 10 ? "0" + h : h) + ":" + (t % 2 === 0 ? "00" : "30");
        availability.push({
          id: availability.length + 1,
          doctorId,
          date: dayKey(dayOffset),
          time,
          status: "open" // 'open' | 'blocked' | 'booked'
        });
      }
    }
  });

  // demo patient account: patient@demo.dz / demo1234
  users.push({
    id: nextId(users),
    role: "patient",
    email: "patient@demo.dz",
    passwordHash,
    fullName: "Patient Démo",
    phone: "05 55 12 34 56"
  });

  return { users, doctors, availability, appointments: [] };
}

// ---------- generic helpers ----------
function all(collection) {
  return load()[collection];
}
function insert(collection, obj) {
  const db = load();
  obj.id = nextId(db[collection]);
  db[collection].push(obj);
  save();
  return obj;
}
function update(collection, id, patch) {
  const db = load();
  const item = db[collection].find((x) => x.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  save();
  return item;
}
function findById(collection, id) {
  return load()[collection].find((x) => x.id === id) || null;
}

module.exports = { load, save, all, insert, update, findById, nextId };
