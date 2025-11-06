const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(406).json({ message: "UnAuthorized" });
    }
    const token = req.headers.authorization.replace("Bearer ", "");

    const user = await User.findOne({
      token: token,
    }).select("-salt -hash");

    if (user) {
      req.user = user;
      next();
    } else {
      return res.status(406).json({ message: "UnAuthorized" });
    }
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "UnAuthorized", error: error });
  }
};

module.exports = isAuthenticated;
