const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const { attachUser } = require("./src/auth");
const authRoutes = require("./src/routes/auth");
const doctorRoutes = require("./src/routes/doctors");
const appointmentRoutes = require("./src/routes/appointments");
const proRoutes = require("./src/routes/pro");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(attachUser);

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/pro", proRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Tabib.dz backend démarré sur http://localhost:${PORT}`);
  console.log(`Compte patient de démo : patient@demo.dz / demo1234`);
  console.log(`Compte médecin de démo : yacine.belkacem@tabib.dz / demo1234`);
});
