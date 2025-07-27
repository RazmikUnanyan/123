/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { BrowserMultiFormatReader } from '@zxing/library';

type DecodedVinData = Record<string, string>;

export default function VINLookup() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [vin, setVin] = useState('');
  const [decoded, setDecoded] = useState<DecodedVinData | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Cleanup on unmount: stop all media tracks & reset codeReader
    return () => {
      if (scannerRef.current?.srcObject instanceof MediaStream) {
        scannerRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      codeReader.current?.reset();
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
      if (json?.Results?.[0]) {
        setDecoded(json.Results[0]);
      } else {
        setError('Could not find data for this VIN');
      }
    } catch (e) {
      console.error(e);
      setError('Error fetching VIN data');
    }
  };

  const handleSubmit = () => {
    if (vin.length === 17) {
      decodeVIN(vin);
    } else {
      setError('VIN must be exactly 17 characters');
    }
  };

  const startScan = async () => {
    setError('');
    setDecoded(null);

    try {
      codeReader.current = new BrowserMultiFormatReader();

      // Request access to back camera explicitly
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (scannerRef.current) {
        scannerRef.current.srcObject = stream;
      }

      // List all video input devices for debugging
      const devices = await codeReader.current.listVideoInputDevices();
      console.log('Video input devices:', devices);

      const videoInputDeviceId = devices[0]?.deviceId;
      if (!videoInputDeviceId) {
        setError('No camera found on this device');
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      codeReader.current.decodeFromVideoDevice(
          videoInputDeviceId,
          scannerRef.current!,
          (result, err) => {
            if (result) {
              codeReader.current?.reset();
              const scannedVin = result.getText();
              setVin(scannedVin);
              decodeVIN(scannedVin);

              // Stop video stream after successful scan
              if (scannerRef.current?.srcObject instanceof MediaStream) {
                scannerRef.current.srcObject.getTracks().forEach((track) => track.stop());
              }
            }
            if (err && !(err.name === 'NotFoundException')) {
              console.error(err);
              setError('Error scanning VIN');
            }
          }
      );
    } catch (err) {
      console.error('getUserMedia error:', err);
      setError('Camera access denied or not available');
    }
  };

  return (
      <div style={{ padding: 16 }}>
        {isMobile ? (
            <>
              <button type="button" onClick={startScan}>
                Scan VIN
              </button>
              <video
                  ref={scannerRef}
                  style={{ width: '100%', marginTop: 10 }}
                  autoPlay
                  muted
                  playsInline
              />
            </>
        ) : (
            <div>
              <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Enter VIN (17 characters)"
                  style={{ padding: '8px', width: '300px' }}
                  maxLength={17}
              />
              <button type="button" onClick={handleSubmit} style={{ marginLeft: '8px' }}>
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
                  ['Adaptive Cruise Control', decoded.AdaptiveCruiseControl],
                  ['Blind Spot Monitoring', decoded.BlindSpotMon],
                  ['Lane Keep Assist', decoded.LaneKeepSystem],
                  ['Lane Departure Warning', decoded.LaneDepartureWarning],
                  ['Forward Collision Warning', decoded.ForwardCollisionWarning],
                  ['Automatic Emergency Braking', decoded.PedestrianAutomaticEmergencyBraking],
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
                ]
                    .filter(([, value]) => value && value !== '')
                    .map(([label, value]) => (
                        <tr key={label}>
                          <td
                              style={{
                                border: '1px solid #ccc',
                                padding: '8px',
                                fontWeight: 'bold',
                                background: '#f9f9f9',
                                width: '35%',
                              }}
                          >
                            {label}
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{value}</td>
                        </tr>
                    ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}
