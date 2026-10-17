const mongoose = require("mongoose");

const dmThreadSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

dmThreadSchema.index({ participants: 1 });

const DMThread = mongoose.model("DMThread", dmThreadSchema);

module.exports = DMThread;
