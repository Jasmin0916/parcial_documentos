const mongoose = require('mongoose');
const documentSchema = require('./schemas');

const Document = mongoose.model('Document', documentSchema);

module.exports = { Document };
