FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN --mount=type=secret,id=OPEN_API_KEY 
    --mount=type=secret,id=STRIPE_SECRET 
    --mount=type=secret,id=PUBLIC_STRIPE_PUBLISHABLE_KEY 
    --mount=type=secret,id=PUBLIC_DOMAIN 
    --mount=type=secret,id=PUBLIC_PRICE_ID 
    --mount=type=secret,id=PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY 
    --mount=type=secret,id=TEST_STRIPE_SECRET 
    --mount=type=secret,id=PUBLIC_TEST_PRICE_ID 
    --mount=type=secret,id=PUBLIC_TEST_WEBHOOK_SECRET 
    --mount=type=secret,id=TEST_PUBLIC_DOMAIN 
    OPEN_API_KEY="$(cat /run/secrets/OPEN_API_KEY)" 
    STRIPE_SECRET="$(cat /run/secrets/STRIPE_SECRET)" 
    PUBLIC_STRIPE_PUBLISHABLE_KEY="$(cat /run/secrets/PUBLIC_STRIPE_PUBLISHABLE_KEY)" 
    PUBLIC_DOMAIN="$(cat /run/secrets/PUBLIC_DOMAIN)" 
    PUBLIC_PRICE_ID="$(cat /run/secrets/PUBLIC_PRICE_ID)" 
    PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY="$(cat /run/secrets/PUBLIC_TEST_STRIPE_PUBLISHABLE_KEY)" 
    TEST_STRIPE_SECRET="$(cat /run/secrets/TEST_STRIPE_SECRET)" 
    PUBLIC_TEST_PRICE_ID="$(cat /run/secrets/PUBLIC_TEST_PRICE_ID)" 
    PUBLIC_TEST_WEBHOOK_SECRET="$(cat /run/secrets/PUBLIC_TEST_WEBHOOK_SECRET)" 
    TEST_PUBLIC_DOMAIN="$(cat /run/secrets/TEST_PUBLIC_DOMAIN)" 

EXPOSE 5173
CMD ["npm", "run", "dev", "--open"]