const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/authMiddleware');

// @route  GET /api/projects
// @desc   Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route  POST /api/projects
// @desc   Create a project
router.post('/', auth, async (req, res) => {
  const { name, color } = req.body;
  
  // Role check: Only admin or manager
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
  if (!isAuthorized) {
    return res.status(403).json({ message: 'Only Managers and Admins can create projects.' });
  }

  try {
    const newProject = new Project({
      name,
      color,
      createdBy: req.user.id || req.user._id
    });
    const project = await newProject.save();
    res.json(project);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// @route  DELETE /api/projects/:id
// @desc   Delete a project
router.delete('/:id', auth, async (req, res) => {
  try {
    // Role check: Only admin or manager
    const isAuthorized = req.user.role === 'admin' || req.user.role === 'manager';
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only Managers and Admins can delete projects.' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Project.findByIdAndDelete(req.params.id);
    // Optional: Delete or unassign all tasks in this project
    // await Task.updateMany({ project: req.params.id }, { project: null });

    res.json({ message: 'Project removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
