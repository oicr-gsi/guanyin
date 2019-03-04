FROM boxfuse/flyway:5 as flyway-migration
COPY sql /flyway/sql
ENTRYPOINT  "/flyway/flyway"
CMD [ "migrate" ]

FROM node:8 as webapp
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "sh", "-c", "cd /usr/src/app; mkdir logs; npm start" ]
