const createPayment = async (req, res) => {
  const { id } = req.user ?? {};
  const { payment_mode, payment_status, payment_type } = req.params;
  try {
    if (!id) {
      return sendRes(res, 404, {
        message: "Customer id not found",
      });
    }
    if (payment_status === "")
  } catch (err) {
    console.log("Create Payment Error:", err);
    sendError(res, err);
  }
};
module.exports = { createPayment };
