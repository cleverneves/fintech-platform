import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { Resource } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

export function initTelemetry(serviceName: string) {
    const traceExporter = new OTLPTraceExporter({
        url: process.env.OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces',
    })

    const metricExporter = new PrometheusExporter({ port: 9464 }, () => {
        console.log(`Prometheus metrics exposed on :9464/metrics`)
    })

    const sdk = new NodeSDK({
        resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: serviceName }),
        traceExporter,
        metricReader: metricExporter,
        instrumentations: [getNodeAutoInstrumentations()],
    })

    sdk.start()

    process.on('SIGTERM', () => sdk.shutdown())
    return sdk
}