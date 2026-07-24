/*
  OpenAccess lockbox — Arduino Uno R4 WiFi

  Advertises over BLE as "OpenAccess-LB" so the OpenAccess app can find the
  board and estimate distance from RSSI. Exposes one writable "unlock"
  characteristic; when the app writes to it, the built-in 12x8 LED matrix
  plays an unlock animation, stays "open" for a few seconds, then re-locks.

  Requirements:
  - Board: Arduino Uno R4 WiFi (Arduino UNO R4 Boards core)
  - Library: ArduinoBLE (install via Library Manager)

  The UUIDs below must match src/ble/lockbox.ts in the app.
*/

#include <ArduinoBLE.h>
#include "Arduino_LED_Matrix.h"

ArduinoLEDMatrix matrix;

BLEService lockboxService("19B10000-E8F2-537E-4F6C-D104768A1214");
BLEByteCharacteristic unlockChar("19B10001-E8F2-537E-4F6C-D104768A1214",
                                 BLERead | BLEWrite);

const unsigned long RELOCK_AFTER_MS = 5000;

// 12x8 bitmaps for the LED matrix.
byte LOCKED_FRAME[8][12] = {
  { 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0 },
  { 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
};

byte UNLOCKED_FRAME[8][12] = {
  { 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0 },
  { 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0 },
  { 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
  { 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0 },
};

bool unlocked = false;
unsigned long unlockedAt = 0;

void showLocked() {
  matrix.renderBitmap(LOCKED_FRAME, 8, 12);
}

void showUnlocked() {
  matrix.renderBitmap(UNLOCKED_FRAME, 8, 12);
}

void playUnlockAnimation() {
  // Quick triple blink, then the open-shackle frame.
  for (int i = 0; i < 3; i++) {
    matrix.clear();
    delay(90);
    showUnlocked();
    delay(90);
  }
}

void setup() {
  Serial.begin(115200);
  matrix.begin();
  showLocked();

  if (!BLE.begin()) {
    Serial.println("Failed to start BLE — halting.");
    while (true) {
      delay(1000);
    }
  }

  BLE.setLocalName("OpenAccess-LB");
  BLE.setDeviceName("OpenAccess-LB");
  BLE.setAdvertisedService(lockboxService);
  lockboxService.addCharacteristic(unlockChar);
  BLE.addService(lockboxService);
  unlockChar.writeValue(0);

  // 100 ms advertising interval (units of 0.625 ms) so the app's RSSI-based
  // distance readout updates smoothly.
  BLE.setAdvertisingInterval(160);
  BLE.advertise();

  Serial.println("OpenAccess lockbox advertising as OpenAccess-LB");
}

void loop() {
  BLE.poll();

  if (unlockChar.written()) {
    byte value = unlockChar.value();
    // The app writes the ASCII byte '1'; accept any nonzero value.
    if (value != 0) {
      Serial.println("Unlock command received — releasing lid.");
      unlocked = true;
      unlockedAt = millis();
      playUnlockAnimation();
    }
  }

  if (unlocked && millis() - unlockedAt > RELOCK_AFTER_MS) {
    Serial.println("Re-locking.");
    unlocked = false;
    unlockChar.writeValue(0);
    showLocked();
  }
}
