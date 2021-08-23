FROM node:14

RUN npm install -g jest

COPY ./run_tests.sh /
COPY ./jest.config.js /
COPY ./jest.setup.js /

CMD ["bash", "run_tests.sh"]