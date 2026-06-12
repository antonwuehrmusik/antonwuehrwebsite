# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This repository contains a single Windows batch script (`install.cmd`) that bootstraps the Claude Code CLI on Windows systems where PowerShell is unavailable. It downloads a versioned binary from `https://downloads.claude.ai/claude-code-releases`, verifies its SHA256 checksum via `certutil`, then delegates to `claude install <target>` for the actual setup.

## Running the Installer

```cmd
install.cmd [stable|latest|VERSION]
```

- Default (no argument): installs `latest`
- `stable` or `latest`: resolves to the current stable/latest release
- `VERSION`: a specific semver string, e.g. `1.0.58`

**Requirements:** 64-bit Windows (AMD64 or ARM64), `curl` on PATH.

## Architecture

The script is structured as a linear main flow followed by subroutines:

| Subroutine | Purpose |
|---|---|
| `:download_file` | Thin wrapper around `curl -fsSL` |
| `:parse_manifest` | Line-by-line JSON parser extracting the platform's SHA256 checksum from `manifest.json` |
| `:check_length` | Validates a string is exactly N characters (used to confirm a 64-hex-char checksum) |
| `:verify_checksum` | Runs `certutil -hashfile SHA256` and compares against the expected value |

**Download flow:**
1. Fetch `<BASE>/latest` → resolve version string
2. Fetch `<BASE>/<VERSION>/manifest.json` → extract platform checksum
3. Fetch `<BASE>/<VERSION>/<PLATFORM>/claude.exe` → save to `%USERPROFILE%\.claude\downloads\`
4. Verify checksum; on mismatch, delete binary and abort
5. Run `claude.exe install <TARGET>`, then delete the temporary binary

Platform is `win32-arm64` on ARM64 Windows, `win32-x64` otherwise.

## Key Constraints

- No PowerShell — this script exists specifically for environments where PowerShell is unavailable.
- `certutil` is used for hashing (built-in on Windows), not `Get-FileHash`.
- The manifest JSON parser is hand-rolled with `findstr` and `for /f` because there is no `jq` or similar tool available.
- `setlocal enabledelayedexpansion` is required throughout; all variable reads use `!VAR!` syntax inside blocks.
