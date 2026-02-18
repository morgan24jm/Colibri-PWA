import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { useUser } from "../contexts/UserContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";
import { useAlert } from "../hooks/useAlert";
import { Alert } from "../components";

function UserEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);
  const { alert, showAlert, hideAlert } = useAlert();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const { user } = useUser();

  const navigation = useNavigate();

  const updateUserProfile = async (data) => {
    const userData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
    };
    Console.log(userData);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/user/update`,
        userData,
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      showAlert('Edición Exitosa', 'Tus datos de perfil se actualizaron correctamente', 'success');

      setTimeout(() => {
        navigation("/user/index");
      }, 5000)
    } catch (error) {
      showAlert('Ocurrió un error', error.response.data[0].msg, 'failure');

      Console.log(error.response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setResponseError("");
    }, 5000);
  }, [responseError]);
  return (
    <div className="w-full h-dvh flex flex-col justify-between p-4 pt-6">
      <Alert
        heading={alert.heading}
        text={alert.text}
        isVisible={alert.isVisible}
        onClose={hideAlert}
        type={alert.type}
      />
      <div>
        <div className="flex gap-3">
          <ArrowLeft
            strokeWidth={3}
            className="mt-[5px] cursor-pointer"
            onClick={() => navigation(-1)}
          />
          <Heading title={"Editar Perfil"} />
        </div>
        <Input
          label={"Correo electrónico"}
          type={"email"}
          name={"email"}
          register={register}
          error={errors.email}
          defaultValue={user.email}
          disabled={true}
        />
        <form onSubmit={handleSubmit(updateUserProfile)}>
          <Input
            label={"Nombre"}
            name={"firstname"}
            register={register}
            error={errors.firstname}
            defaultValue={user.fullname.firstname}
          />
          <Input
            label={"Apellido"}
            name={"lastname"}
            register={register}
            error={errors.lastname}
            defaultValue={user.fullname.lastname}
          />
          <Input
            label={"Número de teléfono"}
            type={"number"}
            name={"phone"}
            register={register}
            error={errors.phone}
            defaultValue={user.phone}
          />
          {responseError && (
            <p className="text-sm text-center mb-4 text-red-500">
              {responseError}
            </p>
          )}
          <Button
            title={"Actualizar Perfil"}
            loading={loading}
            type="submit"
            classes={"mt-4"}
          />
        </form>
      </div>
    </div>
  );
}

export default UserEditProfile;
