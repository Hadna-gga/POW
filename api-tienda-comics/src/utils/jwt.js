
import jwt from "jsonwebtoken";

export const generarToken = (usuario) =>
  jwt.sign(
    {
      sub: usuario._id.toString(),
      rol: usuario.rol,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    }
  );
