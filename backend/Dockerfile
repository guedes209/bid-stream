# Imagem base oficial do Node.js (usando slim para compatibilidade nativa com Prisma/OpenSSL)
FROM node:20-slim

# Instala o OpenSSL, requisito fundamental para o Prisma Client funcionar no Linux
RUN apt-get update -y && apt-get install -y openssl

# Cria o diretório de trabalho dentro do servidor
WORKDIR /app

# Copia os arquivos de configuração de pacotes e o schema do banco PRIMEIRO
# Isso otimiza o cache do Docker, deixando os deploys futuros muito mais rápidos
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências do projeto
RUN npm install

# Gera o motor do Prisma Client necessário para o Banco de Dados
RUN npx prisma generate

# Copia todo o restante do código do backend para dentro do servidor
COPY . .

# Compila o código TypeScript para JavaScript puro de alta performance
RUN npm run build

# Expõe a porta (A plataforma vai injetar a variável de ambiente PORT dinamicamente)
EXPOSE 3001

# O comando mestre que mantém o servidor de Leilões no ar 24/7!
CMD ["npm", "start"]

