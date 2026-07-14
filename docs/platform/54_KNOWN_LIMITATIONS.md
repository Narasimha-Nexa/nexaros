# Known Limitations

## Current Limitations

### Backend

| Limitation | Description | Workaround |
|------------|-------------|------------|
| No WebSockets in Cluster | Socket.IO not cluster-ready | Use Redis adapter |
| No File Upload | Basic file handling | Manual storage |
| No Email Service | No SMTP integration | Use external service |
| No SMS Service | No SMS gateway | Use external service |
| No Payment Gateway | Stub implementation | Integrate Razorpay |

### Flutter

| Limitation | Description | Workaround |
|------------|-------------|------------|
| No Push Notifications | Firebase not configured | Use in-app only |
| No Biometric Auth | No fingerprint/face ID | Use PIN |
| No Camera Integration | No barcode scanning | Manual entry |
| No Location Services | No GPS tracking | Manual location |

### Marketing Website

| Limitation | Description | Workaround |
|------------|-------------|------------|
| No Analytics | No tracking | Add Google Analytics |
| No A/B Testing | No testing framework | Manual testing |
| No Personalization | No dynamic content | Static pages |

### Infrastructure

| Limitation | Description | Workaround |
|------------|-------------|------------|
| No Auto-Scaling | Manual scaling | Scale manually |
| No CDN | No content delivery | Use direct access |
| No SSL | No HTTPS in dev | Use reverse proxy |

## Technical Debt

| Item | Priority | Effort |
|------|----------|--------|
| Upgrade Prisma 7 | Medium | High |
| Add E2E Tests | High | High |
| Implement Email | High | Medium |
| Add Push Notifications | Medium | Medium |
| Add Payment Gateway | High | Medium |
| Add Monitoring | Medium | High |

## Related Documents

- [Technical Debt](55_TECHNICAL_DEBT.md)
- [Roadmap](56_ROADMAP.md)
