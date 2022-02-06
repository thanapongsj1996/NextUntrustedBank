FROM node:16.13.1
WORKDIR /usr/src/app

COPY . ./

# building the app
RUN npm i
RUN npm run build

ENV PORT=3000
EXPOSE 3000

# Running the app
CMD [ "npm", "run", "dev" ]