const analysisService = require('../services/analysisService');

// @desc    Upload handwriting image and analyze
// @route   POST /api/tests/upload
// @access  Private
const uploadTest = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No image uploaded. Please select a file.' });
            return;
        }

        // 1. Perform Analysis (Service Layer)
        // Now async because it might call Flask API
        const analysisResult = await analysisService.analyze(req.file.path);

        // 2. Save to Database (Service Layer)
        const savedRecord = await analysisService.saveResult(
            req.user.id,
            req.file.path,
            analysisResult
        );

        res.status(201).json(savedRecord);
    } catch (error) {
        console.error("Upload/Analysis Error:", error);
        res.status(500).json({ message: 'Server Error during analysis' });
    }
};

// @desc    Get all tests for current user
// @route   GET /api/tests/mytests
// @access  Private
const getMyTests = async (req, res) => {
    const tests = await TestResult.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(tests);
};

// @desc    Get test by ID
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
    const test = await TestResult.findById(req.params.id);

    if (test) {
        // Ensure user owns the test or is admin
        if (test.user.toString() !== req.user.id && req.user.role !== 'admin') {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        res.json(test);
    } else {
        res.status(404).json({ message: 'Test not found' });
    }
};

module.exports = {
    uploadTest,
    getMyTests,
    getTestById
};
