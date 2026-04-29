# Grafana Printer

High-performance microservice optimized for capturing screenshots of complex dashboards using **Playwright** and **Node.js**. Specifically engineered to run in containerized environments, overcoming common hurdles like Canvas rendering and Lazy Loading.

## Docker Quick Start

The most efficient way to deploy this project is via Docker, as the base image includes all necessary system dependencies and fonts for Chromium.

```bash
# Clone the repository
git clone https://github.com/wesleycanela/grafana-printer
cd grafana-printer

# Start the microservice
docker-compose up -d
```

The service will be available at: `http://localhost:3000`

## Docker Compose

The `docker-compose.yml` is tuned for stability in CI/CD environments or monitoring servers:

* **Base Image:** Uses `mcr.microsoft.com/playwright` to eliminate missing library issues (`libgbm`, `nss`, etc.).
* **Shared Memory:** Configured with `shm-size: 2gb` to prevent Chromium crashes when rendering heavy, data-dense dashboards.
* **Hot Reload:** Volume mapping enabled for agile development.

## API Reference

### Render Dashboard
**POST** `/api/print`

#### Request Body
```json
{
  "targetUrl": "http://your-grafana/d/dashboard-id",
  "authHeader": "Bearer glsa_xxxx",
  "waitTime": 15000
}
```

* **targetUrl**: The full URL of the dashboard.
* **authHeader**: Grafana Service Account Token or API Key.
* **waitTime**: Delay (in ms) to ensure animations and Canvas queries finish before the capture.

**Technical Note:** If running in resource-constrained environments (RAM < 2GB), it is recommended to increase the `waitTime` to compensate for Chromium's processing latency within the container.
