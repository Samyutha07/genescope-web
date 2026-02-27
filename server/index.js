require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");

const Sequence = require("./models/Sequence");

const app = express();
app.use(cors());
app.use(express.json());

/* ============================= */
/* MongoDB Setup                 */
/* ============================= */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* ============================= */
/* Upload Route                  */
/* ============================= */

const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileContent = req.file.buffer.toString();
    const entries = fileContent.split(">").filter(Boolean);

    if (entries.length === 0) {
      return res.status(400).json({ message: "No valid FASTA entries found" });
    }

    const sequences = entries.map((entry) => {
      const lines = entry.split("\n");
      const header = lines[0].trim();
      const sequence = lines.slice(1).join("").replace(/\s+/g, "");
      return { header, sequence, length: sequence.length };
    });

    // Filter out any entries with empty sequences
    const valid = sequences.filter((s) => s.sequence.length > 0);

    await Sequence.insertMany(valid);

    res.json({
      message: `Parsed and stored ${valid.length} sequence(s) successfully`,
      count: valid.length,
      sequences: valid.slice(0, 3),
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

/* ============================= */
/* Sequences Route (paginated)   */
/* ============================= */

app.get("/sequences", async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = search
      ? { header: { $regex: search, $options: "i" } }
      : {};

    const [total, sequences] = await Promise.all([
      Sequence.countDocuments(query),
      Sequence.find(query).skip(skip).limit(limit).sort({ _id: -1 }),
    ]);

    res.json({
      sequences,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    console.error("Sequences fetch error:", err);
    res.status(500).json({ message: "Error fetching sequences" });
  }
});

/* ============================= */
/* Single Sequence Route         */
/* ============================= */

app.get("/sequences/:id", async (req, res) => {
  try {
    const sequence = await Sequence.findById(req.params.id);
    if (!sequence) {
      return res.status(404).json({ message: "Sequence not found" });
    }
    res.json(sequence);
  } catch (err) {
    console.error("Sequence fetch error:", err);
    res.status(500).json({ message: "Error fetching sequence" });
  }
});

/* ============================= */
/* Delete Sequence               */
/* ============================= */

app.delete("/sequences/:id", async (req, res) => {
  try {
    const sequence = await Sequence.findByIdAndDelete(req.params.id);
    if (!sequence) {
      return res.status(404).json({ message: "Sequence not found" });
    }
    res.json({ message: "Sequence deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting sequence" });
  }
});

/* ============================= */
/* BLAST Submit                  */
/* ============================= */

app.post("/blast", async (req, res) => {
  try {
    const { sequence } = req.body;

    if (!sequence || typeof sequence !== "string" || sequence.trim() === "") {
      return res.status(400).json({ message: "A valid sequence string is required" });
    }

    const params = new URLSearchParams({
      CMD: "Put",
      PROGRAM: "blastn",
      DATABASE: "nt",
      QUERY: sequence.trim(),
      FORMAT_TYPE: "Text",
    });

    const response = await axios.post(
      "https://blast.ncbi.nlm.nih.gov/Blast.cgi",
      params.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 30000,
      }
    );

    const ridMatch = response.data.match(/RID = ([A-Z0-9]+)/);
    const rtoeMatch = response.data.match(/RTOE = (\d+)/);

    if (!ridMatch) {
      return res.status(500).json({ message: "Failed to extract RID from BLAST response" });
    }

    res.json({
      rid: ridMatch[1],
      estimatedTime: rtoeMatch ? parseInt(rtoeMatch[1]) : 30,
    });
  } catch (err) {
    console.error("BLAST submit error:", err.message);
    res.status(500).json({ message: "BLAST submission failed", error: err.message });
  }
});

/* ============================= */
/* BLAST Status / Results        */
/* ============================= */

app.get("/blast/:rid", async (req, res) => {
  try {
    const { rid } = req.params;

    if (!/^[A-Z0-9]+$/.test(rid)) {
      return res.status(400).json({ message: "Invalid RID format" });
    }

    const params = new URLSearchParams({
      CMD: "Get",
      RID: rid,
      FORMAT_TYPE: "Text",
    });

    const response = await axios.get("https://blast.ncbi.nlm.nih.gov/Blast.cgi", {
      params: { CMD: "Get", RID: rid, FORMAT_TYPE: "Text" },
      timeout: 30000,
    });

    const data = response.data;

    let status = "UNKNOWN";
    if (data.includes("Status=READY")) status = "READY";
    else if (data.includes("Status=WAITING")) status = "WAITING";
    else if (data.includes("Status=FAILED")) status = "FAILED";
    else if (data.includes("Status=UNKNOWN")) status = "UNKNOWN";

    res.json({
      status,
      result: status === "READY" ? data : null,
    });
  } catch (err) {
    console.error("BLAST status error:", err.message);
    res.status(500).json({ message: "BLAST status check failed", error: err.message });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const total = await Sequence.countDocuments();

    const lengthStats = await Sequence.aggregate([
      { $match: { length: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgLength: { $avg: "$length" },
          minLength: { $min: "$length" },
          maxLength: { $max: "$length" },
        },
      },
    ]);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
    twoWeeksAgo.setHours(0, 0, 0, 0);

    const uploadsByDay = await Sequence.aggregate([
      { $match: { uploadedAt: { $gte: twoWeeksAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$uploadedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const lengthBuckets = await Sequence.aggregate([
      { $match: { length: { $exists: true, $gt: 0 } } },
      {
        $bucket: {
          groupBy: "$length",
          boundaries: [0, 500, 1000, 2000, 5000, 10000, 50000],
          default: "50000+",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const stats = lengthStats[0] || { avgLength: 0, minLength: 0, maxLength: 0 };

    res.json({
      total,
      avgLength: Math.round(stats.avgLength || 0),
      minLength: stats.minLength || 0,
      maxLength: stats.maxLength || 0,
      uploadsByDay,
      lengthBuckets,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Error fetching stats" });
  }
});

app.delete("/sequences/:id", async (req, res) => {
  try {
    const sequence = await Sequence.findByIdAndDelete(req.params.id);
    if (!sequence) {
      return res.status(404).json({ message: "Sequence not found" });
    }
    res.json({ message: "Sequence deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting sequence" });
  }
});

/* ============================= */

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});