FROM node:lts-alpine

RUN npm install pnpm -g

WORKDIR /app

COPY /package.json /app

COPY /pnpm-lock.yaml /app

RUN pnpm install && rm -rf /root/.npm /root/.pnpm-store /usr/local/share/.cache /tmp/*

COPY . /app

RUN pnpm build

EXPOSE 3002

CMD ["pnpm", "run", "prod"]
