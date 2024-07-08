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
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// PostgreSQL Client
const client = new Client({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

client.connect();

// Twilio Client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Function to format phone number to E.164
function formatPhoneNumber(phone) {
  // Example: For India, prepend country code +91 if not present
  if (!phone.startsWith('+')) {
    phone = '+91' + phone;
  }
  return phone;
}

// Routes
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

app.put("/update", async (req, res) => {
  const { id, name, phone, email } = req.body;

  try {
    const query = 'UPDATE contacts SET name = $1, phone = $2, email = $3 WHERE id = $4';
    await client.query(query, [name, phone, email, id]);
    res.status(200).send('Contact updated successfully.');
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).send('Failed to update contact.');
  }
});

app.delete("/delete", async (req, res) => {
  const { id } = req.body;

  try {
    const query = 'DELETE FROM contacts WHERE id = $1';
    await client.query(query, [id]);
    res.status(200).send('Contact deleted successfully.');
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).send('Failed to delete contact.');
  }
});

app.post("/sendEmergencyAlert", async (req, res) => {
  const { message } = req.body;

  try {
    // Fetch all contacts from the database
    const result = await client.query('SELECT phone FROM contacts');
    const contacts = result.rows;

    // Send SMS to each contact
    const sendMessages = contacts.map(contact => {
      const formattedPhone = formatPhoneNumber(contact.phone);
      return twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      }).catch(error => {
        if (error.code === 21608 || error.code === 21408) {
          console.error(`Error sending SMS to ${formattedPhone}: ${error.message}`);
        } else {
          throw error;
        }
      });
    });

    await Promise.all(sendMessages);
    res.status(200).send('SOS messages sent successfully.');
  } catch (error) {
    console.error('Error sending SOS messages:', error);
    res.status(500).send('Failed to send SOS messages.');
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
