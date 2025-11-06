const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  account: {
    username: String,
    avatar: Object
  },
  newsletter: { type: Boolean, default: false },
  token: String,
  hash: String,
  salt: String,
});
module.exports = User;
