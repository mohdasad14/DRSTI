import { IncidentScenario } from '../types/incident';

export const INCIDENT_SCENARIOS: IncidentScenario[] = [
  {
    id: 'db-pool-exhaustion',
    incidentCode: 'INC-1042',
    shortTitle: 'Database Connection Failure',
    detectedTime: '14:32:01',
    impactSummary: 'Checkout requests returning HTTP 504',
    affectedServicesList: ['api-gateway', 'order-service', 'PostgreSQL'],
    suspectedSourceService: 'PostgreSQL',
    dependencyChain: [
      { name: 'api-gateway', type: 'Gateway' },
      { name: 'order-service', type: 'Microservice' },
      { name: 'PostgreSQL', type: 'Primary Database', isSuspected: true }
    ],
    title: 'PostgreSQL Connection Pool Exhaustion in order-service',
    category: 'Database / Resource Starvation',
    severity: 'P1',
    description: 'Active database connection pool in order-service saturated at 100/100 following deployment v1.4.2 due to unreleased connections in transaction block. Downstream checkout routes timing out.',
    groundTruthCause: 'PostgreSQL connection pool exhaustion in order-service',
    groundTruthOriginService: 'order-service',
    expectedRiskLevel: 'HIGH',
    recommendedCommand: 'kubectl rollout restart deployment/order-service -n production',
    rollbackCommand: 'kubectl rollout undo deployment/order-service -n production',
    telemetry: {
      logs: [
        {
          id: 'log-1',
          timestamp: 1711400000,
          level: 'WARN',
          service: 'order-service',
          message: 'Connection acquisition latency exceeded 1500ms for pool [HikariPool-1]',
          metadata: { poolName: 'HikariPool-1', timeoutMs: 1500 }
        },
        {
          id: 'log-2',
          timestamp: 1711400002,
          level: 'ERROR',
          service: 'order-service',
          message: 'Timeout acquiring connection from pool HikariPool-1 (connection-timeout: 30000ms)',
          metadata: { active: 100, idle: 0, waiting: 412 }
        },
        {
          id: 'log-3',
          timestamp: 1711400004,
          level: 'ERROR',
          service: 'api-gateway',
          message: 'Upstream HTTP 504 Gateway Timeout while proxying POST /api/v1/orders/checkout',
          metadata: { upstream: 'order-service:8080', latency_ms: 30012 }
        },
        {
          id: 'log-4',
          timestamp: 1711400008,
          level: 'WARN',
          service: 'postgres-primary',
          message: 'max_connections reached client limit (current: 100, max: 100) for user order_app',
          metadata: { user: 'order_app', client_ip: '10.244.3.41' }
        }
      ],
      metrics: [
        {
          id: 'm-1',
          timestamp: 1711400005,
          service: 'order-service',
          metric: 'active_connections',
          value: 100,
          unit: 'conns',
          threshold: 85,
          historical: [24, 28, 35, 62, 88, 98, 100, 100]
        },
        {
          id: 'm-2',
          timestamp: 1711400006,
          service: 'order-service',
          metric: 'connection_wait_time_p99',
          value: 14850,
          unit: 'ms',
          threshold: 250,
          historical: [12, 14, 15, 840, 4200, 11200, 14850]
        },
        {
          id: 'm-3',
          timestamp: 1711400007,
          service: 'api-gateway',
          metric: 'http_5xx_rate',
          value: 38.4,
          unit: '%',
          threshold: 1.0,
          historical: [0.02, 0.05, 0.1, 4.2, 18.5, 34.0, 38.4]
        }
      ],
      traces: [
        {
          id: 'tr-1',
          timestamp: 1711400010,
          traceId: 'tr-9981-a',
          span: 'POST /api/v1/checkout',
          service: 'api-gateway',
          duration_ms: 5200,
          status: 'error',
          errorMessage: '504 Gateway Timeout'
        },
        {
          id: 'tr-2',
          timestamp: 1711400011,
          traceId: 'tr-9981-a',
          span: 'OrderController.createOrder',
          service: 'order-service',
          duration_ms: 5180,
          status: 'error',
          parentSpan: 'POST /api/v1/checkout',
          errorMessage: 'SQLException: Connection pool exhausted'
        },
        {
          id: 'tr-3',
          timestamp: 1711400012,
          traceId: 'tr-9981-a',
          span: 'HikariPool.getConnection',
          service: 'order-service',
          duration_ms: 5000,
          status: 'error',
          parentSpan: 'OrderController.createOrder',
          errorMessage: 'Timeout: 5000ms'
        }
      ],
      deployment_metadata: {
        service: 'order-service',
        version: 'v1.4.2',
        deployed_ago_min: 45,
        commitHash: '7f9a2bc',
        author: 'sre-dev-team',
        diffSummary: 'feat: add transaction lock for inventory deduct without finally release()',
        commitMessage: 'feat(order): optimize inventory lock in transaction block'
      }
    }
  },
  {
    id: 'memory-leak-oom',
    incidentCode: 'INC-1043',
    shortTitle: 'JVM Heap Exhaustion & OOM',
    detectedTime: '15:11:10',
    impactSummary: 'Payment transactions failing & service pods in CrashLoopBackOff',
    affectedServicesList: ['api-gateway', 'order-service', 'payment-service'],
    suspectedSourceService: 'payment-service',
    dependencyChain: [
      { name: 'api-gateway', type: 'Gateway' },
      { name: 'order-service', type: 'Microservice' },
      { name: 'payment-service', type: 'Worker / JVM', isSuspected: true }
    ],
    title: 'JVM Heap Exhaustion & Cascading OOMKilled in payment-service',
    category: 'Compute / Memory Leak',
    severity: 'P1',
    description: 'payment-service v2.1.0 introduced an unbounded in-memory idempotency cache that fails to evict stale keys, causing repetitive pod restarts (CrashLoopBackOff) and payment queue gridlock.',
    groundTruthCause: 'JVM Heap Exhaustion and OOMKilled restarts in payment-service',
    groundTruthOriginService: 'payment-service',
    expectedRiskLevel: 'HIGH',
    recommendedCommand: 'kubectl set env deployment/payment-service CACHE_MAX_SIZE=50000 -n production && kubectl rollout restart deployment/payment-service',
    rollbackCommand: 'kubectl rollout undo deployment/payment-service -n production',
    telemetry: {
      logs: [
        {
          id: 'log-oom-1',
          timestamp: 1711410010,
          level: 'WARN',
          service: 'payment-service',
          message: 'JVM GC overhead limit exceeded: 98% CPU spent in garbage collection for last 2m',
          metadata: { heapUsedBytes: 4182900000, heapMaxBytes: 4294967296 }
        },
        {
          id: 'log-oom-2',
          timestamp: 1711410025,
          level: 'FATAL',
          service: 'kube-system',
          message: 'Killed process 48192 (java) total-vm: 5821040kB, anon-rss: 4194304kB (OOMKilled)',
          metadata: { pod: 'payment-service-78b9d-4kx99', exitCode: 137 }
        },
        {
          id: 'log-oom-3',
          timestamp: 1711410030,
          level: 'ERROR',
          service: 'order-service',
          message: 'Downstream call to payment-service failed: Connection refused (endpoint unavailable)',
          metadata: { target: 'http://payment-service:8080/charge' }
        }
      ],
      metrics: [
        {
          id: 'm-oom-1',
          timestamp: 1711410015,
          service: 'payment-service',
          metric: 'jvm_memory_used_percent',
          value: 99.4,
          unit: '%',
          threshold: 85,
          historical: [45, 58, 71, 84, 92, 97, 99.4]
        },
        {
          id: 'm-oom-2',
          timestamp: 1711410026,
          service: 'payment-service',
          metric: 'pod_restart_count',
          value: 12,
          unit: 'restarts',
          threshold: 1,
          historical: [0, 1, 3, 6, 8, 10, 12]
        },
        {
          id: 'm-oom-3',
          timestamp: 1711410032,
          service: 'order-service',
          metric: 'failed_checkout_rate',
          value: 54.2,
          unit: '%',
          threshold: 0.5,
          historical: [0.1, 0.2, 5.4, 21.0, 48.0, 54.2]
        }
      ],
      traces: [
        {
          id: 'tr-oom-1',
          timestamp: 1711410020,
          traceId: 'tr-oom-887',
          span: 'POST /charge/credit-card',
          service: 'payment-service',
          duration_ms: 12400,
          status: 'error',
          errorMessage: 'Pod terminated abruptly (SIGKILL 137)'
        },
        {
          id: 'tr-oom-2',
          timestamp: 1711410021,
          traceId: 'tr-oom-887',
          span: 'IdempotencyFilter.cacheKey',
          service: 'payment-service',
          duration_ms: 12380,
          status: 'error',
          parentSpan: 'POST /charge/credit-card',
          errorMessage: 'OutOfMemoryError: Java heap space'
        }
      ],
      deployment_metadata: {
        service: 'payment-service',
        version: 'v2.1.0',
        deployed_ago_min: 120,
        commitHash: '3a410ef',
        author: 'payments-core-dev',
        diffSummary: 'feat: add local in-memory HashMap for idempotency key caching without TTL eviction',
        commitMessage: 'perf(payment): cache idempotency tokens in local RAM'
      }
    }
  },
  {
    id: 'canary-envoy-routing',
    incidentCode: 'INC-1044',
    shortTitle: 'Envoy Canary TLS Routing Drop',
    detectedTime: '16:04:05',
    impactSummary: '100% canary route traffic receiving HTTP 503 bad certificate',
    affectedServicesList: ['ingress-controller', 'api-gateway'],
    suspectedSourceService: 'ingress-controller',
    dependencyChain: [
      { name: 'ingress-controller', type: 'Envoy Ingress', isSuspected: true },
      { name: 'api-gateway', type: 'API Gateway' }
    ],
    title: 'Envoy Canary Route Misconfiguration & TLS Handshake Drop',
    category: 'Networking / Traffic Routing',
    severity: 'P2',
    description: 'Envoy ingress route weights inadvertently shifted 100% of user traffic to an experimental canary endpoint lacking valid mutual TLS credentials, generating widespread HTTP 503 errors.',
    groundTruthCause: 'Envoy canary route weights misconfigured to 100% with invalid mTLS certs',
    groundTruthOriginService: 'ingress-controller',
    expectedRiskLevel: 'MEDIUM',
    recommendedCommand: 'kubectl patch virtualservice api-gateway -n istio-system --type merge -p \'{"spec":{"http":[{"route":[{"destination":{"host":"api-gateway","subset":"v1"},"weight":100}]}]}}\'',
    rollbackCommand: 'kubectl rollout undo virtualservice/api-gateway -n istio-system',
    telemetry: {
      logs: [
        {
          id: 'log-can-1',
          timestamp: 1711420005,
          level: 'ERROR',
          service: 'ingress-controller',
          message: 'upstream connect error or disconnect/reset before headers. reset reason: connection termination',
          metadata: { cluster: 'outbound|443||api-gateway-canary.prod.svc.cluster.local' }
        },
        {
          id: 'log-can-2',
          timestamp: 1711420007,
          level: 'WARN',
          service: 'ingress-controller',
          message: 'SSL routines:OPENSSL_internal:SSLV3_ALERT_BAD_CERTIFICATE in peer handshake',
          metadata: { sni: 'api-gateway-canary' }
        }
      ],
      metrics: [
        {
          id: 'm-can-1',
          timestamp: 1711420010,
          service: 'ingress-controller',
          metric: 'canary_traffic_weight',
          value: 100,
          unit: '%',
          threshold: 10,
          historical: [0, 5, 10, 100, 100]
        },
        {
          id: 'm-can-2',
          timestamp: 1711420012,
          service: 'ingress-controller',
          metric: 'ssl_handshake_failures_per_sec',
          value: 1240,
          unit: 'req/s',
          threshold: 5,
          historical: [0, 0, 8, 420, 1240]
        }
      ],
      traces: [
        {
          id: 'tr-can-1',
          timestamp: 1711420015,
          traceId: 'tr-can-331',
          span: 'GET /api/v1/health',
          service: 'ingress-controller',
          duration_ms: 18,
          status: 'error',
          errorMessage: '503 Service Unavailable: bad upstream cert'
        }
      ],
      deployment_metadata: {
        service: 'ingress-controller',
        version: 'v1.18.4',
        deployed_ago_min: 15,
        commitHash: '9d8e721',
        author: 'traffic-infra',
        diffSummary: 'config: update istio VirtualService canary weight from 5% to 100%',
        commitMessage: 'infra: promote canary route to 100% ahead of scheduled load test'
      }
    }
  },
  {
    id: 'kafka-consumer-lag-storm',
    incidentCode: 'INC-1045',
    shortTitle: 'Kafka Consumer Rebalance Storm',
    detectedTime: '17:20:02',
    impactSummary: 'Inventory consumer lag surging past 850,000 unread events',
    affectedServicesList: ['inventory-worker', 'kafka-cluster'],
    suspectedSourceService: 'inventory-worker',
    dependencyChain: [
      { name: 'inventory-worker', type: 'Stream Worker', isSuspected: true },
      { name: 'kafka-cluster', type: 'Message Broker' }
    ],
    title: 'Kafka Partition Rebalance Storm & Inventory Consumer Lag',
    category: 'Messaging / Stream Processing',
    severity: 'P2',
    description: 'Heavy GC pauses on inventory-worker triggered Kafka heartbeat expiration, inducing a continuous rebalance loop across consumer partitions. Consumer lag surged past 850,000 messages.',
    groundTruthCause: 'Kafka heartbeat timeout inducing continuous partition rebalance loop in inventory-worker',
    groundTruthOriginService: 'inventory-worker',
    expectedRiskLevel: 'LOW',
    recommendedCommand: 'kubectl scale deployment inventory-worker --replicas=8 -n production',
    rollbackCommand: 'kubectl scale deployment inventory-worker --replicas=3 -n production',
    telemetry: {
      logs: [
        {
          id: 'log-kfk-1',
          timestamp: 1711430002,
          level: 'WARN',
          service: 'inventory-worker',
          message: 'Member inventory-worker-pod-2 sending LeaveGroup request due to heartbeat expiration',
          metadata: { sessionTimeoutMs: 10000, heartbeatIntervalMs: 3000 }
        },
        {
          id: 'log-kfk-2',
          timestamp: 1711430004,
          level: 'ERROR',
          service: 'inventory-worker',
          message: 'CommitFailedException: Commit cannot be completed since the group has already rebalanced',
          metadata: { group: 'inventory-deduct-cg', generation: 42 }
        }
      ],
      metrics: [
        {
          id: 'm-kfk-1',
          timestamp: 1711430010,
          service: 'inventory-worker',
          metric: 'consumer_lag_total',
          value: 864200,
          unit: 'messages',
          threshold: 50000,
          historical: [1200, 4500, 24000, 180000, 520000, 864200]
        },
        {
          id: 'm-kfk-2',
          timestamp: 1711430012,
          service: 'inventory-worker',
          metric: 'rebalances_last_hour',
          value: 37,
          unit: 'rebalances',
          threshold: 2,
          historical: [0, 1, 4, 12, 28, 37]
        }
      ],
      traces: [
        {
          id: 'tr-kfk-1',
          timestamp: 1711430018,
          traceId: 'tr-kfk-552',
          span: 'KafkaConsumer.poll()',
          service: 'inventory-worker',
          duration_ms: 18400,
          status: 'error',
          errorMessage: 'RebalanceInProgressException: partition revocation'
        }
      ],
      deployment_metadata: {
        service: 'inventory-worker',
        version: 'v1.9.0',
        deployed_ago_min: 90,
        commitHash: '22b7a91',
        author: 'async-worker-team',
        diffSummary: 'config: reduced max.poll.interval.ms from 300000 to 15000 without batch size tuning',
        commitMessage: 'tune: decrease consumer poll interval for tighter latency'
      }
    }
  },
  {
    id: 'sparse-telemetry-probe-required',
    incidentCode: 'INC-1046',
    shortTitle: 'Intermittent Socket Drops',
    detectedTime: '18:02:01',
    impactSummary: 'Auth token handshake failures & TCP SYN backlog saturation',
    affectedServicesList: ['api-gateway', 'auth-service'],
    suspectedSourceService: 'auth-service',
    dependencyChain: [
      { name: 'api-gateway', type: 'Gateway' },
      { name: 'auth-service', type: 'Auth Service', isSuspected: true }
    ],
    title: 'Intermittent Socket Drops (Sparse Telemetry / Insufficiency Trigger)',
    category: 'Verification Edge Case',
    severity: 'P3',
    description: 'Initial alert fired on packet drops, but telemetry contains only 1 ambiguous log. The Verification Agent flags INSUFFICIENT_EVIDENCE (confidence < 0.75, count < 2) and initiates an automated eBPF socket probe before proceeding!',
    groundTruthCause: 'TCP SYN backlog overflow in auth-service due to SYN flood surge',
    groundTruthOriginService: 'auth-service',
    expectedRiskLevel: 'MEDIUM',
    recommendedCommand: 'sysctl -w net.ipv4.tcp_max_syn_backlog=8192 && sysctl -w net.core.somaxconn=8192',
    rollbackCommand: 'sysctl -w net.ipv4.tcp_max_syn_backlog=1024 && sysctl -w net.core.somaxconn=1024',
    insufficientInitially: true,
    telemetry: {
      logs: [
        {
          id: 'log-sparse-1',
          timestamp: 1711440001,
          level: 'WARN',
          service: 'auth-service',
          message: 'Client TCP connection reset by peer during TLS handshake',
          metadata: { client: '198.51.100.22' }
        }
      ],
      metrics: [
        {
          id: 'm-sparse-1',
          timestamp: 1711440005,
          service: 'auth-service',
          metric: 'tcp_resets_per_sec',
          value: 48,
          unit: 'rst/s',
          threshold: 20,
          historical: [2, 3, 5, 14, 48]
        }
      ],
      traces: [],
      deployment_metadata: {
        service: 'auth-service',
        version: 'v3.0.1',
        deployed_ago_min: 480,
        commitHash: '88c12fa',
        author: 'sec-infra',
        diffSummary: 'chore: bump base alpine container image',
        commitMessage: 'chore: update base image to alpine:3.19'
      }
    },
    supplementalTelemetry: {
      logs: [
        {
          id: 'log-probe-ebpf-1',
          timestamp: 1711440010,
          level: 'ERROR',
          service: 'auth-service',
          message: 'Kernel eBPF tcp_probe: ListenOverflows counter incremented by 1420 in 5s',
          metadata: { probeType: 'kprobe:tcp_v4_syn_recv_sock', drops: 1420 }
        },
        {
          id: 'log-probe-ebpf-2',
          timestamp: 1711440012,
          level: 'ERROR',
          service: 'auth-service',
          message: 'SYN backlog overflow: 1024/1024 entries full. Incoming connections dropped silently',
          metadata: { backlog: 1024, max_syn_backlog: 1024 }
        }
      ],
      traces: [
        {
          id: 'tr-probe-1',
          timestamp: 1711440014,
          traceId: 'tr-probe-99',
          span: 'POST /oauth/token',
          service: 'auth-service',
          duration_ms: 10020,
          status: 'error',
          errorMessage: 'ETIMEDOUT: Connection dropped before SYN-ACK'
        }
      ]
    }
  }
];

export const TOPOLOGY_NODES = [
  { id: 'client', name: 'Web/Mobile Client', type: 'gateway' as const, status: 'nominal' as const, p99LatencyMs: 45, errorRatePercent: 0.1, activeIncidents: 0, x: 80, y: 160, dependencies: ['ingress-controller'] },
  { id: 'ingress-controller', name: 'Ingress Controller (Envoy)', type: 'gateway' as const, status: 'nominal' as const, p99LatencyMs: 12, errorRatePercent: 0.05, activeIncidents: 0, x: 260, y: 160, dependencies: ['api-gateway'] },
  { id: 'api-gateway', name: 'API Gateway', type: 'service' as const, status: 'nominal' as const, p99LatencyMs: 38, errorRatePercent: 0.2, activeIncidents: 0, x: 440, y: 160, dependencies: ['auth-service', 'order-service', 'inventory-worker'] },
  { id: 'auth-service', name: 'Auth Service', type: 'service' as const, status: 'nominal' as const, p99LatencyMs: 25, errorRatePercent: 0.0, activeIncidents: 0, x: 620, y: 60, dependencies: ['redis-cache'] },
  { id: 'order-service', name: 'Order Service', type: 'service' as const, status: 'nominal' as const, p99LatencyMs: 85, errorRatePercent: 0.4, activeIncidents: 0, x: 620, y: 160, dependencies: ['postgres-primary', 'payment-service', 'redis-cache'] },
  { id: 'payment-service', name: 'Payment Service', type: 'service' as const, status: 'nominal' as const, p99LatencyMs: 110, errorRatePercent: 0.1, activeIncidents: 0, x: 810, y: 110, dependencies: ['postgres-primary'] },
  { id: 'inventory-worker', name: 'Inventory Worker', type: 'queue' as const, status: 'nominal' as const, p99LatencyMs: 95, errorRatePercent: 0.0, activeIncidents: 0, x: 620, y: 270, dependencies: ['kafka-cluster'] },
  { id: 'postgres-primary', name: 'PostgreSQL Primary', type: 'database' as const, status: 'nominal' as const, p99LatencyMs: 8, errorRatePercent: 0.0, activeIncidents: 0, x: 810, y: 220, dependencies: [] },
  { id: 'redis-cache', name: 'Redis Cache Cluster', type: 'cache' as const, status: 'nominal' as const, p99LatencyMs: 2, errorRatePercent: 0.0, activeIncidents: 0, x: 810, y: 40, dependencies: [] },
  { id: 'kafka-cluster', name: 'Kafka Cluster (Brokers)', type: 'queue' as const, status: 'nominal' as const, p99LatencyMs: 15, errorRatePercent: 0.0, activeIncidents: 0, x: 810, y: 290, dependencies: [] }
];
