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