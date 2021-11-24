FROM --platform=linux/x86_64 node:16-bullseye

RUN npm install -g typescript ts-node

# Set up code directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app/

RUN npm install

CMD ["tail", "-f", "/dev/null"]