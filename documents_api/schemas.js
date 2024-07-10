const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    content: String,
    status: { type: String, default: 'en proceso' }
});

module.exports = documentSchema;
