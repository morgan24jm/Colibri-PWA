import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import Console from "../utils/console";

function UserLogin() {
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const navigation = useNavigate();

  const loginUser = async (data) => {
    if (data.email.trim() !== "" && data.password.trim() !== "") {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/user/login`,
          data
        );
        Console.log(response);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify({
          type: "user",
          data: response.data.user,
        }));
        navigation("/user/index");
      } catch (error) {
        setResponseError(error.response.data.message);
        Console.log(error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setResponseError("");
    }, 5000);
  }, [responseError]);

  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <div>
        <Heading title={"Inicio de Sesión"} />
        <form onSubmit={handleSubmit(loginUser)}>
          <Input
            label={"Correo electrónico"}
            type={"email"}
            name={"email"}
            register={register}
            error={errors.email}
          />
          <Input
            label={"Contraseña"}
            type={"password"}
            name={"password"}
            register={register}
            error={errors.password}
          />
          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}
          <Link to="/user/forgot-password" className="text-sm mb-2 inline-block">
            ¿Olvidaste tu contraseña?
          </Link>
          <Button title={"Iniciar sesión"} loading={loading} type="submit" />
        </form>

        <p className="text-sm font-normal text-center mt-4">
          ¿No tienes una cuenta?{" "}
          <Link to={"/signup"} className="font-semibold">
            Regístrate
          </Link>
        </p>
      </div>

      <div>
        <Button
          type={"link"}
          path={"/rider/login"}
          title={"Iniciar sesión como Conductor"}
          classes={"bg-orange-500"}
        />

        <p className="text-xs font-normal text-center self-end mt-6">
          Este sitio está protegido por reCAPTCHA y la{" "}
          <span className="font-semibold underline">Política de Privacidad</span>{" "}
          de Google y los{" "}
          <span className="font-semibold underline">Términos de Servicio</span>{" "}
          aplican.
        </p>
      </div>
    </div>
  );
}

export default UserLogin;
