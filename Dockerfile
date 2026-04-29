FROM mcr.microsoft.com/playwright:v1.59.1-jammy

RUN apt-get update && apt-get install -y tini && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm config set strict-ssl false

RUN npm install --only=production

COPY server.js .

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
