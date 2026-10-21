const express = require("express");
const dmRouter = express.Router();
const DMThread = require("../models/DMModel");
const Message = require("../models/ChatModel");
const { protect } = require("../middleware/authMiddleware");

const normalizeParticipants = (userAId, userBId) => {
  const ids = [String(userAId), String(userBId)].sort();
  return ids;
};

dmRouter.get("/threads", protect, async (req, res) => {
  try {
    const threads = await DMThread.find({ participants: req.user._id })
      .populate("participants", "_id username email name")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(threads);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

dmRouter.post("/thread", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const participantIds = normalizeParticipants(req.user._id, userId);
    let thread = await DMThread.findOne({
      participants: { $all: participantIds, $size: participantIds.length },
    });

    if (!thread) {
      thread = await DMThread.create({
        participants: participantIds,
      });
    }

    const populatedThread = await DMThread.findById(thread._id)
      .populate("participants", "_id username email name")
      .populate("lastMessage");

    res.status(201).json(populatedThread);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

dmRouter.get("/:threadId/messages", protect, async (req, res) => {
  try {
    const thread = await DMThread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ message: "DM thread not found" });
    }

    const isParticipant = thread.participants.some(
      (id) => id.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "Not a member of this DM thread" });
    }

    const messages = await Message.find({ dmThread: req.params.threadId })
      .populate("sender", "_id username email name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

dmRouter.post("/:threadId/message", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const thread = await DMThread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ message: "DM thread not found" });
    }

    const isParticipant = thread.participants.some(
      (id) => id.toString() === req.user._id.toString(),
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ message: "Not a member of this DM thread" });
    }

    const message = await Message.create({
      sender: req.user._id,
      content,
      conversationType: "dm",
      dmThread: thread._id,
      group: null,
    });

    thread.lastMessage = message._id;
    await thread.save();

    const populatedMessage = await Message.findById(message._id).populate(
      "sender",
      "_id username email name",
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = dmRouter;
