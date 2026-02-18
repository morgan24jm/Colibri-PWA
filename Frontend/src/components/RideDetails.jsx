import {
  CreditCard,
  MapPinMinus,
  MapPinPlus,
  PhoneCall,
  SendHorizontal,
  Share2,
} from "lucide-react";
import Button from "./Button";

function RideDetails({
  pickupLocation,
  destinationLocation,
  selectedVehicle,
  fare,
  showPanel,
  setShowPanel,
  showPreviousPanel,
  createRide,
  cancelRide,
  loading,
  rideCreated,
  confirmedRideData,
  eta,
}) {
  const shareRide = async () => {
    try {
      const shareLink = `${window.location.origin}/ride/share/${confirmedRideData?._id}`;
      const shareText = `Sígueme en mi viaje en vivo. Estoy yendo a ${destinationLocation}. Haz clic para ver mi ubicación en tiempo real: ${shareLink}`;
      
      if (navigator.share) {
        // Usar Web Share API si está disponible (iOS/Android modernos)
        await navigator.share({
          title: 'Mi viaje en vivo',
          text: shareText,
          url: shareLink,
        });
      } else {
        // Fallback a WhatsApp
        const whatsappLink = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappLink, '_blank');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error al compartir:', error);
      }
    }
  };

  return (
    <>
      <div
        className={`${
          showPanel ? "bottom-0" : "-bottom-[60%]"
        } transition-all duration-500 absolute bg-white w-full rounded-t-xl p-4 pt-2`}
      >
        <div>
          {rideCreated && !confirmedRideData && (
            <>
              <h1 className="text-center">Buscando conductores cercanos</h1>
              <div className="overflow-y-hidden py-2 pb-2">
                <div className="h-1 rounded-full bg-blue-500 animate-ping"></div>
              </div>
            </>
          )}
          <div
            className={`flex ${
              confirmedRideData ? " justify-between " : " justify-center "
            } pt-2 pb-4`}
          >
            <div>
              <img
                className={`${
                  confirmedRideData ? "h-20" : "h-12"
                } rounded-full scale-x-[-1]`}
                src={
                  {
                    car: "/car.png",
                    bike: "/combi.png",
                    auto: "/auto.webp", // agregar más según sea necesario
                  }[selectedVehicle] || "/default.png"
                }
                alt="Vehicle"
              />
            </div>

            {confirmedRideData?._id && (
              <div className="leading-4 text-right">
                <h1 className="text-sm ">
                  {confirmedRideData?.rider?.fullname?.firstname}{" "}
                  {confirmedRideData?.rider?.fullname?.lastname}
                </h1>
                <h1 className="font-semibold">
                  {confirmedRideData?.rider?.vehicle?.number}
                </h1>
                <h1 className="capitalize text-xs text-zinc-400">
                  {confirmedRideData?.rider?.vehicle?.color}{" "}
                  {confirmedRideData?.rider?.vehicle?.type}
                </h1>
                {eta && (
                  <h1 className="text-xs font-bold text-blue-600 mt-1">
                    ETA: {eta}
                  </h1>
                )}
                <span className="mt-1 inline-block bg-black text-white px-3 py-1 rounded font-semibold">
                  OTP: {confirmedRideData?.otp}
                </span>
              </div>
            )}
          </div>
          {confirmedRideData?._id && (
            <div className="flex gap-2 mb-2">
              <Button
                type={"link"}
                path={`/user/chat/${confirmedRideData?._id}`}
                title={"Enviar un mensaje..."}
                icon={<SendHorizontal strokeWidth={1.5} size={18} />}
                classes={"bg-zinc-100 font-medium text-sm text-zinc-950"}
              />              <div className="flex items-center justify-center w-14 rounded-md bg-zinc-100 cursor-pointer hover:bg-zinc-200 transition-colors" onClick={shareRide}>
                <Share2 size={18} strokeWidth={2} color="black" />
              </div>              <div className="flex items-center justify-center w-14 rounded-md bg-zinc-100">
                <a href={"tel:" + confirmedRideData?.rider?.phone}>
                  <PhoneCall size={18} strokeWidth={2} color="black" />
                </a>
              </div>
            </div>
          )}
          <div className="mb-2">
            {/* Pickup Location */}
            <div className="flex items-center gap-3 border-t-2 py-2 px-2">
              <MapPinMinus size={18} />
              <div>
                <h1 className="text-lg font-semibold leading-5">
                  {pickupLocation.split(", ")[0]}
                </h1>
                <div className="flex">
                  <p className="text-xs text-gray-800 inline">
                    {pickupLocation.split(", ").map((location, index) => {
                      if (index > 0) {
                        return (
                          <span key={index}>
                            {location}
                            {index < pickupLocation.split(", ").length - 1 &&
                              ", "}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Destination Location */}
            <div className="flex items-center gap-3 border-t-2 py-2 px-2">
              <MapPinPlus size={18} />
              <div>
                <h1 className="text-lg font-semibold leading-5">
                  {destinationLocation.split(", ")[0]}
                </h1>
                <div className="flex">
                  <p className="text-xs text-gray-800 inline">
                    {destinationLocation.split(", ").map((location, index) => {
                      if (index > 0) {
                        return (
                          <span key={index}>
                            {location}
                            {index <
                              destinationLocation.split(", ").length - 1 &&
                              ", "}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Fare */}
            <div className="flex items-center gap-3 border-t-2 py-2 px-2">
              <CreditCard size={18} />
              <div>
                <h1 className="text-lg font-semibold leading-6">
                  $ {fare[selectedVehicle]}
                </h1>
                <p className="text-xs text-gray-800 ">Efectivo</p>
              </div>
            </div>
          </div>
          {rideCreated || confirmedRideData ? (
            <Button
              title={"Cancelar viaje"}
              loading={loading}
              classes={"bg-red-600 "}
              fun={cancelRide}
            />
          ) : (
            <Button
              title={"Confirmar viaje"}
              fun={createRide}
              loading={loading}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default RideDetails;
