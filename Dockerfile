FROM node:20.11.1

COPY ./package.json /
RUN npm install

COPY ./create_tests.sh /
COPY ./run_tests.sh /
COPY ./jest.config.js /
COPY ./jest.setup.js /

CMD ["bash", "run_tests.sh"]