import { Button } from "../components";
import { useNavigate } from "react-router-dom";

export default function UserIndex() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-dvh flex flex-col justify-start p-6 gap-6">
      <h1 className="text-2xl font-bold">Bienvenido</h1>

      <div className="flex flex-col gap-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-semibold mb-2">Buscar viaje</h2>
          <p className="text-sm text-gray-500 mb-4">Usa el buscador para indicar tu punto de recogida y destino.</p>
          <Button title={"Ir al Mapa"} type={"button"} fun={() => navigate('/user/home')} />
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-semibold mb-2">Rutas</h2>
          <p className="text-sm text-gray-500">Ve las rutas colecctivas disponibles.</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="font-semibold mb-2">Opción 2</h2>
          <p className="text-sm text-gray-500">Espacio para opción futura.</p>
        </div>
      </div>
    </div>
  );
}
