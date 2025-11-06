require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");

const userRoutes = require("./Routes/user");
const offerRoutes = require("./Routes/offer");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.get("/", (req, res) => {
  res.json({ message: "route /", method: "GET" });
});

app.use(userRoutes);
app.use(offerRoutes);

app.all(/.*/, (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(process.env.PORT, () => {
  console.log(`Server has started on port ${process.env.PORT}`);
});
