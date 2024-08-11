const { get } = require("../common/redisGetterSetter");
const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");

async function validateLocation(req, res, next) {
  try {
    const { location } = req.headers;
    if (!location)
      return sendResponse(res, 402, { message: "Location is required" });
    const locations = await get("locations", true);
    if (!locations.includes(location)) {
      return sendResponse(res, 402, { message: "Invalid Location" });
    }
    next();
  } catch (err) {
    console.log("LOCATION MIDDLEWARE ERROR: ", err);
    return sendError(res, err);
  }
}
module.exports = validateLocation;
