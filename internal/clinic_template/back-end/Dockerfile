FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main ./cmd/api/main.go

FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/main .
# Copia o .env que foi gerado pelo motor ou o .env.example se o .env não existir
COPY .env* ./

EXPOSE 8080

CMD ["./main"]
