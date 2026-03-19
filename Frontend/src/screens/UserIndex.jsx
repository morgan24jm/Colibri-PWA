import { Button } from "../components";
import { useNavigate } from "react-router-dom";

export default function UserIndex() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-dvh flex flex-col justify-start p-6 gap-6">
      <h1 className="text-2xl font-bold">Bienvenido</h1>

      <div className="flex flex-col gap-4">
  <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
  <img
    src="/pv.png"
    alt="opcion"
    className="w-16 h-16 object-cover rounded"
  />
  <div>
          <h2 className="font-semibold mb-2">Buscar viaje</h2>
          <p className="text-sm text-gray-500 mb-4">Usa el buscador para indicar tu punto de recogida y destino.</p>
          <Button title={"Ir al Mapa"} type={"button"} fun={() => navigate('/user/home')} />
        </div>
</div>
       <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
  <img
    src="/rutas.png"
    alt="opcion"
    className="w-16 h-16 object-cover rounded"
  />
  <div>
          <h2 className="font-semibold mb-2">Rutas</h2>
          <p className="text-sm text-gray-500">Ve las rutas colecctivas disponibles.</p>
        </div>
</div>
        <div className="p-4 bg-white rounded-lg shadow flex items-center gap-4">
  <img
    src="/bedriver.png"
    alt="opcion"
    className="w-16 h-16 object-cover rounded"
  />

  <div>
    <h2 className="font-semibold mb-1">Se Conductor</h2>
    <p className="text-sm text-gray-500">Si estas interesado en trabajar con nosotros, registra tus datos.</p>
 </div>
  </div>
      </div>
    </div>
  );
}
