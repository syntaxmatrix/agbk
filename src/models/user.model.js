import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// One year in milliseconds for subscription expiry
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Define User Schema
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    profileURL: { type: String, default: null },
    email: {
      type: String,
      unique: true,
      required: true,
      index: true,
      match:
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
    },
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    securityCode: { type: String, default: null },
    securityCodeExpiry: { type: Date, default: null },
    refreshToken: { type: String, default: null },
    subscription: {
      type: String,
      enum: ["Free", "Premium", "Ultimate"],
      default: "Free",
    },
    subscriptionExpiry: {
      type: Date,
      default: () => new Date(Date.now() + ONE_YEAR_MS),
    },
    chatHistory: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null },
    ],
    googleRefreshToken: { type: String, default: null },
    googleConnected: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Pre hooks
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Define Methods
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, name: this.name },
    process.env.SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// Export User Model
const User = mongoose.model("User", userSchema);
export default User;
