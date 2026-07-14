# Technical Debt

## Current Debt

### High Priority

| Item | Description | Impact | Effort |
|------|-------------|--------|--------|
| Prisma 7 Upgrade | Breaking changes | High | High |
| E2E Testing | No integration tests | High | High |
| Email Service | No SMTP | High | Medium |
| Payment Gateway | Stub only | High | Medium |

### Medium Priority

| Item | Description | Impact | Effort |
|------|-------------|--------|--------|
| Push Notifications | Firebase not configured | Medium | Medium |
| Monitoring | No metrics | Medium | High |
| CDN | No content delivery | Medium | Low |
| SSL | No HTTPS in dev | Medium | Low |

### Low Priority

| Item | Description | Impact | Effort |
|------|-------------|--------|--------|
| Analytics | No tracking | Low | Low |
| A/B Testing | No testing framework | Low | High |
| Personalization | No dynamic content | Low | High |

## Debt Paydown Plan

### Phase 1 (Current)

- Fix critical bugs
- Add basic monitoring
- Implement email service

### Phase 2 (Next)

- Add E2E tests
- Integrate payment gateway
- Add push notifications

### Phase 3 (Future)

- Upgrade Prisma 7
- Add CDN
- Add SSL

## Related Documents

- [Known Limitations](54_KNOWN_LIMITATIONS.md)
- [Roadmap](56_ROADMAP.md)
