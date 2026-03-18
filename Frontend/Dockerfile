FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_SERVER_URL
ARG VITE_ENVIRONMENT
ARG VITE_RIDE_TIMEOUT
ENV VITE_SERVER_URL=$VITE_SERVER_URL
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT
ENV VITE_RIDE_TIMEOUT=$VITE_RIDE_TIMEOUT
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
