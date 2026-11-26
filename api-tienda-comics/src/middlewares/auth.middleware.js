import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const cabecera = req.headers.authorization || "";
  const [esquema, token] = cabecera.split(" ");

  if (esquema !== "Bearer" || !token) {
    return res.status(401).json({
      mensaje: "Token no proporcionado",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.usuario = {
      id: payload.sub,
      rol: payload.rol,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      mensaje: error.name === "TokenExpiredError"
        ? "Token expirado"
        : "Token inválido",
    });
  }
};