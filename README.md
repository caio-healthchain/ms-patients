# MS Patients - Microsserviço de Gerenciamento de Pacientes

Microsserviço responsável pelo gerenciamento completo de pacientes no sistema Lazarus.

## 🎯 Funcionalidades

- **CRUD completo** de pacientes
- **Validação de dados** com regras de negócio
- **Busca avançada** com filtros e paginação
- **Padrão CQRS** com PostgreSQL (write) e Cosmos DB/MongoDB (read)
- **Cache Redis** para otimização de performance
- **Eventos Kafka/Service Bus** para integração
- **APIs REST** com documentação Swagger
- **Autenticação JWT** e controle de permissões
- **Autenticação via API Key** para endpoints específicos (guias)
- **Consulta de Guias (TISS)** via PostgreSQL, incluindo procedimentos vinculados
- **Logs estruturados** e monitoramento
- **Deploy Azure** ready

## 🏗️ Arquitetura

### Bancos de Dados (CQRS)
- **PostgreSQL (Azure Database)**: Operações de escrita
- **Cosmos DB (MongoDB API)**: Operações de leitura (MVP1)
- **MongoDB Atlas**: Migração futura
- **Redis (Azure Cache)**: Cache de consultas

### Mensageria
- **Azure Service Bus**: Eventos e mensageria (MVP1)
- **Apache Kafka**: Migração futura

### Estrutura de Pastas
```
src/
├── config/          # Configurações (DB, Kafka, Logger)
├── controllers/     # Controllers REST
├── services/        # Lógica de negócio
├── repositories/    # Acesso a dados (CQRS)
├── models/          # Modelos MongoDB
├── routes/          # Definição de rotas
├── middleware/      # Middlewares (Auth, Validation, Error)
├── validators/      # Validadores Joi
├── events/          # Handlers de eventos
├── mcp/             # Model Context Protocol (IA)
└── utils/           # Utilitários
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- PostgreSQL (Azure Database)
- Cosmos DB ou MongoDB
- Redis (Azure Cache)
- Azure Service Bus ou Kafka

### Instalação
```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Configurar variáveis no .env
# (Ver seção de configuração abaixo)

# Executar migrations do Prisma
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

### Docker
```bash
# Build da imagem
docker build -t lazarus-patients .

# Executar container
docker run -p 3001:3001 --env-file .env lazarus-patients
```

## ⚙️ Configuração

### Variáveis de Ambiente Principais

#### Azure PostgreSQL (Write Database)
```env
POSTGRES_HOST=lazarus-postgres.postgres.database.azure.com
POSTGRES_USER=lazarus_admin
POSTGRES_PASSWORD=your-password
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

#### Azure Cosmos DB (Read Database - MVP1)
```env
COSMOSDB_URI=mongodb://account:key@account.mongo.cosmos.azure.com:10255/db?ssl=true
COSMOSDB_KEY=your-cosmos-primary-key
```

#### Azure Redis Cache
```env
REDIS_HOST=lazarus-redis.redis.cache.windows.net
REDIS_PASSWORD=your-redis-access-key
REDIS_TLS=true
```

#### Azure Service Bus
```env
SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://namespace.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=key
```

#### Autenticação
```env
# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# API Key (para rotas de guias)
API_KEY=your-api-key-here
```

## 📚 API Documentation

### Endpoints Principais

#### Pacientes
- `POST /api/v1/patients` - Criar paciente
- `GET /api/v1/patients` - Listar/buscar pacientes
- `GET /api/v1/patients/:id` - Buscar por ID
- `GET /api/v1/patients/cpf/:cpf` - Buscar por CPF
- `GET /api/v1/patients/medical-record/:number` - Buscar por prontuário
- `PUT /api/v1/patients/:id` - Atualizar paciente
- `DELETE /api/v1/patients/:id` - Deletar paciente (soft delete)
- `PATCH /api/v1/patients/:id/validate` - Validar paciente

#### Utilitários
- `GET /health` - Health check
- `GET /health/detailed` - Health check detalhado
- `GET /api/v1/patients/statistics` - Estatísticas

#### Guias (TISS)
- `GET /api/v1/guides` - Listar guias (PostgreSQL). Requer API Key.
- `GET /api/v1/guides/:id` - Obter guia por ID (inclui procedimentos). Requer API Key.

Autenticação para guias:
- Enviar header: `X-API-Key: <sua_api_key>`
- Alternativa: `?api_key=<sua_api_key>` como query string

### Documentação Swagger
Após iniciar o serviço: http://localhost:3001/api-docs

## 🔐 Autenticação e Autorização

### Roles Suportadas
- `admin` - Acesso total
- `director` - Gerenciamento e relatórios
- `auditor` - Validação e auditoria
- `analyst` - Análise de faturamento
- `doctor` - Consulta e atualização básica

### Permissões por Endpoint
- **Criar paciente**: admin, director, analyst
- **Atualizar paciente**: admin, director, analyst, doctor
- **Deletar paciente**: admin, director
- **Consultar pacientes**: todos os usuários autenticados
- **Validar paciente**: admin, director, auditor
- **Estatísticas**: admin, director, analyst

### Modos de Autenticação
- **JWT Bearer**: padrão para as rotas de pacientes. Enviar no header `Authorization: Bearer <token>`.
- **API Key**: para as rotas de guias. Enviar `X-API-Key: <sua_api_key>` ou `?api_key=<sua_api_key>`.

Exemplos (PowerShell/Curl):
```powershell
# JWT - gerar token de teste
node .\gerar-token-jwt.js

# Usar JWT nas rotas de pacientes
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/v1/patients

# Usar API Key nas rotas de guias
curl -H "X-API-Key: <API_KEY>" http://localhost:3001/api/v1/guides
curl -H "X-API-Key: <API_KEY>" http://localhost:3001/api/v1/guides/123
```

## 📊 Monitoramento

### Health Checks
- `/health` - Status básico
- `/health/detailed` - Status com dependências
- `/health/ready` - Readiness probe (Kubernetes)
- `/health/live` - Liveness probe (Kubernetes)

### Logs
- Logs estruturados em JSON
- Integração com Azure Application Insights
- Níveis: error, warn, info, debug

### Métricas
- Tempo de resposta das APIs
- Status das conexões de banco
- Contadores de eventos
- Uso de cache

## 🔄 Eventos

### Eventos Publicados
- `patient.created` - Paciente criado
- `patient.updated` - Paciente atualizado
- `patient.deleted` - Paciente deletado
- `patient.validated` - Paciente validado

### Eventos Consumidos
- Eventos de auditoria
- Eventos de faturamento
- Eventos de procedimentos

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com watch
npm run test:watch

# Coverage
npm run test:coverage

# Linting
npm run lint
npm run lint:fix
```

## 🚀 Deploy Azure

### Azure Container Instances
```bash
# Build e push para Azure Container Registry
az acr build --registry lazarusregistry --image patients:latest .

# Deploy para Container Instance
az container create \
  --resource-group lazarus-rg \
  --name lazarus-patients \
  --image lazarusregistry.azurecr.io/patients:latest \
  --environment-variables @env-vars.json
```

### Azure Kubernetes Service (AKS)
```bash
# Deploy usando Kubernetes manifests
kubectl apply -f k8s/
```

## 🔧 Desenvolvimento

### Scripts Disponíveis
- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build de produção
- `npm start` - Executar produção
- `npm test` - Executar testes
- `npm run lint` - Linting
- `npm run prisma:migrate` - Executar migrations
- `npm run prisma:generate` - Gerar cliente Prisma

### Estrutura de Dados

#### Modelo de Paciente
```typescript
interface Patient {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  medicalRecordNumber: string;
  admissionDate: Date;
  roomNumber: string;
  responsibleDoctor: string;
  insurancePlan: string;
  insuranceNumber: string;
  insuranceValidity: Date;
  accommodationType: 'apartment' | 'shared';
  currentAccommodation: 'apartment' | 'shared';
  accommodationStatus: 'correct' | 'incorrect';
  observations?: string;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  validationStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

## 🤝 Integração com Outros Serviços

### MS Procedures
- Consulta de procedimentos do paciente
- Validação de portes cirúrgicos

### MS Billing
- Informações de faturamento
- Dados do convênio

### MS Audit
- Logs de auditoria
- Validações pendentes

### MS Rules Engine
- Validação automática de dados
- Aplicação de regras de negócio

## 📝 TODO

- [ ] Implementar MCP (Model Context Protocol)
- [ ] Adicionar testes de integração
- [ ] Implementar cache distribuído
- [ ] Adicionar métricas Prometheus
- [ ] Implementar backup automático
- [ ] Adicionar rate limiting por usuário
- [ ] Implementar soft delete com TTL
- [ ] Adicionar validação de documentos
- [ ] Implementar notificações push
- [ ] Adicionar suporte a múltiplos idiomas

## 📞 Suporte

Para dúvidas ou problemas:
- Email: dev@lazarus.com
- Slack: #lazarus-dev
- Issues: GitHub Issues

