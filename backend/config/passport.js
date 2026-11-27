const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

// Lee el rol que el usuario eligió al registrarse con Google.
// Viene dentro de "state", firmado por nuestro servidor (ver /api/usuarios/google).
function leerRolDelState(req) {
    const state = req.query && req.query.state;

    if (!state) {
        return null;
    }

    try {
        const datos = jwt.verify(state, process.env.JWT_SECRET, { algorithms: ["HS256"] });

        if (datos.proposito !== "google-oauth") {
            return null;
        }

        return ["consumidor", "productor"].includes(datos.rol) ? datos.rol : null;
    } catch (error) {
        return null;
    }
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL,
                passReqToCallback: true
            },
            async (req, accessToken, refreshToken, profile, done) => {
                try {
                    const correo = (profile.emails && profile.emails[0]
                        ? profile.emails[0].value
                        : ""
                    ).toLowerCase();

                    if (!correo || !profile._json.email_verified) {
                        return done(null, false, { motivo: "correo-no-verificado" });
                    }

                    // 1. ¿Ya inició sesión antes con Google?
                    let usuario = await Usuario.findOne({ googleId: profile.id });

                    if (!usuario) {
                        // 2. ¿Existe una cuenta con ese correo (registro con contraseña)? Se vincula.
                        usuario = await Usuario.findOne({ correo: correo });

                        if (usuario) {
                            usuario.googleId = profile.id;
                            await usuario.save();
                        } else {
                            // 3. Usuario nuevo: necesita haber elegido un rol
                            const rol = leerRolDelState(req);

                            if (!rol) {
                                return done(null, false, { motivo: "sin-cuenta" });
                            }

                            usuario = await Usuario.create({
                                nombre: profile.displayName || correo,
                                correo: correo,
                                googleId: profile.id,
                                rol: rol
                            });
                        }
                    }

                    return done(null, usuario);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );
} else {
    console.warn("Google OAuth desactivado: faltan GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el .env");
}