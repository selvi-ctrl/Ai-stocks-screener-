const express = require('express');
const router = express.Router();

// POST /api/parse
router.post('/', (req, res) => {
    const { query } = req.body;

    // Placeholder response
    const sampleResponse = {
        message: "This is a sample DSL response",
        query: query
    };

    res.json(sampleResponse);
});

module.exports = router;