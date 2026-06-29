const mongoose = require('mongoose');

const testResultSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    imagePath: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    results: {
        personalityType: String,
        traits: [String],
        confidence: Number,
        analysisDate: Date
    }
}, {
    timestamps: true
});

const TestResult = mongoose.model('TestResult', testResultSchema);

module.exports = TestResult;
