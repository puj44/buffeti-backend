const sendError = require("../../common/sendError");
const sendResponse = require("../../common/sendResponse");
const { signJWT, verifyJWT } = require("../../controllers/utils/jwtUtils");
const slackLog = require("../../controllers/utils/slackLog");
const users = require("../../db/models/users");
const bcrypt = require("bcrypt");

const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await users.findOne({ email });
    if (!user) {
      return sendResponse(res, 401, {
        message: "Invalid Email or Password",
      });
    }

    let response = await new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, hash_result) => {
        if (err) reject(false);
        resolve(hash_result);
      });
    });

    if (!response)
      return sendResponse(res, 401, { message: "Invalid Email or Password" });

    const accessToken = signJWT(
      {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      "72h"
    );

    res.cookie("accessToken", accessToken, {
      maxAge: 9.461e7,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return sendResponse(res, 200, {
      data: {
        user: verifyJWT(accessToken).payload ?? {},
        accessToken: accessToken,
      },
      message: "Login successful!",
    });
  } catch (err) {
    console.log("Admin Login Error: ", err);
    await slackLog("ADMIN_SIGNIN",err)
    return sendError(res, err);
  }
};

const checkstatus = async (req, res) => {
  const token = req.cookies?.accessToken;
  if (token === null || token === undefined) {
    return sendResponse(res, 401, {
      message: "Access token is missing or invalid",
    });
  }

  const payload = verifyJWT(token).payload;

  if (payload === null) {
    return sendResponse(res, 403, {
      message: "Access token is not valid",
    });
  }

  return sendResponse(res, 200, {
    data: {
      user: payload ?? {},
    },
  });
};

module.exports = { signin, checkstatus };
