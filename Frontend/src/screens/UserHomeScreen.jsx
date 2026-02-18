import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "../contexts/UserContext";
import map from "/map.png";
import {
  Button,
  LocationSuggestions,
  SelectVehicle,
  RideDetails,
  Sidebar,
} from "../components";
import { MapPin } from "lucide-react";
import axios from "axios";
import debounce from "lodash.debounce";
import { SocketDataContext } from "../contexts/SocketContext";
import Console from "../utils/console";

function UserHomeScreen() {
  const token = localStorage.getItem("token"); // this token is in use
  const { socket } = useContext(SocketDataContext);
  const { user } = useUser();
  const mapRef = useRef(null); // Ref para el contenedor del mapa
  const mapInstanceRef = useRef(null); // Ref para la instancia del mapa
  const directionsRendererRef = useRef(null); // Ref para el renderer de direcciones
  const directionsServiceRef = useRef(null); // Ref para el servicio de direcciones
  const riderMarkerRef = useRef(null); // Ref para el marcador del rider
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("messages")) || []
  );
  const [loading, setLoading] = useState(false);
  const [selectedInput, setSelectedInput] = useState("pickup");
  const [locationSuggestion, setLocationSuggestion] = useState([]);
  const [rideCreated, setRideCreated] = useState(false);
  const [riderLocation, setRiderLocation] = useState(null); // Ubicación en tiempo real del rider
  const [eta, setEta] = useState(null); // Tiempo estimado de llegada

  // Detalles del viaje
  const [pickupLocation, setPickupLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("car");
  const [fare, setFare] = useState({
    auto: 0,
    car: 0,
    bike: 0,
  });
  const [confirmedRideData, setConfirmedRideData] = useState(null);
  const [currentLocationAddress, setCurrentLocationAddress] = useState("");
  const rideTimeout = useRef(null);

  // Paneles
  const [showFindTripPanel, setShowFindTripPanel] = useState(true);
  const [showSelectVehiclePanel, setShowSelectVehiclePanel] = useState(false);
  const [showRideDetailsPanel, setShowRideDetailsPanel] = useState(false);

  const handleLocationChange = useCallback(
    debounce(async (inputValue, token) => {
      if (inputValue.length >= 3) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/map/get-suggestions?input=${inputValue}`,
            {
              headers: {
                token: token,
              },
            }
          );
          Console.log(response.data);
          setLocationSuggestion(response.data);
        } catch (error) {
          Console.error(error);
        }
      }
    }, 700),
    []
  );

  const onChangeHandler = (e) => {
    setSelectedInput(e.target.id);
    const value = e.target.value;
    if (e.target.id === "pickup") {
      setPickupLocation(value);
    } else if (e.target.id === "destination") {
      setDestinationLocation(value);
    }

    if (value.length >= 3) {
      handleLocationChange(value, token);
    }

    if (e.target.value.length < 3) {
      setLocationSuggestion([]);
    }
  };

  const getDistanceAndFare = async (pickupLocation, destinationLocation) => {
    Console.log(pickupLocation, destinationLocation);
    try {
      setLoading(true);
      // Dibujar la ruta en el mapa
      drawRoute(pickupLocation, destinationLocation);
      
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/get-fare?pickup=${pickupLocation}&destination=${destinationLocation}`,
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      setFare(response.data.fare);

      setShowFindTripPanel(false);
      setShowSelectVehiclePanel(true);
      setLocationSuggestion([]);
      setLoading(false);
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };

  const createRide = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/ride/create`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
        },
        {
          headers: {
            token: token,
          },
        }
      );
      Console.log(response);
      const rideData = {
        pickup: pickupLocation,
        destination: destinationLocation,
        vehicleType: selectedVehicle,
        fare: fare,
        confirmedRideData: confirmedRideData,
        _id: response.data._id,
      };
      localStorage.setItem("rideDetails", JSON.stringify(rideData));
      setLoading(false);
      setRideCreated(true);

      // Cancelar automáticamente el viaje después de 1.5 minutos
      rideTimeout.current = setTimeout(() => {
        cancelRide();
      }, import.meta.env.VITE_RIDE_TIMEOUT);
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };

  const cancelRide = async () => {
    const rideDetails = JSON.parse(localStorage.getItem("rideDetails"));
    try {
      setLoading(true);
      await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/ride/cancel?rideId=${
          rideDetails._id || rideDetails.confirmedRideData._id
        }`,
        {
          pickup: pickupLocation,
          destination: destinationLocation,
          vehicleType: selectedVehicle,
        },
        {
          headers: {
            token: token,
          },
        }
      );
      setLoading(false);
      updateLocation();
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");
      localStorage.removeItem("messages");
      localStorage.removeItem("showPanel");
      localStorage.removeItem("showBtn");
    } catch (error) {
      Console.log(error);
      setLoading(false);
    }
  };

  // Reiniciar detalles del viaje
  const setDefaults = () => {
    setPickupLocation("");
    setDestinationLocation("");
    setSelectedVehicle("car");
    setFare({
      auto: 0,
      car: 0,
      bike: 0,
    });
    setConfirmedRideData(null);
    setRideCreated(false);
  };

  // Obtener dirección desde coordenadas
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/map/get-address?lat=${latitude}&lng=${longitude}`,
        {
          headers: {
            token: token,
          },
        }
      );
      setCurrentLocationAddress(response.data);
      // Establecer la dirección actual como lugar de recogida por defecto
      setPickupLocation(response.data);
      return response.data;
    } catch (error) {
      Console.error("Error al obtener dirección:", error);
      return null;
    }
  };

  // Actualizar ubicación
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Inicializar el mapa con la ubicación actual
          initializeMap(position.coords.latitude, position.coords.longitude);
          // Obtener la dirección desde las coordenadas
          getAddressFromCoordinates(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error al obtener la ubicación:", error);
        }
      );
    }
  };

  // Inicializar Google Maps
  const initializeMap = (lat, lng) => {
    if (!mapRef.current || !window.google) return;

    const location = { lat, lng };

    // Crear el mapa si no existe
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: location,
        fullscreenControl: false,
        mapTypeControl: false,
      });

      // Inicializar servicios
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    } else {
      // Actualizar centro del mapa
      mapInstanceRef.current.setCenter(location);
    }
  };

  // Dibujar ruta entre dos ubicaciones
  const drawRoute = (pickup, destination) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !mapInstanceRef.current) return;

    directionsServiceRef.current.route(
      {
        origin: pickup,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current.setDirections(result);
          Console.log("Ruta dibujada correctamente");
        } else {
          Console.error("Error al obtener direcciones:", status);
        }
      }
    );
  };

  // Actualizar marcador del rider en tiempo real
  const updateRiderMarker = (lat, lng) => {
    if (!mapInstanceRef.current || !window.google) return;

    const location = { lat, lng };

    if (riderMarkerRef.current) {
      // Actualizar posición del marcador existente
      riderMarkerRef.current.setPosition(location);
    } else {
      // Crear nuevo marcador del rider
      riderMarkerRef.current = new window.google.maps.Marker({
        position: location,
        map: mapInstanceRef.current,
        title: "Conductor",
        icon: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png", // Marcador amarillo para el conductor
      });
    }

    setRiderLocation(location);
  };

  // Calcular ETA (Estimado Time of Arrival)
  const calculateETA = (riderLat, riderLng, pickupLocation) => {
    if (!directionsServiceRef.current) return;

    directionsServiceRef.current.route(
      {
        origin: { lat: riderLat, lng: riderLng },
        destination: pickupLocation,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const durationText = route.legs[0].duration.text; // Ej: "5 mins"
          const durationValue = route.legs[0].duration.value; // Segundos
          setEta(durationText);
          Console.log("ETA del conductor:", durationText);
        } else {
          Console.error("Error al calcular ETA:", status);
        }
      }
    );
  };

  // Limpiar lugar de recogida para permitir cambio
  const clearPickupLocation = () => {
    setPickupLocation("");
    setLocationSuggestion([]);
  };

  useEffect(() => {
    updateLocation();
  }, []);

  // Eventos del socket
  useEffect(() => {
    if (user._id) {
      socket.emit("join", {
        userId: user._id,
        userType: "user",
      });
    }

    socket.on("ride-confirmed", (data) => {
      try {
        Console.log("Timeout cancelado", rideTimeout);
        clearTimeout(rideTimeout.current);
        Console.log("Viaje confirmado", data);
        
        setConfirmedRideData(data);
        setShowRideDetailsPanel(true);
        
        // Dibujar ruta desde ubicación del rider hasta recogida
        if (pickupLocation && data.rider?.location?.coordinates) {
          const riderLocation = `${data.rider.location.coordinates[1]},${data.rider.location.coordinates[0]}`;
          drawRoute(riderLocation, pickupLocation);
          // Actualizar marcador inicial del rider
          updateRiderMarker(data.rider.location.coordinates[1], data.rider.location.coordinates[0]);
          // Calcular ETA inicial
          calculateETA(data.rider.location.coordinates[1], data.rider.location.coordinates[0], pickupLocation);
        }
      } catch (error) {
        Console.error("Error en ride-confirmed:", error);
        // Aún así, actualizar confirmedRideData incluso si hay error en las funciones de mapa
        setConfirmedRideData(data);
        setShowRideDetailsPanel(true);
      }
    });

    // Escuchar actualizaciones de ubicación del rider en tiempo real
    socket.on("rider-location-update", (data) => {
      Console.log("Ubicación del rider actualizada:", data);
      if (pickupLocation && data.latitude && data.longitude) {
        updateRiderMarker(data.latitude, data.longitude);
        calculateETA(data.latitude, data.longitude, pickupLocation);
      }
    });

    socket.on("ride-started", (data) => {
      Console.log("Viaje iniciado");
      // Dibujar ruta del destino final
      drawRoute(data.pickup, data.destination);
    });

    socket.on("ride-ended", (data) => {
      Console.log("Evento ride-ended recibido en usuario:", data);
      setConfirmedRideData(null);
      setRideCreated(false);
      setShowRideDetailsPanel(false);
      setShowSelectVehiclePanel(false);
      setShowFindTripPanel(true);
      setDefaults();
      localStorage.removeItem("rideDetails");
      localStorage.removeItem("panelDetails");

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          initializeMap(position.coords.latitude, position.coords.longitude);
        });
      }
    });

    // Cleanup: remover listeners cuando el componente se desmonta
    return () => {
      socket.off("ride-confirmed");
      socket.off("rider-location-update");
      socket.off("ride-started");
      socket.off("ride-ended");
    };
  }, [user]);

  // Obtener detalles del viaje almacenados
  useEffect(() => {
    const storedRideDetails = localStorage.getItem("rideDetails");
    const storedPanelDetails = localStorage.getItem("panelDetails");

    if (storedRideDetails) {
      const ride = JSON.parse(storedRideDetails);
      setPickupLocation(ride.pickup);
      setDestinationLocation(ride.destination);
      setSelectedVehicle(ride.vehicleType);
      setFare(ride.fare);
      setConfirmedRideData(ride.confirmedRideData);
    }

    if (storedPanelDetails) {
      const panels = JSON.parse(storedPanelDetails);
      setShowFindTripPanel(panels.showFindTripPanel);
      setShowSelectVehiclePanel(panels.showSelectVehiclePanel);
      setShowRideDetailsPanel(panels.showRideDetailsPanel);
    }
  }, []);

  // Guardar detalles del viaje
  useEffect(() => {
    const rideData = {
      pickup: pickupLocation,
      destination: destinationLocation,
      vehicleType: selectedVehicle,
      fare: fare,
      confirmedRideData: confirmedRideData,
    };
    localStorage.setItem("rideDetails", JSON.stringify(rideData));
  }, [
    pickupLocation,
    destinationLocation,
    selectedVehicle,
    fare,
    confirmedRideData,
  ]);

  // Dibujar ruta cuando ambas ubicaciones estén disponibles
  useEffect(() => {
    if (pickupLocation && destinationLocation && mapInstanceRef.current) {
      drawRoute(pickupLocation, destinationLocation);
    }
  }, [pickupLocation, destinationLocation]);

  // Guardar información de paneles
  useEffect(() => {
    const panelDetails = {
      showFindTripPanel,
      showSelectVehiclePanel,
      showRideDetailsPanel,
    };
    localStorage.setItem("panelDetails", JSON.stringify(panelDetails));
  }, [showFindTripPanel, showSelectVehiclePanel, showRideDetailsPanel]);

  useEffect(() => {
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    socket.emit("join-room", confirmedRideData?._id);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, { msg, by: "other" }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [confirmedRideData]);

  return (
    <div
      className="relative w-full h-dvh bg-contain"
      style={{ backgroundImage: `url(${map})` }}
    >
      <Sidebar />
      <div
        ref={mapRef}
        className="absolute w-full h-[120vh] top-0 left-0"
        id="map"
      ></div>

      {/* Panel de buscar viaje */}
      {showFindTripPanel && (
        <div className="absolute b-0 flex flex-col justify-start p-4 pb-2 gap-4 rounded-b-lg bg-white h-fit w-full">
          <h1 className="text-2xl font-semibold">Buscar un viaje</h1>
          <div className="flex items-center relative w-full h-fit">
            <div className="h-3/5 w-[3px] flex flex-col items-center justify-between bg-black rounded-full absolute mx-5">
              <div className="w-2 h-2 rounded-full border-[3px]  bg-white border-black"></div>
              <div className="w-2 h-2 rounded-sm border-[3px]  bg-white border-black"></div>
            </div>
            <div className="w-full">
              <div className="relative">
                <input
                  id="pickup"
                  placeholder="Agrega lugar de recogida"
                  className="w-full bg-zinc-100 pl-10 pr-12 py-3 rounded-lg outline-black text-sm mb-2 truncate"
                  value={pickupLocation}
                  onChange={onChangeHandler}
                  autoComplete="off"
                />
                {pickupLocation && (
                  <button
                    onClick={clearPickupLocation}
                    className="absolute right-3 top-3 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                    title="Cambiar ubicación"
                  >
                    <MapPin size={18} />
                  </button>
                )}
              </div>
              <input
                id="destination"
                placeholder="Agrega lugar de destino"
                className="w-full bg-zinc-100 pl-10 pr-4 py-3 rounded-lg outline-black text-sm truncate"
                value={destinationLocation}
                onChange={onChangeHandler}
                autoComplete="off"
              />
            </div>
          </div>
          {pickupLocation.length > 2 && destinationLocation.length > 2 && (
            <Button
              title={"Buscar"}
              loading={loading}
              fun={() => {
                getDistanceAndFare(pickupLocation, destinationLocation);
              }}
            />
          )}

          <div className="w-full h-full overflow-y-scroll ">
            {locationSuggestion.length > 0 && (
              <LocationSuggestions
                suggestions={locationSuggestion}
                setSuggestions={setLocationSuggestion}
                setPickupLocation={setPickupLocation}
                setDestinationLocation={setDestinationLocation}
                input={selectedInput}
              />
            )}
          </div>
        </div>
      )}

      {/* Panel de selección de vehículo */}
      <SelectVehicle
        selectedVehicle={setSelectedVehicle}
        showPanel={showSelectVehiclePanel}
        setShowPanel={setShowSelectVehiclePanel}
        showPreviousPanel={setShowFindTripPanel}
        showNextPanel={setShowRideDetailsPanel}
        fare={fare}
        title="Selecciona tu vehículo"
      />

      {/* Panel de detalles del viaje */}
      <RideDetails
        pickupLocation={pickupLocation}
        destinationLocation={destinationLocation}
        selectedVehicle={selectedVehicle}
        fare={fare}
        showPanel={showRideDetailsPanel}
        setShowPanel={setShowRideDetailsPanel}
        showPreviousPanel={setShowSelectVehiclePanel}
        createRide={createRide}
        cancelRide={cancelRide}
        loading={loading}
        rideCreated={rideCreated}
        confirmedRideData={confirmedRideData}
        eta={eta}
        title="Detalles del viaje"
      />
    </div>
  );
}

export default UserHomeScreen;
