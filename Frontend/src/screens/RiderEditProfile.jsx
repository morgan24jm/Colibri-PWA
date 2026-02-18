import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button, Heading, Input } from "../components";
import axios from "axios";
import { useRider } from "../contexts/RiderContext";
import { ArrowLeft } from "lucide-react";
import Console from "../utils/console";

function RiderEditProfile() {
  const token = localStorage.getItem("token");
  const [responseError, setResponseError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();

  const { rider } = useRider();

  const navigation = useNavigate();

  const vehicleOptions = [
  { label: "Carro", value: "car" },
  { label: "Combi", value: "bike" },
];

  const updateUserProfile = async (data) => {
    const riderData = {
      fullname: {
        firstname: data.firstname,
        lastname: data.lastname,
      },
      phone: data.phone,
      vehicle: {
        color: data.color,
        number: data.number,
        capacity: data.capacity,
        type: data.type.toLowerCase(),
      },
    };
    Console.log(riderData);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/rider/update`,
        { riderData },
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      navigation("/rider/home");
    } catch (error) {
      setResponseError(error.response.data[0].msg);
      Console.log(error.response);
      Console.log(error);
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
      <div className="overflow-auto">
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
          defaultValue={rider.email}
          disabled={true}
        />
        <form onSubmit={handleSubmit(updateUserProfile)}>
          <Input
            label={"Número de teléfono"}
            type={"number"}
            name={"phone"}
            register={register}
            error={errors.phone}
            defaultValue={rider.phone}
          />
          <div className="flex gap-4 -mb-2">
            <Input
              label={"Nombre"}
              name={"firstname"}
              register={register}
              error={errors.firstname}
              defaultValue={rider.fullname.firstname}
            />
            <Input
              label={"Apellido"}
              name={"lastname"}
              register={register}
              error={errors.lastname}
              defaultValue={rider.fullname.lastname}
            />
          </div>
          <div className="flex gap-4 -my-2">
            <Input
              label={"Color del vehículo"}
              name={"color"}
              register={register}
              error={errors.color}
              defaultValue={rider.vehicle.color}
            />
            <Input
              label={"Capacidad del vehículo"}
              type={"number"}
              name={"capacity"}
              register={register}
              error={errors.capacity}
              defaultValue={rider.vehicle.capacity}
            />
          </div>
          <Input
            label={"Número del vehículo"}
            name={"number"}
            register={register}
            error={errors.number}
            defaultValue={rider.vehicle.number}
          />
         <Input
  label={"Tipo de vehículo"}
  type={"select"}
  options={vehicleOptions}
  name={"type"}
  register={register}
  error={errors.type}
  defaultValue={rider.vehicle.type}
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

export default RiderEditProfile;
