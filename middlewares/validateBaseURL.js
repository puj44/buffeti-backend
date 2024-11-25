const sendResponse = require("../common/sendResponse");

const validateBaseURL = async (req, res, next) => {
  try {
    const protocol = req.protocol; // 'http' or 'https'
    const host = req.headers.host;
    const baseURL = `${protocol}://${host}`;
    console.log("BASE URL", baseURL);
    if (process.env.FRONTEND_URL !== baseURL) {
      return sendResponse(res, 500, { message: "Go away" });
    }
    next();
  } catch (err) {
    return sendError(res, err);
  }
};
