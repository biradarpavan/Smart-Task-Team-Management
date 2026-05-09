const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const multer = require('multer');

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});
const upload = multer({ storage });

// @route   GET /api/tasks
// @desc    Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const { projectId } = req.query;
    let query = {};
    if (projectId === 'null') {
      query.project = null;
    } else if (projectId && projectId !== 'All') {
      query.project = projectId;
    }
    const tasks = await Task.find(query)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assignee, attachment, project } = req.body;
    const requesterId = req.user.id || req.user._id;

    const newTask = new Task({
      title,
      description,
      status: status || 'To Do',
      priority,
      dueDate,
      assignee: assignee || null,
      attachment: attachment || '',
      createdBy: requesterId,
      project: project || null
    });

    const task = await newTask.save();
    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name');

    req.io.emit('task_updated');
    res.json(populatedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task (e.g. changing status by dragging and dropping)
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const requesterId = String(req.user.id || req.user._id);
    const creatorId   = task.createdBy ? String(task.createdBy) : null;
    const assigneeId  = task.assignee  ? String(task.assignee)  : null;

    const isCreator      = creatorId && requesterId === creatorId;
    const isAssigneeOnly = !isCreator && assigneeId && requesterId === assigneeId;

    if (isAssigneeOnly) {
      // Assignees are ONLY allowed to update the status (drag & drop)
      // They CANNOT change title, description, priority, assignee, due date, etc.
      const allowedKeys = ['status'];
      const requestedKeys = Object.keys(req.body);
      const hasDisallowedFields = requestedKeys.some(k => !allowedKeys.includes(k));

      if (hasDisallowedFields) {
        return res.status(403).json({
          message: 'You can only update the status of a task assigned to you. Contact your manager to make other changes.'
        });
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate('assignee', 'name email avatar').populate('createdBy', 'name');

    req.io.emit('task_updated');
    res.json(updatedTask);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const requesterId = String(req.user.id || req.user._id);
    const creatorId   = task.createdBy ? String(task.createdBy) : null;
    const assigneeId  = task.assignee  ? String(task.assignee)  : null;

    if (creatorId) {
      const isCreator = requesterId === creatorId;
      if (!isCreator && assigneeId && requesterId === assigneeId) {
        return res.status(403).json({
          message: 'You cannot delete a task that was assigned to you.'
        });
      }
    }

    await task.deleteOne();
    req.io.emit('task_updated');
    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route POST /api/tasks/upload
// @desc Upload an attachment for a task
router.post('/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch(err) {
    res.status(500).send('Server Error');
  }
});

// @route POST /api/tasks/:id/remind
// @desc  Create an in-app notification reminder for the task's assignee
router.post('/:id/remind', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignee', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (!task.assignee) return res.status(400).json({ message: 'This task has no assigned member.' });

    const senderId = req.user.id || req.user._id;

    // Create in-app notification in the database
    const notification = new Notification({
      recipient: task.assignee._id,
      sender: senderId,
      taskId: task._id,
      taskTitle: task.title,
      message: `You have a reminder for task: "${task.title}" (Priority: ${task.priority}). Please check your workspace.`,
    });
    await notification.save();

    // Emit a real-time socket event to the recipient if they are online
    req.io.emit(`notification_${task.assignee._id}`, {
      message: notification.message,
      taskTitle: task.title,
    });

    res.json({
      message: `Reminder notification sent to ${task.assignee.name}!`,
      recipientName: task.assignee.name,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
