const { Schema, model } = require('mongoose');

const testSchema = new Schema({
  name: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = model('Test', testSchema);
