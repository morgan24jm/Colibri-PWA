const riderModel = require("../models/rider.model");

module.exports.createRider = async (
  firstname,
  lastname,
  email,
  password,
  phone,
  color,
  number,
  capacity,
  type
) => {
  if (!firstname || !email || !password) {
    throw new Error("All fields are required");
  }

  const hashedPassword = await riderModel.hashPassword(password);

  const rider = await riderModel.create({
    fullname: {
      firstname,
      lastname,
    },
    email,
    password: hashedPassword,
    phone,
    vehicle: {
      color,
      number,
      capacity,
      type,
    },
  });

  return rider;
};
