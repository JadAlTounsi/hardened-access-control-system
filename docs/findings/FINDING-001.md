# FINDING-001: Main and camera controller communication vulnerability

**Status**: Unconfirmed

**Date Discovered**: 08/29/2026

## Description
The camera controller needs to capture an image once 3 failed attempts have been made and the user gets locked out. That photo needs to get sent to the dashboard through the main controller and from the main controller to the dashboard via WiFi. The trigger for this event may be vulnerable to flooding.

## Discovered
I identified this while designing how the camera will send the capture to the dashboard.

## Severity
If implemented as planned, the triggered lockout could cause the main controller's loop to lock onto the image relay which prevents the keypad and RFID reader from responding while the relay is in progress.
This allows an attacker to enter wrong pins to keep triggering the lockout which then, the keypad and RFID aren't being watched while relaying the image.

## Related ADRs
1. [ADR-002: Running camera on a dedicated microcontroller](../adr/ADR-002.md)
2. [ADR-004: Lockout enforcement location](../adr/ADR-004.md)