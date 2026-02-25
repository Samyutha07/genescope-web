const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema({
  header: {
    type: String,
    required: true,
    index: true,
  },
  sequence: {
    type: String,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Text index for fast header searching
sequenceSchema.index({ header: "text" });

module.exports = mongoose.model("Sequence", sequenceSchema);