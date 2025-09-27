FROM node:18-alpine

# Instala dependências compatíveis
RUN apk add --no-cache openssl 

# Definir diretório de trabalho
WORKDIR /app


# Copiar arquivos de dependências
COPY package*.json ./

# Copiar o .env para dentro do container
COPY .env /app/.env

# Instalar dependências
RUN npm ci 

# Copiar código fonte
COPY . .


# Gerar Prisma Client (se usar Prisma)
RUN npx prisma generate

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando de inicialização
CMD ["npm", "start"]