const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const WalletAddress = require("./modals/walletAddress");

const app = express();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 1. Check/Create Wallet
app.post("/api/wallet", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Check if wallet exists
    let wallet = await WalletAddress.findOne({
      address: address.toLowerCase(),
    });

    // If wallet doesn't exist, create new one
    if (!wallet) {
      wallet = await WalletAddress.create({
        address: address.toLowerCase(),
        points: 0,
      });
    }

    res.json(wallet);
  } catch (error) {
    console.error("Error handling wallet:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2. Update Points after Successful Swap
app.post("/api/points/add", async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    // Find wallet and increment points
    const wallet = await WalletAddress.findOneAndUpdate(
      { address: address.toLowerCase() },
      { $inc: { points: 10 } }, // Increment points by 10
      { new: true } // Return updated document
    );

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json(wallet);
  } catch (error) {
    console.error("Error updating points:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Get Wallet Points
app.get("/api/points/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const wallet = await WalletAddress.findOne({
      address: address.toLowerCase(),
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({ points: wallet.points });
  } catch (error) {
    console.error("Error fetching points:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
