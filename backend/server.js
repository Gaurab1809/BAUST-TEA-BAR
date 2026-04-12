import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { initDb } from './db.js';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'baust-tea-secret-super-secure-key-2026';

let db;
let transporter;
let ethAccount;

async function bootstrap() {
  db = await initDb();
  
  // Create Ethereal email account for testing emails without credentials
  ethAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: ethAccount.smtp.host,
    port: ethAccount.smtp.port,
    secure: ethAccount.smtp.secure,
    auth: {
      user: ethAccount.user,
      pass: ethAccount.pass,
    },
  });
  
  console.log("Email Transporter ready. Emails will be logged to Ethereal.");

  // Insert Default Admin if not exists
  const count = await db.get(`SELECT COUNT(*) as count FROM users`);
  if (count.count === 0) {
     const hash = await bcrypt.hash("admin123", 10);
     await db.run(
       `INSERT INTO users (id, name, email, designation, department, phone, role, passwordHash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
       ['admin', 'Admin', 'admin@baust.edu.bd', 'System Administrator', 'Administration', '+880-1700-000000', 'admin', hash]
     );
  }

  app.listen(3000, '127.0.0.1', () => {
    console.log('Backend server running on http://127.0.0.1:3000');
  });
}


bootstrap();
