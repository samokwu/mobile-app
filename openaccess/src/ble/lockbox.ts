import { BleManager } from 'react-native-ble-plx';

// Must match the Arduino sketch (arduino/openaccess_lockbox).
export const LOCKBOX_NAME = 'OpenAccess-LB';
export const LOCKBOX_SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
export const UNLOCK_CHAR_UUID = '19b10001-e8f2-537e-4f6c-d104768a1214';

// One BleManager for the whole app — creating several breaks scanning.
// Created lazily: the constructor touches the BLE native module, which
// doesn't exist in Expo Go, on web, or during server-side rendering, and
// would crash at import time ("Cannot read properties of undefined
// (reading 'createClient')"). Returns null in those environments so the
// app still runs with BLE in an unavailable state.
let manager: BleManager | null | undefined;

export function getBleManager(): BleManager | null {
  if (manager !== undefined) return manager;
  try {
    manager = new BleManager();
  } catch {
    manager = null;
  }
  return manager;
}

// The finder screen records the discovered peripheral here so the unlock
// screen can connect to it without rescanning.
let lastDeviceId: string | null = null;

export function rememberLockbox(deviceId: string) {
  lastDeviceId = deviceId;
}

export function hasKnownLockbox(): boolean {
  return lastDeviceId != null;
}

// Connects, writes "1" to the unlock characteristic, then disconnects so the
// board resumes advertising. Returns false if no board was ever discovered
// or the write failed (demo mode keeps working either way).
export async function sendUnlock(): Promise<boolean> {
  const bleManager = getBleManager();
  if (!bleManager || !lastDeviceId) return false;
  try {
    bleManager.stopDeviceScan();
    const device = await bleManager.connectToDevice(lastDeviceId, { timeout: 5000 });
    await device.discoverAllServicesAndCharacteristics();
    await device.writeCharacteristicWithResponseForService(
      LOCKBOX_SERVICE_UUID,
      UNLOCK_CHAR_UUID,
      'MQ==', // base64 for "1"
    );
    await device.cancelConnection();
    return true;
  } catch {
    return false;
  }
}
