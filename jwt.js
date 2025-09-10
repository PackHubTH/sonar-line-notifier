import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

// Secret key (store securely, e.g. env var)
const SECRET = process.env.JWT_SECRET || "";

const payload = {
  url: process.env.SONARQUBE_URL || "",
  iat: Math.floor(Date.now() / 1000) // issued at
};

// Sign token
const token = jwt.sign(payload, SECRET, { expiresIn: "90d" });

console.log("JWT:", token);
