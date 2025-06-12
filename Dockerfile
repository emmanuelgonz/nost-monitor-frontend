# Build stage
FROM node:20-alpine AS build
WORKDIR /var/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# # Development stage
# CMD ["npm", "run", "start"]

# Production stage
FROM nginx:alpine
COPY --from=build /var/app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]