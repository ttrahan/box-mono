var mongoose = require('mongoose');

var BoxSchema = mongoose.Schema({
  color: String,
  environment: String,
  randon: String,
  updatedAt:{ type: Date, default : Date.now }
});

var BoxModel = mongoose.model('Box', BoxSchema);

module.exports = BoxModel;
