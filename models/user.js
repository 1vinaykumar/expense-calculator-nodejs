const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  amount: { type: Number, required: true, default: 0 },
  timeStamp: { type: Date },
  sourceType: { type: Number, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userName: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdDate: { type: Date, required: true },
  available: { type: Number, default: 0, required: true },
  moneyTo: { type: Number, default: 0, required: true },
  moneyFrom: { type: Number, default: 0, required: true },
  net: { type: Number, default: 0, required: true },
  moneySources: [sourceSchema],
});

module.exports = mongoose.model("User", userSchema);
