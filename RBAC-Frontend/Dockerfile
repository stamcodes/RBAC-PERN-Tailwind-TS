FROM node:26-slim

RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R app:app /app

USER app

EXPOSE 5173

CMD ["npm", "run", "dev"]
