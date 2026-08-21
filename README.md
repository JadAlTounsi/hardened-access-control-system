# Hardened Access Control System

**Status:** In Progress

## Overview
A hardware access control system using PIN and RFID/NFC as a linked two factor authentication (card scan unlocks a card specific PIN prompt). Built as a security assessment exercise rather than a standard access control build. The system will be intentionally built with no security hardening first, then attacked to identify real vulnerabilities, with each finding documented and fixed individually. All events will be logged and able to be viewed on a dashboard.

## Current State
- Working: PIN entry through keypad, LCD feedback, servo lock, buzzer feedback
- To be implemented: RFID/NFC reader, camera module, rate limiting, network layer, flash encryption
- Known insecure by design: Plaintext PIN comparison, no rate limitng, no encryption

## System Architecture

![System Architecture Diagram](docs/images/system-architecture.png)

## Design Decisions
Any changes made to the architecture of this project is documented in the ADRs in docs/adr

## Prototypes
Each prototype is built with what parts I am able to use at the time of making them. Stored in prototypes/

### [v1-pin-entry](./prototypes/v1-pin-entry/)
- Built with a 3x4 keypad, LCD1602 (Did not have the TFT display at the time), servo, and buzzer. 
- PIN auto submits on the 4th digit. 
- No MFA with RFID, purely just PIN entry and validation.
- '#' isn't used here and '*' is used to erase the last entered digit.

### [v2-pin-entry](./prototypes/v2-pin-entry/)
- The TFT display now replaces the LCD1602. 
- Still no MFA with RFID implemented.
- Instead of auto submitting on digit 4, it now requires you to manually submit with '#' on the keypad. 

### [v3-mfa](./prototypes/v3-mfa/)
- MFA is now implemented with MFRC522.
- Prompts you to scan your card before being able to access the pin screen.
- All allowed UIDs share a global pin which is an issue to be fixed in the next prototype.

### [v4-mfa](./prototypes/v4-mfa/)
- Fixes v3 global pin issue. Each approved user has their own pin they enter.
- Inactivity for 15 seconds on the pin screen sends you back to the scan screen prompting to scan your ID again.
- Lockout for 24 hours after 3 failed pin attempts.
- No way to manually reactivate a user as of this version.