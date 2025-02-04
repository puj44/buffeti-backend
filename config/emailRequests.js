const sendEmail = require("../services/email/sendEmail");

async function OtpRequestEmail(otp, email) {
  try {
    // SEND OTP
    const body = `Your OTP is: ${otp}. Use this code for verification. Do not share it with anyone. GNV CLICK2CATER`;

    const res = sendEmail(
      email,
      "Email verification required",
      body,
      process.env.AUTH_EMAIL_NOREPLY
    );
    if (res?.status === 200) {
      return true;
    }
    console.log("SEND EMAIL SMS ERROR:", res?.status, res?.data ?? res);
    return false;
  } catch (err) {
    console.log("SEND EMAIL SMS ERROR:", err);
    return false;
  }
}

async function OrderStatusEmailNotification(
  name,
  order_number,
  email,
  order_status
) {
  try {
    let body;
    switch (order_status) {
      case "placed":
        body = `Dear ${name}, your order (ID: ${order_number}) has been accepted. Thank you for ordering with us! GNV CLICK2CATER.`;
        break;
      case "confirmed":
        body = `Dear ${name}, your order (ID: ${order_number}) has been placed successfully. Check your email for confirmation. Thanks for choosing us! GNV CLICK2CATER.`;
        break;
      case "preparing":
        body = `Dear ${name}, your order (ID: ${order_number}) is being prepred with love. Thank you for ordering with us! GNV CLICK2CATER.`;
        break;
      case "out_for_delivery":
        body = `Dear ${name}, your order (ID: ${order_number}) your order is out for delivery. Thanks for choosing us! GNV CLICK2CATER.`;
        break;
      case "cancelled":
        body = `Dear ${name}, your order (ID: ${order_number}) has been cancelled. We'll be waiting for you to order again with us! GNV CLICK2CATER.`;
        break;
      case "delivered":
        body = `Dear ${name}, your order (ID: ${order_number}) has been delivered. We'll be waiting for you to order again with us! GNV CLICK2CATER.`;
        break;

      default:
        break;
    }

    const res = await sendEmail(
      email,
      `Your Buffeti.com order ${order_number}`,
      body,
      process.env.AUTH_EMAIL_NOREPLY
    );
    return res;
  } catch (err) {
    console.log("ORDER STATUS EMAIL ERROR:", err);
    return false;
  }
}

module.exports = {
  OtpRequestEmail,
  OrderStatusEmailNotification,
};
