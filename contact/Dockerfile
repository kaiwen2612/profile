FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/contact .

FROM gcr.io/distroless/static-debian12
COPY --from=build /out/contact /contact
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/contact"]
