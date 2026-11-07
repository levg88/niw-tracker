# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in NIW Evidence Tracker, please report it
privately by emailing the project maintainers rather than opening a public issue.

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Supported versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | ✅ |
| Older versions | ❌ |

## Security considerations

- NIW Evidence Tracker binds to `127.0.0.1` by default. Do not expose it to untrusted networks.
- No telemetry or analytics are collected.
- Uploads are extension-checked and size-limited; filenames are sanitized.
- Data at rest is otherwise unencrypted. Use full-disk encryption and back up `data/`.
- Do not commit `.env` files or database files to version control.
