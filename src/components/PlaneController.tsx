import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Plane, Gauge, ArrowUp, Compass } from 'lucide-react';
interface PlaneControllerProps {
  mapRef: React.RefObject<any>;
  onPositionUpdate: (position: { lat: number; lng: number }) => void;
  initialPosition?: { lat: number; lng: number; altitude: number };
}
const PlaneController: React.FC<PlaneControllerProps> = memo(({
  mapRef,
  onPositionUpdate,
  initialPosition
}) => {
  const [speed, setSpeed] = useState(0);
  const [altitude, setAltitude] = useState(initialPosition?.altitude || 2000);
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const animationFrameId = useRef<number>();
  const currentPosition = useRef(initialPosition || { lat: 0, lng: 0, altitude: 2000 });
  const planeModelRef = useRef<HTMLElement | null>(null);
  const isInitialized = useRef(false);
  const CONSTANTS = {
    MAX_SPEED: 300,
    MIN_SPEED: 50,
    ACCELERATION: 10,
    DECELERATION: 5,
    TURN_RATE: 2,
    PITCH_RATE: 1,
    MAX_PITCH: 45,
    ALTITUDE_CHANGE_RATE: 30,
    EARTH_RADIUS: 6371000,
    BASE_MODEL_ORIENTATION: 270,
    ROLL_ADJUSTMENT: 0,
  };
  const calculateNewPosition = useCallback((lat: number, lng: number, heading: number, distance: number) => {
    const headingRad = (heading * Math.PI) / 180;
    const latRad = lat * (Math.PI / 180);
    const lngRad = lng * (Math.PI / 180);
    const angularDistance = distance / CONSTANTS.EARTH_RADIUS;
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(headingRad)
    );
    const newLngRad = lngRad + Math.atan2(
      Math.sin(headingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );
    return {
      lat: newLatRad * (180 / Math.PI),
      lng: newLngRad * (180 / Math.PI)
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialPosition || isInitialized.current) return;
    const createPlaneModel = () => {
      const model = document.createElement('gmp-model-3d');
      model.setAttribute('data-type', 'plane');
      model.setAttribute('src', '/models/plane.glb');
      model.setAttribute('altitude-mode', 'absolute');
      model.setAttribute('scale', '600');
      model.setAttribute('orientation', `0,${CONSTANTS.BASE_MODEL_ORIENTATION},180`);
      model.style.opacity = '0';
      model.style.transition = 'opacity 0.5s';
      model.setAttribute(
        'position',
        `${initialPosition.lat},${initialPosition.lng},${initialPosition.altitude}`
      );
      model.addEventListener('load', () => {
        model.style.opacity = '1';
      });
      return model;
    };
    if (!planeModelRef.current) {
      const model = createPlaneModel();
      map.appendChild(model);
      planeModelRef.current = model;
      isInitialized.current = true;
    }
    return () => {
      if (planeModelRef.current && map.contains(planeModelRef.current)) {
        map.removeChild(planeModelRef.current);
        isInitialized.current = false;
      }
    };
  }, [mapRef, initialPosition]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(key)) {
        e.preventDefault();
        keysPressed.current.add(key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'q', 'e', 'shift'].includes(key)) {
        e.preventDefault();
        keysPressed.current.delete(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  useEffect(() => {
    let lastTimestamp = 0;
    const targetFrameTime = 1000 / 60;
    const updatePlanePosition = (timestamp: number) => {
      if (!mapRef.current || !planeModelRef.current) return;
      const deltaTime = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      if (deltaTime < targetFrameTime / 1000) {
        animationFrameId.current = requestAnimationFrame(updatePlanePosition);
        return;
      }
      lastTimestamp = timestamp;
      if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) {
        setSpeed(prev => Math.min(prev + CONSTANTS.ACCELERATION * deltaTime, CONSTANTS.MAX_SPEED));
      } else if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) {
        setSpeed(prev => Math.max(prev - CONSTANTS.ACCELERATION * deltaTime, CONSTANTS.MIN_SPEED));
      } else {
        setSpeed(prev => Math.max(CONSTANTS.MIN_SPEED, prev - CONSTANTS.DECELERATION * deltaTime));
      }
      const turnMultiplier = speed / CONSTANTS.MAX_SPEED;
      if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) {
        setHeading(prev => (prev - CONSTANTS.TURN_RATE * turnMultiplier + 360) % 360);
      }
      if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) {
        setHeading(prev => (prev + CONSTANTS.TURN_RATE * turnMultiplier) % 360);
      }
      if (keysPressed.current.has('q')) {
        setPitch(prev => Math.max(prev - CONSTANTS.PITCH_RATE, -CONSTANTS.MAX_PITCH));
      } else if (keysPressed.current.has('e')) {
        setPitch(prev => Math.min(prev + CONSTANTS.PITCH_RATE, CONSTANTS.MAX_PITCH));
      } else {
        setPitch(prev => {
          if (Math.abs(prev) < CONSTANTS.PITCH_RATE) return 0;
          return prev > 0 ? prev - CONSTANTS.PITCH_RATE : prev + CONSTANTS.PITCH_RATE;
        });
      }
      const pitchAltitudeChange = (pitch / CONSTANTS.MAX_PITCH) * CONSTANTS.ALTITUDE_CHANGE_RATE;
      let altitudeChange = pitchAltitudeChange;
      if (keysPressed.current.has(' ')) {
        altitudeChange += CONSTANTS.ALTITUDE_CHANGE_RATE;
      }
      if (keysPressed.current.has('shift')) {
        altitudeChange -= CONSTANTS.ALTITUDE_CHANGE_RATE;
      }
      setAltitude(prev => Math.max(500, Math.min(5000, prev + altitudeChange)));
      const distance = (speed * deltaTime);
      const newPosition = calculateNewPosition(
        currentPosition.current.lat,
        currentPosition.current.lng,
        heading,
        distance
      );
      currentPosition.current = {
        ...newPosition,
        altitude
      };
      planeModelRef.current.setAttribute(
        'position',
        `${newPosition.lat},${newPosition.lng},${altitude}`
      );
      const adjustedHeading = (heading + CONSTANTS.BASE_MODEL_ORIENTATION) % 360;
planeModelRef.current.setAttribute(
    'orientation',
    `${-pitch},${adjustedHeading},180` // Added 180 as Z rotation
);
      if (mapRef.current) {
        const cameraDistance = 500;
        const cameraHeight = 200;
        const cameraHeadingOffset = 180;
        const cameraPosition = calculateNewPosition(
          newPosition.lat,
          newPosition.lng,
          (heading + cameraHeadingOffset) % 360,
          cameraDistance
        );
        mapRef.current.center = {
          lat: cameraPosition.lat,
          lng: cameraPosition.lng,
          altitude: altitude + cameraHeight
        };
        mapRef.current.heading = heading;
        mapRef.current.tilt = 60 + pitch;
        onPositionUpdate(newPosition);
      }
      animationFrameId.current = requestAnimationFrame(updatePlanePosition);
    };
    animationFrameId.current = requestAnimationFrame(updatePlanePosition);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [mapRef, onPositionUpdate, calculateNewPosition, speed, heading, pitch, altitude]);
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-8 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
      <div className="flex flex-col items-center">
        <Gauge className="text-blue-500 mb-2" size={24} />
        <div className="text-lg font-bold">{Math.round(speed)}</div>
        <div className="text-sm text-gray-600">Speed</div>
      </div>
      <div className="flex flex-col items-center">
        <ArrowUp className="text-blue-500 mb-2" size={24} />
        <div className="text-lg font-bold">{Math.round(altitude)}</div>
        <div className="text-sm text-gray-600">Altitude</div>
      </div>
      <div className="flex flex-col items-center">
        <Plane className="text-blue-500 mb-2 transform -rotate-90" size={24} />
        <div className="text-sm text-gray-600">Controls:</div>
        <div className="flex items-center space-x-2 mt-1">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">W/↑</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">A/←</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">S/↓</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">D/→</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Q</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">E</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Space</kbd>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Shift</kbd>
        </div>
        <div className="text-sm text-gray-600">Q/E: Pitch Up/Down, Space: Ascend, Shift: Descend</div>
      </div>
      <div className="flex flex-col items-center">
        <Compass className="text-blue-500 mb-2" size={24} />
        <div className="text-lg font-bold">{Math.round(heading)}°</div>
        <div className="text-sm text-gray-600">Heading</div>
      </div>
    </div>
  );
});
export default PlaneController;