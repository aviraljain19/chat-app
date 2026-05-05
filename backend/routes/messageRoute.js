const express = require("express");
const messageRouter = express.Router();
const Message = require("../models/ChatModel");
const { protect } = require("../middleware/authMiddleware");

messageRouter.post("/", protect, async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const message = await Message.create({
      content,
      sender: req.user._id,
      group: groupId,
    });
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "username email")
      .populate("group", "name");
    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

messageRouter.get("/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({ group: req.params.groupId })
      .populate("sender", "username email")
      .populate("group", "name")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = messageRouter;
