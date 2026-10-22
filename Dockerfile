# Motor de geração (demo): compila o template da clínica e o backend Go, depois roda o motor com Terraform.

# 1) Front da clínica gerada (Next.js standalone)
FROM node:22-alpine AS web
WORKDIR /src/clinic_template
COPY internal/clinic_template/package*.json ./
RUN npm install --no-audit --no-fund
COPY internal/clinic_template/ ./
RUN npm run build

# 2) Motor e backend da clínica (binário Linux)
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/motor ./cmd/api
RUN cd internal/clinic_template/back-end && CGO_ENABLED=0 GOOS=linux go build -o clinic_backend ./cmd/api

# 3) Imagem final: motor + Terraform + templates
FROM alpine:3.20
ARG TERRAFORM_VERSION=1.9.8
RUN apk add --no-cache ca-certificates tzdata unzip wget \
 && wget -q -O /tmp/tf.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip" \
 && unzip -q /tmp/tf.zip -d /usr/local/bin && rm /tmp/tf.zip \
 && apk del unzip wget
WORKDIR /app
COPY --from=build /out/motor ./motor
COPY --from=build /src/internal ./internal
COPY --from=build /src/internal/clinic_template/back-end/clinic_backend ./internal/clinic_template/back-end/clinic_backend
COPY --from=web /src/clinic_template/.next/standalone ./internal/clinic_template/.next/standalone
COPY --from=web /src/clinic_template/.next/static ./internal/clinic_template/.next/static
RUN mkdir -p /app/.states
EXPOSE 8005
CMD ["./motor"]
