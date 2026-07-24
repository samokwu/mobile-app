import { useEffect, useRef, useState } from 'react';
import { State } from 'react-native-ble-plx';

import { getBleManager, LOCKBOX_NAME, LOCKBOX_SERVICE_UUID, rememberLockbox } from '@/ble/lockbox';

export type LockboxSignal = {
  // 'unavailable' = no BLE native module (Expo Go / web), 'off' = Bluetooth
  // disabled/unauthorized, 'scanning' = looking for the board, 'found' =
  // receiving advertisements right now.
  status: 'unavailable' | 'off' | 'scanning' | 'found';
  rssi: number | null;
  distanceM: number | null;
};

// RSSI-to-distance path-loss model: d = 10^((txPower - rssi) / (10 * n)).
// txPower is the expected RSSI at 1 m; n is the environment exponent.
const TX_POWER_AT_1M = -59;
const PATH_LOSS_EXPONENT = 2.2;
// Forget the board if no advertisement arrives for this long.
const STALE_MS = 4000;
// Push UI updates at most this often (matches the design's 320 ms tick).
const UI_TICK_MS = 320;
const SMOOTHING_WINDOW = 7;

function rssiToMeters(rssi: number): number {
  return Math.pow(10, (TX_POWER_AT_1M - rssi) / (10 * PATH_LOSS_EXPONENT));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Continuously scans for the lockbox while mounted and exposes a smoothed
// RSSI + estimated distance. RSSI is noisy, so we keep a short window of
// samples and report the median.
export function useLockboxScanner(): LockboxSignal {
  const [signal, setSignal] = useState<LockboxSignal>({
    status: 'scanning',
    rssi: null,
    distanceM: null,
  });
  const samples = useRef<number[]>([]);
  const lastSeenAt = useRef(0);

  useEffect(() => {
    const bleManager = getBleManager();
    if (!bleManager) {
      setSignal({ status: 'unavailable', rssi: null, distanceM: null });
      return;
    }

    let stopped = false;

    const startScan = () => {
      bleManager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
        if (stopped || error || !device || device.rssi == null) return;
        const isLockbox =
          device.name === LOCKBOX_NAME ||
          device.localName === LOCKBOX_NAME ||
          (device.serviceUUIDs ?? []).some(
            (u) => u.toLowerCase() === LOCKBOX_SERVICE_UUID,
          );
        if (!isLockbox) return;

        rememberLockbox(device.id);
        lastSeenAt.current = Date.now();
        samples.current.push(device.rssi);
        if (samples.current.length > SMOOTHING_WINDOW) samples.current.shift();
      });
    };

    const stateSub = bleManager.onStateChange((state) => {
      if (stopped) return;
      if (state === State.PoweredOn) {
        setSignal((s) => (s.status === 'off' ? { ...s, status: 'scanning' } : s));
        startScan();
      } else {
        bleManager.stopDeviceScan();
        samples.current = [];
        setSignal({ status: 'off', rssi: null, distanceM: null });
      }
    }, true);

    const tick = setInterval(() => {
      if (stopped) return;
      const fresh = Date.now() - lastSeenAt.current < STALE_MS;
      if (!fresh || samples.current.length === 0) {
        samples.current = [];
        setSignal((s) =>
          s.status === 'found' ? { status: 'scanning', rssi: null, distanceM: null } : s,
        );
        return;
      }
      const rssi = median(samples.current);
      setSignal({
        status: 'found',
        rssi: Math.round(rssi),
        distanceM: rssiToMeters(rssi),
      });
    }, UI_TICK_MS);

    return () => {
      stopped = true;
      clearInterval(tick);
      stateSub.remove();
      bleManager.stopDeviceScan();
    };
  }, []);

  return signal;
}
