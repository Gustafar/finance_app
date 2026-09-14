FROM golang:1.26-alpine AS build
WORKDIR /app

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/. .
RUN go build -o /out/api ./cmd/api
RUN go build -o /out/migrate ./cmd/migrate

FROM alpine:3.20
WORKDIR /app

COPY --from=build /out/api ./api
COPY --from=build /out/migrate ./migrate
COPY migrations ./migrations
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 9080
ENTRYPOINT ["./docker-entrypoint.sh"]
