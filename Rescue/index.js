// Import required modules
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
import pkg from "pg";
import bodyParser from "body-parser";
import twilio from "twilio";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";

// Load environment variables from .env file
dotenv.config();

const { Client } = pkg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

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
  if (!phone.startsWith("+")) {
    phone = "+91" + phone; // Example for India
  }
  return phone;
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login.html");
  }
}

// Routes
// Serve the landing page (index.html) by default
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    res.sendFile(__dirname + "/public/index.html");
  }
});

// User signup
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *";
    const result = await client.query(query, [name, email, hashedPassword]);

    req.session.user = result.rows[0];
    console.log("User signed up:", result.rows[0]);

    res.status(200).redirect("/home.html");
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).send("Failed to sign up.");
  }
});

// User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await client.query(query, [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        req.session.user = user;
        console.log("User logged in:", user);

        res.status(200).redirect("/home.html");
      } else {
        console.log("Invalid password for email:", email);
        res.status(401).send("Invalid credentials.");
      }
    } else {
      console.log("User not found with email:", email);
      res.status(404).send("User not found.");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Failed to log in.");
  }
});

// Route to serve the home page, accessible only to authenticated users
app.get("/home", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/home.html");
});

// Route to serve the community page
app.get("/community", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/community.html");
});

// Other routes
app.get("/contacts", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/contacts.html");
});

app.post("/submit", isAuthenticated, async (req, res) => {
  const { name, phone, email } = req.body;
  const userId = req.session.user.id;

  try {
    const query = "INSERT INTO contacts (user_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id";
    const result = await client.query(query, [userId, name, phone, email]);

    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    console.error("Error adding contact:", error);
    res.status(500).send("Failed to add contact.");
  }
});

app.get("/contacts-data", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const result = await client.query("SELECT id, name, phone, email FROM contacts WHERE user_id = $1", [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).send("Failed to fetch contacts.");
  }
});

app.put("/update", isAuthenticated, async (req, res) => {
  const { id, name, phone, email } = req.body;

  try {
    const query = "UPDATE contacts SET name = $1, phone = $2, email = $3 WHERE id = $4";
    await client.query(query, [name, phone, email, id]);
    res.status(200).send("Contact updated successfully.");
  } catch (error) {
    console.error("Error updating contact:", error);
    res.status(500).send("Failed to update contact.");
  }
});

app.delete("/delete", isAuthenticated, async (req, res) => {
  const { id } = req.body;

  try {
    const query = "DELETE FROM contacts WHERE id = $1";
    await client.query(query, [id]);
    res.status(200).send("Contact deleted successfully.");
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).send("Failed to delete contact.");
  }
});

// Route to fetch all blogs
app.get('/getBlogs', async (req, res) => {
  try {
    const result = await client.query('SELECT title, content FROM blogs ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).send('Failed to fetch blogs.');
  }
});

// Send emergency alert
app.post("/sendEmergencyAlert", isAuthenticated, async (req, res) => {
  const { message } = req.body;

  try {
    const result = await client.query("SELECT phone FROM contacts WHERE user_id = $1", [req.session.user.id]);
    const contacts = result.rows;

    const sendMessages = contacts.map((contact) => {
      const formattedPhone = formatPhoneNumber(contact.phone);
      return twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      }).catch((error) => {
        if (error.code === 21608 || error.code === 21408) {
          console.error(`Error sending SMS to ${formattedPhone}: ${error.message}`);
        } else {
          throw error;
        }
      });
    });

    await Promise.all(sendMessages);
    res.status(200).send("SOS messages sent successfully.");
  } catch (error) {
    console.error("Error sending SOS messages:", error);
    res.status(500).send("Failed to send SOS messages.");
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
      res.status(500).send("Failed to logout.");
    } else {
      res.redirect("/login.html");
    }
  });
});

// Initialize HTTP server and Socket.IO for real-time communication
const server = http.createServer(app);
const io = new Server(server);

// Handle socket connections for the community chat feature
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle chat message event
  socket.on('chatMessage', (msg) => {
    console.log('Message received:', msg);
    io.emit('chatMessage', msg); // Broadcast message to all connected clients
  });

  // Handle typing event
  socket.on('typing', (user) => {
    socket.broadcast.emit('typing', user); // Notify others that a user is typing
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
