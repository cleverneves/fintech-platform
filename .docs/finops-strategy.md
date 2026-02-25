# FinOps Strategy

## Cost Optimization Decisions

### Compute
- Node groups com instâncias Spot para workloads stateless (economia ~70%)
- Autoscaling agressivo: min=1 fora de horário comercial
- Requests/Limits calibrados por real consumption (evitar over-provisioning)

### Storage
- RDS t3.small para dev, multi-AZ apenas em prod
- Redis com `maxmemory-policy allkeys-lru` para evitar OOM
- S3 Intelligent-Tiering para logs antigos

### Networking
- NAT Gateway compartilhado entre AZs (economia vs. um por AZ)
- CloudFront na frente do API Gateway (reduz egress)

### Observability
- Retenção Prometheus: 15 dias (ajustar para prod)
- Logs: CloudWatch com expiração 30 dias dev / 90 dias prod

## Estimativa Mensal (dev environment)
| Recurso         | Custo Estimado |
|----------------|----------------|
| EKS (2x t3.medium) | ~$70      |
| RDS t3.small   | ~$25           |
| ElastiCache    | ~$15           |
| MSK (Kafka)    | ~$80           |
| **Total**      | **~$190/mês**  |