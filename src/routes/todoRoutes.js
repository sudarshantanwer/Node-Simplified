const express = require("express");
const router = express.Router();
const todoController = require("../controllers/todoController");

// Import rate limiting middleware
const rateLimiters = require('../middlewares/rateLimiters');

// Apply different rate limits based on operation type

// Read operations - more lenient
router.get('', 
    rateLimiters.basic.lenient,
    rateLimiters.progressiveDelay.gentle,
    todoController.getAllTasks
);

router.get('/:id', 
    rateLimiters.slidingWindow.oneMinute,
    todoController.getSingleTask
);

// Write operations - more strict
router.post('', 
    rateLimiters.basic.strict,
    rateLimiters.tokenBucket.strict,
    rateLimiters.progressiveDelay.aggressive,
    todoController.createNewTask
);

router.put('/:id', 
    rateLimiters.fixedWindow.apiCalls,
    rateLimiters.progressiveDelay.basic,
    todoController.updateTask
);

// Delete operations - very strict
router.delete('/:id', 
    rateLimiters.tokenBucket.heavyOperation, // Consumes more tokens
    rateLimiters.fixedWindow.strict,
    todoController.deleteSingleTask
);

router.delete('', 
    rateLimiters.combinations.highSecurity[0], // Sliding window strict
    rateLimiters.combinations.highSecurity[2], // Aggressive slowdown
    todoController.deleteAllTasks
);

module.exports = router;