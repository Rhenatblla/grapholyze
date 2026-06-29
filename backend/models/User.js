const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user", // 'user' or 'admin'
      enum: ["user", "admin"],
    },
    profile: {
      age: Number,
      gender: { type: String, enum: ["Laki-laki", "Perempuan"] },
      education: String,
      dominant_hand: { type: String, enum: ["Kanan", "Kiri"] },
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
// Encrypt password using bcrypt
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
