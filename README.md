```sh
# Sobe só a infra (kafka, postgres, redis, observabilidade)
make up-infra

# Aguarda serviços ficarem healthy, então roda as migrations
make migrate

# Builda e sobe os microserviços
make build
make up-services
```

No dia a dia

```sh
make up          # sobe tudo
make down        # para tudo
make logs        # logs em tempo real
make logs-svc s=auth-service   # logs de um serviço
make health      # checa /health de todos
make ps          # status dos containers
```

