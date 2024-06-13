FROM node:20-alpine AS nost_build
WORKDIR /var/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

CMD ["npm", "run", "start"]