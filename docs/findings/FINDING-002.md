# FINDING-002: Lockout bypass through power cycling

**Status**: Open

**Date Discovered**: 09/06/2026

## Description
The per-user failed attempt counter and lockout timestamp are held in RAM only. Cutting power to the controller clears both, which a locked out card will be reactivated and allows unlimited PIN guessing in batches of 3

## Discovered
I identified this while designing how the camera will send the capture to the dashboard

## Reproduction
1. Scan a registered card and enter an incorrect PIN 3 times. Confirm the card is locked out
2. Disconnect and reconnect power to the controller
3. Scan the same card. The PIN screen appears and 3 more attempts can be made
4. Repeat

## Severity
An attacker with a valid card and physical access to the controller's power source can go through the 4 steps easily which makes this a high severity risk

## Root Cause
The lockout was designed around millis(), which is a measure of uptime rather than wall clock time, so the design assumes that the device never reboots.

## Proposed Fix
TBD

## Verification 
Go through the reproduction steps and it will be fixed once step 3 returns denied.

## Related ADRs
1. [ADR-004: Lockout enforcement location](../adr/ADR-004.md)
2. [ADR-005: Lockout lasts for a duration rather than manual reactivation](../adr/ADR-005.md)