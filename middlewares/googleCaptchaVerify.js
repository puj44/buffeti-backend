const { default: axios } = require("axios");
const sendResponse = require("../common/sendResponse");
async function captchaVerify(req, res, next) {
  try{
    const {token} = req.body;
  if (process.env.ENV === "LOCAL") {
    return next();
  }
  const captchaResponse = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
  );

  if (!captchaResponse?.data?.success) {
    return sendResponse(res, 400, {
      message: "ReCaptcha Failed, Please try again",
    });
  }
  return next();
  }catch(err){
    console.log("GOOGLE CAPTCHA MIDDLWARE ERROR: ",err);
    return sendResponse(res, 400, {
      message: "ReCaptcha Failed, Please try again",
    });
  }
}
module.exports = captchaVerify;
