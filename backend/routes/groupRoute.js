const express = require("express");
const groupRouter = express.Router();
const Group = require("../models/GroupModel");
const Message = require("../models/ChatModel");
const { protect } = require("../middleware/authMiddleware");

const populateGroup = (query) =>
  query
    .populate("admin", "username email")
    .populate("members", "username email");

const ensureAdmin = (group, userId) => {
  if (!group || !group.admin) {
    throw new Error("Group not found");
  }

  if (group.admin.toString() !== userId.toString()) {
    throw new Error("Only the group admin can perform this action");
  }
};

groupRouter.post("/", protect, async (req, res) => {
  const { name, description } = req.body;
  try {
    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
    });
    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

groupRouter.get("/", protect, async (req, res) => {
  try {
    const groups = await populateGroup(Group.find());
    res.json(groups);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

groupRouter.post("/:id/invite", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    ensureAdmin(group, req.user._id);

    const alreadyMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "User is already a member" });
    }

    group.members.push(userId);
    await group.save();

    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(403).json({ message: error.message || "Not authorized" });
  }
});

groupRouter.post("/:id/remove-member", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    ensureAdmin(group, req.user._id);

    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ message: "Admin cannot be removed" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    if (!isMember) {
      return res.status(404).json({ message: "Member not found in the group" });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId.toString(),
    );
    await group.save();

    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(403).json({ message: error.message || "Not authorized" });
  }
});

groupRouter.post("/:id/promote-admin", protect, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    ensureAdmin(group, req.user._id);

    if (group.admin.toString() === userId.toString()) {
      return res.status(400).json({ message: "User is already the admin" });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString(),
    );
    if (!isMember) {
      return res
        .status(404)
        .json({ message: "User is not a member of the group" });
    }

    group.admin = userId;
    await group.save();

    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(403).json({ message: error.message || "Not authorized" });
  }
});

groupRouter.put("/:id/rename", protect, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    ensureAdmin(group, req.user._id);

    group.name = name.trim();
    if (description !== undefined) {
      group.description = description.trim();
    }

    await group.save();

    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(403).json({ message: error.message || "Not authorized" });
  }
});

groupRouter.delete("/:id", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    ensureAdmin(group, req.user._id);

    await Message.deleteMany({ group: group._id, conversationType: "group" });
    await Group.deleteOne({ _id: group._id });

    res.json({ message: "Group deleted successfully", groupId: group._id });
  } catch (error) {
    res.status(403).json({ message: error.message || "Not authorized" });
  }
});

groupRouter.post("/:id/join", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Already a member of the group" });
    }
    group.members.push(req.user._id);
    await group.save();
    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

groupRouter.post("/:id/leave", protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Not a member of the group" });
    }
    group.members = group.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString(),
    );
    if (
      group.admin.toString() === req.user._id.toString() &&
      group.members.length
    ) {
      group.admin = group.members[0];
    }
    await group.save();
    const populatedGroup = await populateGroup(Group.findById(group._id));
    res.json(populatedGroup);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = groupRouter;
