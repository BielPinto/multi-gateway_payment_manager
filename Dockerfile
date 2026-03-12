FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3333

# Run with TypeScript on the fly (avoid build step; ace serve uses require-ts)
CMD ["node", "ace", "serve", "--watch"]
