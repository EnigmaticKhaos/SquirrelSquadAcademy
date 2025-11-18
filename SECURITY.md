# Security Documentation

This document outlines the security measures implemented in SquirrelSquad Academy.

## Security Features

### 1. Input Validation & Sanitization

- **XSS Protection**: All user input is sanitized using `xss-clean` and custom validation
- **NoSQL Injection Prevention**: MongoDB queries are sanitized using `express-mongo-sanitize`
- **HTTP Parameter Pollution**: Prevented using `hpp` middleware
- **Input Sanitization**: Custom validation utilities sanitize all request body, query, and params

### 2. Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP (login, register)
- **Password Reset**: 3 requests per hour per IP
- **File Uploads**: 20 uploads per hour per IP
- **AI Operations**: 50 requests per hour per IP (course generation, recommendations, grading)
- **Public API**: 1000 requests per 15 minutes (with API key)

### 3. Security Headers

Implemented using Helmet.js:
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

### 4. Authentication & Authorization

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **2FA Support**: TOTP-based two-factor authentication
- **OAuth**: Secure OAuth 2.0 for Google, GitHub, Discord
- **Role-Based Access Control**: Admin and user roles

### 5. Message Encryption

- **End-to-End Encryption**: All direct messages are encrypted using AES-256-GCM
- **Encryption Key**: Stored in environment variable `ENCRYPTION_KEY`
- **Automatic Encryption**: Messages encrypted before storage, decrypted on retrieval

### 6. File Upload Security

- **File Type Validation**: Only allowed MIME types accepted
- **File Size Limits**: 
  - Images: 10MB
  - Videos: 500MB
  - Documents: 50MB
  - Code: 10MB
- **Virus Scanning**: Recommended for production (not implemented)
- **Secure Storage**: Files stored in Cloudinary (media) and AWS S3 (documents)

### 7. Privacy Settings Enforcement

- **Profile Visibility**: Private, friends-only, or public
- **Activity Visibility**: Control who sees user activity
- **Message Privacy**: Control who can send messages
- **Middleware**: Privacy settings enforced at route level

### 8. Content Moderation

- **AI Moderation**: Automated content checking using OpenAI
- **User Reporting**: Users can report inappropriate content
- **Auto-Warnings**: Automatic warnings for flagged content
- **Moderation Dashboard**: Admin tools for content review

### 9. GDPR Compliance

- **Data Export**: Users can export their data
- **Right to be Forgotten**: Account deletion with data removal
- **Cookie Consent**: Granular cookie consent management
- **Privacy Policy**: Version tracking and acceptance
- **Data Processing Consent**: Explicit consent for data processing

### 10. API Security

- **API Key Authentication**: Secure API key generation and validation
- **Rate Limiting**: Per-API-key rate limiting
- **IP Restrictions**: Optional IP whitelisting for API keys
- **Permissions**: Granular permissions for API keys

### 11. CORS Configuration

- **Restricted Origins**: Only allowed frontend URLs
- **Credentials**: CORS with credentials support
- **Production**: Strict CORS in production

### 12. Error Handling

- **No Information Leakage**: Errors don't expose sensitive information
- **Logging**: Security events logged for monitoring
- **Error Messages**: Generic error messages to users

## Environment Variables

### Required Security Variables

```env
# JWT
JWT_SECRET=your_strong_jwt_secret_here

# Encryption
ENCRYPTION_KEY=your_64_character_hex_encryption_key

# Database
MONGODB_URI=your_mongodb_connection_string

# CORS
FRONTEND_URL=https://squirrelsquadacademy.com
```

### Generating Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Best Practices

### For Developers

1. **Never commit secrets**: All secrets in `.env` file
2. **Use HTTPS**: Always use HTTPS in production
3. **Keep dependencies updated**: Regularly update npm packages
4. **Validate all input**: Never trust user input
5. **Use parameterized queries**: Always use Mongoose queries (prevents injection)
6. **Log security events**: Monitor for suspicious activity
7. **Regular security audits**: Review code for vulnerabilities

### For Deployment

1. **Environment Variables**: Set all required environment variables
2. **HTTPS Only**: Force HTTPS in production
3. **Rate Limiting**: Adjust rate limits based on traffic
4. **Monitoring**: Set up monitoring and alerts
5. **Backups**: Regular database backups
6. **Updates**: Keep server and dependencies updated
7. **Firewall**: Configure firewall rules
8. **DDoS Protection**: Use DDoS protection service

## Security Checklist

### Pre-Deployment

- [ ] All environment variables set
- [ ] Strong JWT_SECRET generated
- [ ] ENCRYPTION_KEY generated (64 hex characters)
- [ ] HTTPS configured
- [ ] CORS origins set correctly
- [ ] Rate limiting configured
- [ ] File upload limits set
- [ ] Security headers enabled
- [ ] Error handling tested
- [ ] Input validation tested
- [ ] Authentication tested
- [ ] Authorization tested

### Post-Deployment

- [ ] Monitor error logs
- [ ] Monitor rate limit hits
- [ ] Monitor failed login attempts
- [ ] Monitor file uploads
- [ ] Monitor API usage
- [ ] Review security logs regularly
- [ ] Update dependencies regularly
- [ ] Review and rotate secrets periodically

## Incident Response

### If Security Breach Detected

1. **Immediately**: Revoke affected tokens/keys
2. **Assess**: Determine scope of breach
3. **Contain**: Isolate affected systems
4. **Notify**: Notify affected users
5. **Fix**: Patch vulnerability
6. **Review**: Review logs and improve security
7. **Document**: Document incident and response

## Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do NOT** create a public GitHub issue
2. Email security concerns to: security@squirrelsquadacademy.com
3. Include detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## Security Updates

Security updates will be documented in:
- CHANGELOG.md
- Security advisories
- Release notes

## Compliance

- **GDPR**: Full GDPR compliance implemented
- **WCAG**: Accessibility compliance (WCAG 2.1 AA)
- **OWASP**: Following OWASP security best practices

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)

