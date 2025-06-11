# FROM node:20-alpine AS nost_build
# WORKDIR /var/app
# COPY package*.json ./
# RUN npm install
# RUN npm install -g webpack webpack-cli
# COPY . .
# RUN npm run build

# CMD ["npm", "run", "start"]

# Build stage
FROM node:20-alpine AS build
WORKDIR /var/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /var/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]