FROM node:latest AS base 
COPY . /app
WORKDIR /app 
RUN npm ci 


FROM gcr.io/distroless/nodejs
WORKDIR /app 
COPY --from=base /app /app 
EXPOSE 4000 
CMD ["src/index.js"]