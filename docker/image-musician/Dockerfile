FROM node:19
WORKDIR /opt/app
COPY src ./
RUN npm install
ENTRYPOINT [ "node", "/opt/app/app.js" ]