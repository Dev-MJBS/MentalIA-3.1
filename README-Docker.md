# MentalIA 3.1 - Docker Setup

## 🐳 Executar com Docker

### Opção 1: Docker Build Local
```bash
# Build da imagem
docker build -t mentalia-3.1 .

# Executar container
docker run -d -p 3000:80 --name mentalia mentalia-3.1
```

### Opção 2: Docker Compose (Recomendado)
```bash
# Executar em produção
docker-compose up -d

# Executar em desenvolvimento (com volume)
docker-compose --profile dev up -d
```

## 🌐 Acessar

- **Produção:** http://localhost:3000
- **Desenvolvimento:** http://localhost:3001

## 🔧 Comandos Úteis

```bash
# Parar containers
docker-compose down

# Ver logs
docker-compose logs -f

# Rebuild
docker-compose up --build -d

# Limpar tudo
docker-compose down -v --rmi all
```

## 📦 Deploy

### Docker Hub
```bash
# Tag da imagem
docker tag mentalia-3.1 devmjbs/mentalia-3.1:latest

# Push para Docker Hub
docker push devmjbs/mentalia-3.1:latest
```

### Deploy em produção
```bash
# Pull e executar
docker run -d -p 80:80 --name mentalia-prod devmjbs/mentalia-3.1:latest
```

## ✅ Features do Container

- ✅ **Nginx Alpine** (imagem leve ~23MB)
- ✅ **Compressão Gzip** automática
- ✅ **Cache otimizado** para PWA
- ✅ **Health check** integrado
- ✅ **Headers de segurança**
- ✅ **SPA routing** (fallback para index.html)
- ✅ **Service Worker** sem cache