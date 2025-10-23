// Script para gerar token JWT de teste
// Execute: node gerar-token-jwt.js

const jwt = require('jsonwebtoken');

// Payload do token (dados do usuário)
const payload = {
  userId: 'test-admin-123',
  email: 'admin@lazarus.com',
  role: 'admin',
  permissions: [
    'create:patient',
    'read:patient', 
    'update:patient',
    'delete:patient',
    'manage:patients'
  ],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expira em 24 horas
};

// Secret usado no serviço (mesmo do .env)
const secret = 'your-super-secret-jwt-key-change-this-in-production';

// Gerar o token
const token = jwt.sign(payload, secret);

console.log('🔐 TOKEN JWT GERADO PARA TESTES:');
console.log('');
console.log(token);
console.log('');
console.log('📋 COMO USAR NO POSTMAN:');
console.log('1. Vá na aba Headers');
console.log('2. Adicione: Authorization: Bearer ' + token);
console.log('');
console.log('⏰ VALIDADE: 24 horas a partir de agora');
console.log('👤 USUÁRIO: admin@lazarus.com (role: admin)');
console.log('🔑 PERMISSÕES: Todas as operações de pacientes');

