import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import bodyParser from "body-parser";
import twilio from "twilio";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static('public'));
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const client = new Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

client.connect();

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/contacts", (req, res) => {
  res.sendFile(__dirname + "/public/contacts.html");
});

app.post("/submit", async (req, res) => {
  const { name, phone, email } = req.body;

  try {
    const query = 'INSERT INTO contacts (name, phone, email) VALUES ($1, $2, $3)';
    await client.query(query, [name, phone, email]);
    res.status(200).send('Contact added successfully.');
  } catch (error) {
    console.error('Error adding contact:', error);
    res.status(500).send('Failed to add contact.');
  }
});

app.get("/contacts-data", async (req, res) => {
  try {
    const result = await client.query('SELECT id, name, phone, email FROM contacts');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).send('Failed to fetch contacts.');
  }
});

app.put
