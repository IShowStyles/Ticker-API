# Ticker API for realtime data visualization

Ticker API uses data protocols such as : Websockets / GraphQL / HTTP
Cached data is stored in Redis for faster access

### Roadmap

1. Frontend UI for data visualization
2. Email Notifications for price alerts using cron jobs and nodemailer
3. Containerization of the application using Docker

## Installation

Clone the repository and install dependencies:

setup redis db

```bash
git clone  https://github.com/IShowStyles/Ticker-API.git 
cd  https://github.com/IShowStyles/Ticker-API.git 
yarn install
yarn dev
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

Binance API URL

`API_KEY`

PORT for Server Setup

`PORT`

additional examples of binance API URLS

https://api.binance.com
https://api1.binance.com
https://api2.binance.com
https://api3.binance.com
https://api4.binance.com

