import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { getPlan } from "../config/plans.js";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is not valid"],
    },
    password: { type: String, required: [true, "Password is required"], minlength: 8, select: false },
    role: {
      type: String,
      enum: { values: ["farmer", "buyer", "admin"], message: "Role must be farmer, buyer or admin" },
      default: "buyer",
    },
    phone: { type: String, trim: true, default: "" },
    region: { type: String, trim: true, default: "" },
    avatarUrl: { type: String, default: "" },

    // Verification
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Subscription / plan
    plan: {
      id: { type: String, default: "free" },
      startedAt: { type: Date, default: Date.now },
      // A paid plan is "active" only while the latest Subscription doc is "active"
      subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", default: null },
    },

    // Admin-facing
    suspended: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before save when it changes
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare a plaintext candidate to the stored hash
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Convenience: derive plan object on the user doc
userSchema.methods.getPlan = function () {
  return getPlan(this.plan?.id || "free");
};

// Never return the password hash in any JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = model("User", userSchema);
