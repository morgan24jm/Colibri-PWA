const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const { sendMail } = require("../services/mail.service");
let { fillTemplate } = require("../templates/mail.template");

const riderModel = require("../models/rider.model");
const userModel = require("../models/user.model");

// Envío de correo de verificación
module.exports.sendVerificationEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  let user;

  if (req.userType === "user") {
    user = req.user;
  } else if (req.userType === "rider") {
    user = req.rider;
  } else {
    return res.status(400).json({ message: "El enlace de verificación de correo no es válido debido a un tipo de usuario incorrecto" });
  }

  if (user.emailVerified) {
    return res.status(400).json({ message: "Tu correo ya ha sido verificado. Puedes continuar usando la aplicación." });
  }

  const token = jwt.sign(
    { id: user._id, userType: req.userType, purpose: "email-verification" },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  if (!token) {
    return res
      .status(500)
      .json({ message: "No podemos generar un enlace de verificación en este momento. Por favor, inténtalo de nuevo en unos minutos." });
  }

  try {
    const verification_link = `${process.env.CLIENT_URL}/${req.userType}/verify-email?token=${token}`;

    let mailHtml = fillTemplate({
      title: "Verificación de correo requerida",
      name: user.fullname.firstname,
      message: "¡Gracias por registrarte en Colibri! Para completar tu registro y activar tu cuenta, verifica tu dirección de correo haciendo clic en el botón a continuación.",
      cta_link: verification_link,
      cta_text: "Verificar correo",
      note: "Por tu seguridad, este enlace de verificación es válido solo por <strong>15 minutos</strong>. Si expira, puedes solicitar uno nuevo desde la página de inicio de sesión. <br/>Si no creaste una cuenta en Colibri, ignora este correo.",
    });

    const result = await sendMail(
      user.email,
      "Colibri - Verificación de correo",
      mailHtml
    );

    return res.status(200).json({
      message: "Correo de verificación enviado con éxito",
      user: {
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    console.error("Error al enviar el correo de verificación:", error);
    return res
      .status(500)
      .json({ message: "No se pudo enviar el correo de verificación" });
  }
});

// Recuperación de contraseña
module.exports.forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }

  const { email } = req.body;
  const { userType } = req.params;

  let user = null;
  if (userType === "user") {
    user = await userModel.findOne({ email });
  } else if (userType === "rider") {
    user = await riderModel.findOne({ email });
  }
  if (!user) return res.status(404).json({ message: "Usuario no encontrado. Por favor verifica tus credenciales e inténtalo de nuevo" });

  const token = jwt.sign(
    { id: user._id, type: "user" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const resetLink = `${process.env.CLIENT_URL}/${userType}/reset-password?token=${token}`;

  let mailHtml = fillTemplate({
    title: "Restablecer contraseña",
    name: user.fullname.firstname,
    message: "Recibimos una solicitud para restablecer la contraseña de tu cuenta en Colibri. Si realizaste esta solicitud, haz clic en el botón a continuación para continuar.",
    cta_link: resetLink,
    cta_text: "Restablecer contraseña",
    note: "Si no solicitaste un restablecimiento de contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual permanecerá igual. <br/>Este enlace de verificación es válido solo por <strong>15 minutos</strong>.",
  });

  await sendMail(user.email, "Colibri - Restablecer contraseña", mailHtml);

  res.status(200).json({ message: "Correo de restablecimiento de contraseña enviado con éxito" });
});

// Restablecer contraseña
module.exports.resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json(errors.array());

  const { token, password } = req.body;
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(400).json({ message: "Token inválido o expirado" });
  }

  const user = await userModel.findById(payload.id);
  if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

  user.password = await userModel.hashPassword(password);
  await user.save();

  res.status(200).json({ message: "Contraseña restablecida con éxito" });
});
