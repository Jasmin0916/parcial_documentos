const mongoose = require('mongoose');
const { user2Schema } = require('./schemas');

const user2Model = mongoose.model('User2', user2Schema);

module.exports = {user2Model };