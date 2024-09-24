const sendResponse = require("../../common/sendResponse");
const { Order } = require("../../db/models/order");
const {OrderPayment} = require("../../db/models/orderPayment");
const reader = require("xlsx");
const orderTransactionInfo = async (req,res) =>{
    try{
        
        const {orderIds} = req.body;
        let response = [];
        if(orderIds?.length){
            for(const orderId of orderIds){
                
                const paymentDetails =  await OrderPayment.findOne({razorpay_order_id:orderId});
                let details = {};
                if(paymentDetails){
                    const numOfTxn = await OrderPayment.countDocuments({order_number:paymentDetails.order_number})
                    const orderPackage = await Order.findOne({order_number:paymentDetails.order_number}).lean();
                    let items = "";
                    for(const item of orderPackage.item_pricing){
                        items = items.concat(" "+item.item_name);
                    }
                    details["order_id"] = orderId;
                    details["order_number"] = paymentDetails.order_number;
                    details["payment_status"] = paymentDetails.payment_status;
                    details["amount"] = paymentDetails.payment_amount;
                    details["number_of_times_transactions_performed"] = numOfTxn;
                    details["products_info"] = items.trim();
                    response.push(details)
                }
            }
        }
        if(response.length){
            let workBook = reader.utils.book_new();
            const workSheet = reader.utils.json_to_sheet(response);
            reader.utils.book_append_sheet(workBook, workSheet, `response`);
            let exportFileName = `response.xlsx`;
            reader.writeFile(workBook, exportFileName);
        }
        return sendResponse(
            res,
            200, 
            {data:response}
        );
    }catch(err){
        console.log("Orders Info Err:",err)
        return sendResponse(
            res,
            400, 
            {message:err?.message}
        );
    }
}

module.exports = {orderTransactionInfo}