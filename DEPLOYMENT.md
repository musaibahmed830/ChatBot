# Deployment Guide

This guide covers deploying the Social Chatbot Application to production environments.

## Prerequisites

- Docker and Docker Compose
- Domain name and SSL certificate (for production)
- API keys for WhatsApp, Instagram, and Snapchat
- MongoDB database (or use the included Docker setup)

## Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ChatBot
   ```

2. **Configure environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment**
   ```bash
   curl http://localhost/health
   ```

## Production Deployment

### 1. Environment Configuration

Update `.env` with production values:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://admin:secure-password@mongodb:27017/social-chatbot?authSource=admin
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# API Keys
WHATSAPP_API_TOKEN=your-whatsapp-business-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret

SNAPCHAT_CLIENT_ID=your-snapchat-client-id
SNAPCHAT_CLIENT_SECRET=your-snapchat-client-secret

OPENAI_API_KEY=your-openai-api-key
```

### 2. SSL Certificate Setup

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `nginx/ssl/`:
   - `cert.pem` - SSL certificate
   - `key.pem` - Private key
3. Uncomment HTTPS configuration in `nginx/nginx.conf`

### 3. Database Setup

#### Option A: Use Docker MongoDB (Recommended for small deployments)
```bash
docker-compose up -d mongodb
```

#### Option B: External MongoDB
1. Set up MongoDB cluster (MongoDB Atlas recommended)
2. Update `MONGODB_URI` in `.env`
3. Remove mongodb service from `docker-compose.yml`

### 4. Deploy Backend

```bash
# Build and start services
docker-compose up -d backend nginx

# View logs
docker-compose logs -f backend
```

### 5. Mobile App Deployment

#### Android

1. **Generate signed APK**
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```

2. **Upload to Google Play Console**
   - Follow Google Play Console guidelines
   - Test on multiple devices
   - Submit for review

#### iOS

1. **Configure Xcode project**
   ```bash
   cd mobile/ios
   open SocialChatbotMobile.xcworkspace
   ```

2. **Archive and upload**
   - Select "Any iOS Device" as target
   - Product → Archive
   - Upload to App Store Connect

### 6. Webhook Configuration

Update webhook URLs in your social media platform settings:

- **WhatsApp**: `https://yourdomain.com/webhooks/whatsapp`
- **Instagram**: `https://yourdomain.com/webhooks/instagram`
- **Snapchat**: `https://yourdomain.com/webhooks/snapchat`

### 7. Monitoring and Logging

#### Health Checks
- Backend: `GET /health`
- Database: Monitor MongoDB logs
- Nginx: Check access and error logs

#### Log Management
```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# Rotate logs
docker-compose exec backend logrotate /etc/logrotate.conf
```

### 8. Backup Strategy

#### Database Backup
```bash
# Create backup
docker-compose exec mongodb mongodump --out /backup

# Restore backup
docker-compose exec mongodb mongorestore /backup
```

#### Automated Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mongodb mongodump --archive | gzip > "backup_${DATE}.gz"
```

### 9. Scaling

#### Horizontal Scaling
1. Use load balancer (AWS ALB, Nginx, etc.)
2. Deploy multiple backend instances
3. Use Redis for session management
4. Consider MongoDB replica sets

#### Vertical Scaling
1. Increase container resources
2. Optimize database queries
3. Implement caching strategies
4. Use CDN for static assets

### 10. Security Considerations

1. **API Security**
   - Use HTTPS everywhere
   - Implement rate limiting
   - Validate all inputs
   - Use secure JWT secrets

2. **Database Security**
   - Use strong passwords
   - Enable authentication
   - Restrict network access
   - Regular security updates

3. **Container Security**
   - Use non-root users
   - Scan images for vulnerabilities
   - Keep base images updated
   - Limit container privileges

### 11. Troubleshooting

#### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"
   ```

2. **API Not Responding**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Test API endpoint
   curl -v http://localhost/api/health
   ```

3. **Webhook Issues**
   ```bash
   # Check webhook logs
   docker-compose logs backend | grep webhook
   
   # Test webhook endpoint
   curl -X POST http://localhost/webhooks/whatsapp
   ```

#### Performance Optimization

1. **Database Indexing**
   ```javascript
   // Add indexes for frequently queried fields
   db.conversations.createIndex({ userId: 1, lastMessageTime: -1 })
   db.users.createIndex({ email: 1 })
   ```

2. **Caching**
   - Implement Redis caching for user sessions
   - Cache frequently accessed data
   - Use CDN for static assets

3. **Monitoring**
   - Set up application monitoring (New Relic, DataDog)
   - Monitor database performance
   - Track API response times

### 12. Maintenance

#### Regular Tasks
- Update dependencies monthly
- Monitor disk space
- Review and rotate logs
- Backup database weekly
- Security updates

#### Updates
```bash
# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Update dependencies
npm update
docker-compose build --no-cache
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs`
2. Verify configuration: `.env` file
3. Test connectivity: `curl` commands
4. Review documentation: API endpoints

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database secured and backed up
- [ ] Webhook URLs updated
- [ ] Monitoring configured
- [ ] Logging setup
- [ ] Backup strategy implemented
- [ ] Security measures in place
- [ ] Performance optimized
- [ ] Documentation updated
