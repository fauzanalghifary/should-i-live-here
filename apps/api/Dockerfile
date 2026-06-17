FROM golang:1.24-alpine AS builder

WORKDIR /src

COPY apps/api/go.* ./
RUN go mod download

COPY apps/api/. .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/api ./cmd/api

FROM alpine:3.22

RUN addgroup -S app && adduser -S app -G app \
  && apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /out/api ./api

ENV PORT=8080

EXPOSE 8080

USER app

CMD ["./api"]
