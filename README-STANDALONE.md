# MS-Patients - Versão Standalone para AKS

Esta é a versão **standalone** do microsserviço de pacientes, projetada especificamente para deploy em **Azure Kubernetes Service (AKS)**.

## 🎯 Por que Standalone?

- ✅ **Isolamento completo** - Cada container é independente
- ✅ **Deploy independente** - Atualizações sem afetar outros serviços
- ✅ **Escalabilidade** - Escala conforme demanda específica
- ✅ **Resiliência** - Falhas isoladas não afetam outros microsserviços
- ✅ **Simplicidade** - Sem dependências externas de bibliotecas shared

## 📁 Estrutura do Projeto

```
ms-patients-standalone/
├── src/
│   ├── types/           # Tipos TypeScript internos
│   ├── mcp/            # Implementação MCP interna
│   ├── controllers/    # Controladores REST
│   ├── services/       # Lógica de negócio
│   ├── repositories/   # Acesso a dados
│   ├── middleware/     # Middlewares Express
│   ├── routes/         # Definição de rotas
│   ├── config/         # Configurações
│   └── index.ts        # Ponto de entrada
├── prisma/             # Schema do banco de dados
├── k8s/               # Manifests Kubernetes (será criado)
├── Dockerfile         # Container Docker
└── package.json       # Dependências standalone
```

## 🚀 Instalação e Execução

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Configurar Banco de Dados
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```

### 5. Build para Produção
```bash
npm run build
npm start
```

## 🐳 Docker

### Build da Imagem
```bash
docker build -t ms-patients:latest .
```

### Executar Container
```bash
docker run -p 3001:3001 --env-file .env ms-patients:latest
```

## ☸️ Deploy no AKS

### 1. Criar Namespace
```bash
kubectl create namespace lazarus-health
```

### 2. Aplicar ConfigMaps e Secrets
```bash
kubectl apply -f k8s/configmap.yaml -n lazarus-health
kubectl apply -f k8s/secrets.yaml -n lazarus-health
```

### 3. Deploy do Microsserviço
```bash
kubectl apply -f k8s/deployment.yaml -n lazarus-health
kubectl apply -f k8s/service.yaml -n lazarus-health
```

### 4. Verificar Status
```bash
kubectl get pods -n lazarus-health
kubectl get services -n lazarus-health
```

## 🔧 Configuração

### Variáveis de Ambiente Principais
- `PORT` - Porta do servidor (padrão: 3001)
- `NODE_ENV` - Ambiente (development/production)
- `DATABASE_URL` - String de conexão PostgreSQL
- `REDIS_CONNECTION_STRING` - String de conexão Redis
- `JWT_SECRET` - Chave secreta JWT

### Bancos de Dados
- **PostgreSQL** - Banco principal (write operations)
- **MongoDB/Cosmos DB** - Banco de leitura (CQRS pattern)
- **Redis** - Cache e sessões

## 📊 Monitoramento

### Health Check
```
GET /health
```

### Métricas
```
GET /metrics
```

### Logs
Os logs são enviados para stdout/stderr e podem ser coletados pelo AKS.

## 🔒 Segurança

- Autenticação JWT
- Rate limiting
- Helmet.js para headers de segurança
- Validação de entrada com Joi
- CORS configurado

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📝 API Documentation

A documentação da API está disponível em:
```
GET /api-docs
```

## 🔄 CI/CD

Este microsserviço está preparado para:
- Build automatizado no Azure DevOps
- Deploy automatizado no AKS
- Rollback automático em caso de falhas
- Monitoramento com Application Insights

## 🆘 Troubleshooting

### Erro: Cannot find module 'tsconfig-paths/register'
```bash
npm install --save-dev tsconfig-paths
```

### Erro: Database connection failed
Verifique as variáveis de ambiente de conexão com o banco.

### Erro: Redis connection failed
Verifique a string de conexão do Redis no Azure.

## 📞 Suporte

Para suporte técnico, consulte a documentação do projeto principal ou abra uma issue no repositório.

