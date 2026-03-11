import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({

  products: [

    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products"
      },
      quantity: Number
    }

  ]

});

export const Cart = mongoose.model("carts", cartSchema);