const { Cart, CartItems } = require("../db/models/cart");

async function getCartDetails(customerId){
    const cart = await Cart.findOne({customer_id:customerId});
    if(cart && cart?._id){
        const cartItems = await CartItems.find({cart_id:cart?._id});
        if(cartItems?.length){
            let items = {};
            cartItems.forEach((ci)=>{
                const key = ci.package_name ??
                    cart.menu_option 
                items[key] = {
                    cart_item_id:ci._id,
                    no_of_people:ci.no_of_people
                }
            })
            return{
                menu_option:cart.menu_option,
                items:items
            }
        };
    }
    return {};
}

module.exports = {getCartDetails}