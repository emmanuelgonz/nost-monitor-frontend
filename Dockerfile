FROM node:20-alpine AS nost_build
WORKDIR /var/app
COPY package*.json ./
# RUN npm install
RUN npm install -g webpack webpack-cli
COPY . .
RUN npm run build

CMD ["npm", "run", "start"]