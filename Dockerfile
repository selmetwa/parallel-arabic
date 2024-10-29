FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
COPY ./entrypoint.sh .
# Copy the .env.production file into the container
COPY .env.production .env

# Install sqlite3
RUN apt-get update && apt-get install -y sqlite3

# Declare build arguments for secrets
ARG OPEN_API_KEY
ARG STRIPE_SECRET
ARG PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG PUBLIC_DOMAIN
ARG PUBLIC_PRICE_ID
ARG PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY
ARG TEST_STRIPE_SECRET
ARG PUBLIC_TEST_PRICE_ID
ARG PUBLIC_TEST_WEBHOOK_SECRET
ARG TEST_PUBLIC_DOMAIN

RUN OPEN_API_KEY=$OPEN_API_KEY
RUN STRIPE_SECRET=$STRIPE_SECRET
RUN PUBLIC_STRIPE_PUBLISHABLE_KEY=$PUBLIC_STRIPE_PUBLISHABLE_KEY
RUN PUBLIC_DOMAIN=$PUBLIC_DOMAIN
RUN PUBLIC_PRICE_ID=$PUBLIC_PRICE_ID
RUN PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY=$PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY
RUN TEST_STRIPE_SECRET=$TEST_STRIPE_SECRET
RUN PUBLIC_TEST_PRICE_ID=$PUBLIC_TEST_PRICE_ID
RUN PUBLIC_TEST_WEBHOOK_SECRET=$PUBLIC_TEST_WEBHOOK_SECRET
RUN TEST_PUBLIC_DOMAIN=$TEST_PUBLIC_DOMAIN

# DB migrations
ENTRYPOINT ["sh", "entrypoint.sh"]

EXPOSE 5173
CMD ["npm", "run", "dev", "--open"]