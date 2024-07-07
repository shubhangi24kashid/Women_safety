import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import bodyParser from "body-parser";

const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.static('public'));
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'safety',
  password: 'Shubhangi@24',
  port: 5432,
});

client.connect();

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// Serve contacts.html
app.get("/contacts", (req, res) => {
  res.sendFile(__dirname + "/public/contacts.html");
});

// Add a new endpoint to handle SOS
app.post("/sendEmergencyAlert", async (req, res) => {
  const { message } = req.body;

  try {
    // Implement your logic to send emergency alerts here (e.g., SMS, emails)
    console.log('Emergency alert message:', message);

    // Placeholder response
    res.status(200).send('Emergency alert sent successfully.');
  } catch (error) {
    console.error('Error sending emergency alert:', error);
    res.status(500).send('Failed to send emergency alert.');
  }
});

// Endpoint to add a contact
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

// Endpoint to fetch all contacts
app.get("/contacts-data", async (req, res) => {
  try {
    const result = await client.query('SELECT id, name, phone, email FROM contacts');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).send('Failed to fetch contacts.');
  }
});

// Endpoint to update a contact
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

// Endpoint to delete a contact
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

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
