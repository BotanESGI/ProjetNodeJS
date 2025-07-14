npm install
docker-compose up -d
npm run build
npm run start
npx http-server -p 8080 .
http://localhost:8080/index.html
http://localhost:8080/index-user.html
http://localhost:8080/index-owner.html