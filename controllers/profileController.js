const sendError = require("../common/sendError");
const sendResponse = require("../common/sendResponse");
const CustomerAddresses = require('../db/models/customerAddresses');
const getAddress = async(req,res) =>{
    try{
        const addresses = await CustomerAddresses.find({customer:req.user.id});
        return sendResponse(
            res,
            200,
            {
                data:{
                    addresses:addresses ?? []
                },
                message:"Addresses fetched successfully"
            }
        )
    }catch(err){
        console.log("GET ADDRESS ERROR:",err)
        sendError(res,err)
    }
}

const addAddress = async(req,res) =>{
    try{
        const customerId = req.user.id;
        const data = {
            customer: customerId,
            ...req.body
        }
        await CustomerAddresses.create({
            ...data
        });
        const addresses = await CustomerAddresses.find({customer:req.user.id});
        return sendResponse(
            res,
            200,
            {
                data:{
                    addresses:addresses ?? []
                },
                message:"Address added successfully"
            }
        )
    }catch(err){
        console.log("ADD ADDRESS ERROR:",err)
        sendError(res,err)
    }
}

const editAddress = async(req,res) =>{
    try{
        const customerId = req.user.id;
        const addressId = req.params.id;
        const data = {
            ...req.body
        }
        await CustomerAddresses.findOneAndUpdate(
            {
                _id:addressId,
                customer:customerId
            },
            {
                ...data
            }
        );
        const addresses = await CustomerAddresses.find({customer:req.user.id});
        return sendResponse(
            res,
            200,
            {
                data:{
                    addresses:addresses ?? []
                },
                message:"Address updated successfully"
            }
        )
    }catch(err){
        console.log("EDIT ADDRESS ERROR:",err)
        sendError(res,err)
    }
}

const deleteAddress = async(req,res) =>{
    try{
        const customerId = req.user.id;
        const addressId = req.params.id;
        const data = {
            ...req.body
        }
        await CustomerAddresses.findOneAndDelete(
            {
                _id:addressId,
                customer:customerId
            }
        );
        const addresses = await CustomerAddresses.find({customer:req.user.id});
        return sendResponse(
            res,
            200,
            {
                data:{
                    addresses:addresses ?? []
                },
                message:"Address deleted successfully"
            }
        )
    }catch(err){
        console.log("DELETE ADDRESS ERROR:",err)
        sendError(res,err)
    }
}

module.exports = {
    addAddress,
    getAddress,
    editAddress,
    deleteAddress
}