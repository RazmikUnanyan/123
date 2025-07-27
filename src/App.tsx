/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function App () {
  const isMobile = useMediaQuery('(max-width: 767px)' );
  const [vin, setVin] = useState('');
  const [decoded, setDecoded] = useState<any>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      if (
          scannerRef.current &&
          scannerRef.current.srcObject instanceof MediaStream
      ) {
        scannerRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const decodeVIN = async (vinCode: string) => {
    setError('');
    setDecoded(null);
    try {
      const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vinCode}?format=json`
      );
      const json = await res.json();
      if (json.Results && json.Results[0]) {
        setDecoded(json.Results[0]);
      } else {
        setError('Не удалось найти данные по VIN');
      }
    } catch (e) {
      console.error(e);
      setError('Ошибка запроса');
    }
  };

  const handleSubmit = () => {
    if (vin.length >= 17) {
      decodeVIN(vin);
    } else {
      setError('VIN должен быть 17 символов');
    }
  };

  const startScan = () => {
    setDecoded(null);
    setError('');
    const codeReader = new BrowserMultiFormatReader();
    codeReader
        .listVideoInputDevices()
        .then((devices) => {
          const videoInputDeviceId = devices[0]?.deviceId;
          if (!videoInputDeviceId) {
            setError('Камера не найдена');
            return;
          }
          codeReader.decodeFromVideoDevice(
              videoInputDeviceId,
              scannerRef.current!,
              (result) => {
                if (result) {
                  codeReader.reset();
                  const vinCode = result.getText();
                  setVin(vinCode);
                  decodeVIN(vinCode);
                }
              }
          );
        })
        .catch((err) => {
          console.error(err);
          setError('Ошибка запуска сканнера');
        });
  };

  return (
      <div style={{ padding: 16 }}>
        {isMobile ? (
            <>
              <button onClick={startScan}>Scan VIN</button>
              <video
                  ref={scannerRef}
                  style={{ width: '100%', marginTop: 10 }}
                  autoPlay
                  muted
              />
            </>
        ) : (
            <div>
              <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Введите VIN (17 символов)"
                  style={{ padding: '8px', width: '300px' }}
              />
              <button onClick={handleSubmit} style={{ marginLeft: '8px' }}>
                Decode
              </button>
            </div>
        )}

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {decoded && (
            <div style={{ marginTop: 20 }}>
              <h3>Vehicle Information</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: '1rem' }}>
                <tbody>
                {[
                  ['VIN', decoded.VIN],
                  ['Make', decoded.Make],
                  ['Model', decoded.Model],
                  ['Model Year', decoded.ModelYear],
                  ['Body Class', decoded.BodyClass],
                  ['Trim', decoded.Trim],
                  ['Series', decoded.Series],
                  ['Drive Type', decoded.DriveType],
                  ['Fuel Type', decoded.FuelTypePrimary],
                  ['Transmission', decoded.TransmissionStyle],
                  ['Transmission Speeds', decoded.TransmissionSpeeds],
                  ['Engine Configuration', decoded.EngineConfiguration],
                  ['Engine Horsepower', decoded.EngineHP],
                  ['Displacement (L)', decoded.DisplacementL],
                  ['Cylinders', decoded.EngineCylinders],
                  ['Cruise Control (Adaptive)', decoded.AdaptiveCruiseControl],
                  ['Blind Spot Monitoring', decoded.BlindSpotMon],
                  ['Lane Keep Assist', decoded.LaneKeepSystem],
                  ['Lane Departure Warning', decoded.LaneDepartureWarning],
                  ['Forward Collision Warning', decoded.ForwardCollisionWarning],
                  ['Auto Emergency Braking', decoded.PedestrianAutomaticEmergencyBraking],
                  ['ABS', decoded.ABS],
                  ['ESC (Stability Control)', decoded.ESC],
                  ['Front Airbags', decoded.AirBagLocFront],
                  ['Curtain Airbags', decoded.AirBagLocCurtain],
                  ['Knee Airbags', decoded.AirBagLocKnee],
                  ['Seat Cushion Airbags', decoded.AirBagLocSeatCushion],
                  ['Side Airbags', decoded.AirBagLocSide],
                  ['Doors', decoded.Doors],
                  ['Seats', decoded.Seats],
                  ['Seat Belts', decoded.SeatBeltsAll],
                  ['TPMS', decoded.TPMS],
                  ['Rear Cross Traffic Alert', decoded.RearCrossTrafficAlert],
                  ['Rear Visibility System', decoded.RearVisibilitySystem],
                  ['Headlamp Type', decoded.LowerBeamHeadlampLightSource],
                  ['Plant Country', decoded.PlantCountry],
                  ['Plant State', decoded.PlantState],
                  ['Plant City', decoded.PlantCity],
                  ['Manufacturer', decoded.Manufacturer],
                  ['GVWR Class', decoded.GVWR],
                ].map(([label, value]) =>
                    value ? (
                        <tr key={label}>
                          <td style={{ border: '1px solid #ccc', padding: '8px', fontWeight: 'bold', background: '#f9f9f9' }}>{label}</td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{value}</td>
                        </tr>
                    ) : null
                )}
                </tbody>
              </table>
            </div>
        )}

      </div>
  );
};
