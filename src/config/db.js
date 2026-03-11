import mongoose from "mongoose";

export const connectDB = async () => {

  try {

    await mongoose.connect("mongodb://localhost:27017/restaurante");

    console.log("MongoDB conectado");

  } catch (error) {

    console.log(error);

  }

};