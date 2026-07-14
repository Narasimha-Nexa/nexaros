# QA Checklist

## Pre-Release Checklist

### Backend

- [ ] All tests passing (302/302)
- [ ] No lint errors
- [ ] No TypeScript errors
- [ ] API documentation up to date
- [ ] Database migrations tested
- [ ] Environment variables documented
- [ ] Error handling verified
- [ ] Rate limiting tested
- [ ] Authentication tested
- [ ] Authorization tested

### Flutter

- [ ] No analysis errors
- [ ] No analysis warnings
- [ ] All screens tested
- [ ] Offline mode tested
- [ ] Sync tested
- [ ] Printer integration tested
- [ ] Multi-branch tested
- [ ] Entitlements tested
- [ ] Subscription lifecycle tested

### Marketing Website

- [ ] All pages rendering
- [ ] Forms working
- [ ] SEO tags present
- [ ] Sitemap generated
- [ ] Robots.txt correct
- [ ] Links working
- [ ] Images optimized
- [ ] Mobile responsive

### Admin Portal

- [ ] All pages rendering
- [ ] Authentication working
- [ ] CRUD operations tested
- [ ] Reports generating
- [ ] Settings saving

### Docker

- [ ] All services building
- [ ] All services starting
- [ ] Health checks passing
- [ ] Logs accessible
- [ ] Volumes persisting

### Security

- [ ] Passwords hashed
- [ ] JWT tokens expiring
- [ ] Rate limiting active
- [ ] CORS configured
- [ ] CSRF protection enabled
- [ ] Input validation working
- [ ] Audit logging active

### Performance

- [ ] API response <200ms
- [ ] Page load <2s
- [ ] Real-time updates <500ms
- [ ] Database queries optimized
- [ ] Caching working

## Related Documents

- [Testing](48_TESTING.md)
- [Performance](30_PERFORMANCE.md)
