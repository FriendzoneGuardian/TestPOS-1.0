# 📋 System Requirements

The **MoneyShot** system is optimized for performance and security in a retail environment.

## Software Requirements
- **Operating System**: Windows 10/11 (Optimized for Electron Desktop experience).
- **Python**: Version 3.10 or higher.
- **Django**: Version 4.2 LTS.
- **Database**: SQLite3 (Local storage for branch resilience).
- **Browser**: Modern Chromium-based browser (Edge/Chrome) if using the web-only interface.

## Hardware Requirements
- **Processor**: Dual-core 2.0GHz or faster.
- **Memory (RAM)**: 4GB minimum (8GB recommended for Electron multitasking).
- **Storage**: 500MB free space for application + growth for local logging.
- **Display**: 1366x768 minimum resolution (Optimized for 1920x1080 "Cockpit" layout).

## Network Requirements
- **Initialization**: Internet required for dependency installation and remote syncing.
- **Runtime**: Designed for **Offline-First** operation. Transactions are logged locally and synced when a connection is available.

---
> [!NOTE]
> For production deployments, ensure the `SECRET_KEY` is moved to a secure environment variable and `DEBUG` is set to `False`.
