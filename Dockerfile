FROM node:22

WORKDIR /app
COPY ./package.json ./package-lock.json /app/
RUN npm install

COPY . /app/

CMD ["npm", "test"]