const pdfService = require('../services/pdfService');

// @desc    Generate PDF Report
// @route   GET /api/tests/:id/pdf
// @access  Private
const generatePDF = async (req, res) => {
    try {
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=graphology_report_${req.params.id}.pdf`);

        await pdfService.generateReport(req.params.id, res);
    } catch (error) {
        // If headers not sent, send JSON error. Otherwise stream just stops.
        if (!res.headersSent) {
            const status = error.message === 'Test not found' ? 404 : 500;
            res.status(status).json({ message: error.message });
        }
    }
};

module.exports = { generatePDF };
