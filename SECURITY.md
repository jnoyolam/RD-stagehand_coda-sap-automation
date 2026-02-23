# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this project, please report it by:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers directly with details
3. Include steps to reproduce if possible

## Security Best Practices

### API Keys and Credentials

- **NEVER** commit `.env` files to version control
- Store sensitive data in environment variables
- Use separate API keys for development/testing/production
- Rotate API keys periodically (recommended: every 90 days)

### Environment Configuration

The `.env` file should contain:
- API keys
- Base URLs
- Sensitive configuration

Always use `.env.example` as a template and ensure actual values are never committed.

### .gitignore Coverage

This project includes comprehensive `.gitignore` rules to prevent accidental commits of:
- Environment files (`.env`, `.env.*`)
- Credential files (`credentials.json`, `secrets.json`, etc.)
- Private keys (`.key`, `.pem`, `.cert`, etc.)
- IDE configuration (`.idea/`, `.vscode/`, `.claude/`)
- Generated reports and data files

### Code Security

- Review all external dependencies regularly
- Keep dependencies updated: `npm audit` and `npm update`
- Use TypeScript for type safety
- Validate all user inputs
- Sanitize data before display in reports

### Browser Automation Security

- Only automate trusted websites
- Be aware of rate limiting and terms of service
- Use LOCAL mode to avoid exposing credentials to cloud services
- Clear browser data after sensitive operations

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Updates

This project uses:
- Stagehand 2.5.7+
- Node.js 18+
- TypeScript 5.7+

Keep all dependencies updated for security patches.
