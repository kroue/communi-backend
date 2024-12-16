require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./UserDetails"); // Import UserDetails model

const app = express();
app.use(express.json());

// Environment variables
const mongoUrl = process.env.MONGO_URI; // MongoDB Atlas connection string
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret";
const PORT = process.env.PORT || 5001;

// Database Connection
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB Atlas Database");
}).catch((e) => {
  console.error("MongoDB connection error:", e);
});

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).send({ status: "error", data: "Access Denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ status: "error", data: "Invalid Token" });
    req.user = user;
    next();
  });
};

// Home Route
app.get("/", (req, res) => {
  res.send({ status: "ok", data: "Server Started" });
});

// Register Route
app.post('/register', async (req, res) => {
    try {
      const { firstName, lastName, email, password, idNumber, birthday, program, department, activeTab } = req.body;
  
      // Log incoming request for debugging
      console.log('Received registration data:', req.body);
  
      // Validate required fields
      if (!firstName || !lastName || !email || !password || !idNumber || !birthday) {
        return res.status(400).json({ status: 'error', message: 'All fields are required.' });
      }
  
      // Validate email format (basic)
      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ status: 'error', message: 'Invalid email format.' });
      }
  
      // Validate birthday format (must be a valid date)
      const date = new Date(birthday);
      if (isNaN(date)) {
        return res.status(400).json({ status: 'error', message: 'Invalid birthday format. Use YYYY-MM-DD.' });
      }
  
      // Validate program or department depending on activeTab
      if (activeTab === 'Student' && !program) {
        return res.status(400).json({ status: 'error', message: 'Program is required for students.' });
      }
      if (activeTab === 'Faculty' && !department) {
        return res.status(400).json({ status: 'error', message: 'Department is required for faculty.' });
      }
  
      // Create the user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        idNumber,
        birthday, // Save birthday as it is, already validated
        program: activeTab === 'Student' ? program : undefined,  // Set program only for students
        department: activeTab === 'Faculty' ? department : undefined, // Set department only for faculty
      });
  
      // Encrypt the password before saving (if needed)
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      // Save user to database
      await user.save();
  
      res.status(200).json({ status: 'ok', message: 'Registration successful' });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ status: 'error', message: 'Server error during registration' });
    }
});

// Update Profile with MBTI Type
// Update Profile with MBTI Type
app.post("/update-mbti", authenticateToken, async (req, res) => {
    const { mbtiType } = req.body;
  
    try {
      const user = await User.findOne({ username: req.user.username });
      if (!user) {
        return res.status(404).send({ status: "error", data: "User not found" });
      }
  
      // Update MBTI type
      user.mbtiType = mbtiType;
      await user.save();
  
      res.status(200).send({ status: "ok", data: "MBTI type updated" });
    } catch (error) {
      console.error("Error updating MBTI:", error);
      res.status(500).send({ status: "error", data: "Internal Server Error" });
    }
  });
  
// Update User Interests
app.post("/update-interests", authenticateToken, async (req, res) => {
    const { interests } = req.body;
  
    // Check if interests array is too large
    if (interests.length > 6) {
      return res.status(400).send({ status: "error", data: "You can select up to 6 interests only" });
    }
  
    try {
      const user = await User.findOne({ username: req.user.username });
      if (!user) {
        return res.status(404).send({ status: "error", data: "User not found" });
      }
  
      // Update the interests
      user.interests = interests;
      await user.save();
  
      res.status(200).send({ status: "ok", data: "Interests updated successfully" });
    } catch (error) {
      console.error("Error updating interests:", error);
      res.status(500).send({ status: "error", data: "Internal Server Error" });
    }
  });
  
      

// Login Route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send({ status: "error", data: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).send({ status: "error", data: "Invalid password" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET);
    res.status(200).send({ status: "ok", data: token });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send({ status: "error", data: "Internal Server Error" });
  }
});

// Get User Profile
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).send({ status: "error", data: "User not found" });
    }

    const { username, fullname, bio, address, pronouns } = user;
    res.status(200).send({
      status: "ok",
      data: { username, fullname, bio, address, pronouns },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).send({ status: "error", data: "Internal Server Error" });
  }
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
