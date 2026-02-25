require("dotenv").config();
const mongoose = require("mongoose");
const Sequence = require("./models/Sequence");

async function fixLengths() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const sequences = await Sequence.find({ length: { $exists: false } });
  console.log(`Found ${sequences.length} sequences missing length`);

  for (const seq of sequences) {
    seq.length = seq.sequence.length;
    await seq.save();
  }

  console.log("All done! Lengths updated.");
  process.exit(0);
}

fixLengths();
