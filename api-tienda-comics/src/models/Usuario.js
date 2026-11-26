
import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    rol: {
      type: String,
      enum: ["cliente", "admin"],
      default: "cliente",
    },
  },
  { timestamps: true }
);

// Hash automático antes de guardar
usuarioSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

usuarioSchema.methods.compararPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

export default model("Usuario", usuarioSchema);
