const sendRes = require("../common/sendResponse");
const sendErr = require("../common/sendError");
const { get, set } = require("../common/redisGetterSetter");
const axios = require("axios");

const getLocation = async (req, res) => {
  const { lat, lng } = req.body;
  const addressDetails = {
    address: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
  };
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&extra_computations=ADDRESS_DESCRIPTORS&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    if (response.data.status === "ZERO_RESULTS") {
      return sendRes(res, 400, {
        message: "No location found for given coordinates",
      });
    }
    if (response.data.status === "OK") {
      const addressComponents = response.data.results[0].address_components;
      console.log(addressComponents);

      addressDetails.address = response.data.results[0].formatted_address;

      addressComponents.forEach((component) => {
        const types = component.types;
        if (types.includes("locality")) {
          addressDetails.city = component.long_name;
        }
        if (types.includes("administrative_area_level_1")) {
          addressDetails.state = component.long_name;
        }
        if (types.includes("postal_code")) {
          addressDetails.pincode = component.long_name;
        }
        if (types.includes("neighborhood")) {
          addressDetails.area = component.long_name;
        }
        if (types.includes("sublocality_level_1")) {
          addressDetails.area = component.long_name;
        }
      });
    }
    console.log(addressDetails);

    return sendRes(res, 200, {
      data: {
        address: addressDetails.address,
        area: addressDetails.area,
        city: addressDetails.city,
        state: addressDetails.state,
        pincode: addressDetails.pincode,
      },
      message: "Location fetched successfully",
    });
  } catch (err) {
    console.log("Get Location Error:", err);
    sendErr(res, err);
  }
};

module.exports = { getLocation };
