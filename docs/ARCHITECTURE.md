# 🏗️ Arquitetura - Estação Meteorológica

Visão geral da arquitetura do sistema, fluxo de dados e componentes.

## 📊 Visão Geral

```
┌─────────────────┐
│  Node Sensor    │
│  (Remoto)       │
│                 │
│ - BME280        │
│ - ADS1115       │
│ - Anemômetro    │
│ - Pluviômetro   │
│ - Piranômetro   │
│                 │
│ [ESP8266]       │
│  ├─ I2C (I²C)   │
│  ├─ GPIO (INT)  │
│  └─ UART (LoRa) │
└────────┬────────┘
         │
         │ LoRa (1278 TX)
         │ CSV + Checksum
         │ ~100m range
         │
         ▼
┌─────────────────┐
│  Gateway LoRa   │
│  (Central)      │
│                 │
│ [ESP8266]       │
│  ├─ UART (LoRa) │
│  ├─ Wi-Fi       │
│  └─ Firebase    │
│                 │
│ - RX Parser     │
│ - Checksum Val  │
│ - Firebase Push │
└────────┬────────┘
         │
         │ HTTP(S)
         │ (Porta 443)
         │
         ▼
    ☁️ Firebase
   Realtime DB
   (Nuvem Google)
```

## 🔄 Fluxo de Dados

### 1. Node Sensor - Ciclo de Amostragem (2 min ativo + 3 min sleep)

```
┌─────────────────────────────────────────────────────────────┐
│                    NODE SENSOR                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Acordar do Deep Sleep]                                     │
│           ↓                                                   │
│  [Inicializar Sensores]                                      │
│   └─ BME280, ADS1115, ISRs                                   │
│           ↓                                                   │
│  ┌─────────────────────────────────────────┐                │
│  │   JANELA ATIVA: 2 min (amostragem)       │                │
│  │                                          │                │
│  │  A cada 5s:                             │                │
│  │  ├─ BME280.read() → T, P, U             │                │
│  │  ├─ ADS1115.read(A0, A2) → Irr, Dir     │                │
│  │  └─ Acumula: temp, pres, umid, irrad    │                │
│  │                                          │                │
│  │  A cada 3s (rajada):                    │                │
│  │  ├─ Calcula v(rajada)                   │                │
│  │  └─ Guarda máximo                       │                │
│  │                                          │                │
│  │  ISRs contínuos:                        │                │
│  │  ├─ Anemômetro → hallCountTotal         │                │
│  │  ├─ Anemômetro → hallCountRajada        │                │
│  │  └─ Pluviômetro → reedCount             │                │
│  └─────────────────────────────────────────┘                │
│           ↓                                                   │
│  [Calcular Médias]                                           │
│   ├─ Temp, Pres, Umid    = Σ / n                            │
│   ├─ Vento médio          = pulsos/tempo                    │
│   ├─ Rajada máx           = máximo guardado                 │
│   ├─ Direção média        = atan2(Σsin, Σcos)               │
│   ├─ Chuva acumulada      = reedCount × MM_POR_PULSO        │
│   └─ Irradiância média    = Σ / n                           │
│           ↓                                                   │
│  [Montar Payload CSV]                                        │
│   ├─ temp,pres,umid,pulsos,chuva,                          │
│   ├─ velMS,rajada,dir,irrad                                │
│   ├─ Calcular Checksum XOR                                  │
│   └─ CSV = "25.3,1013.2,65.4,120,0.25,1.23,2.45,180,450.2*AB"  │
│           ↓                                                   │
│  [Transmitir via LoRa]                                       │
│   └─ loraSerial.println(payload)                            │
│           ↓                                                   │
│  [Aguardar 200ms]                                            │
│   └─ Dar tempo para LoRa terminar TX                        │
│           ↓                                                   │
│  [Deep Sleep por 3 min]                                      │
│   └─ ESP.deepSleep(18e6) // Economia de bateria             │
│           ↓                                                   │
│  [Acordar] → Voltar ao início                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Gateway - Recepção e Envio

```
┌─────────────────────────────────────────────────────────────┐
│                     GATEWAY                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Setup]                                                      │
│   ├─ Conectar Wi-Fi (SSID, PASS)                            │
│   ├─ Configurar NTP (sincronizar hora)                       │
│   ├─ Inicializar Firebase                                    │
│   └─ Abrir Serial LoRa (9600 baud)                          │
│           ↓                                                   │
│  ┌──────────────────────────────────┐                       │
│  │  LOOP PRINCIPAL (não-bloqueante)  │                       │
│  │                                   │                       │
│  │  ├─ Garantir Wi-Fi               │ (a cada 5s)           │
│  │  │  (reconexão automática)        │                       │
│  │  │                                │                       │
│  │  ├─ Inicializar Firebase         │ (1x na boot/reconexão)│
│  │  │  (signUp anônimo)              │                       │
│  │  │                                │                       │
│  │  ├─ Enviar Heartbeat             │ (a cada 15s)          │
│  │  │  (status/timestamp)            │                       │
│  │  │                                │                       │
│  │  ├─ Receber LoRa                 │ (contínuo)            │
│  │  │  ┌──────────────────────────┐ │                       │
│  │  │  │ Enquanto loraSerial.available():│                   │
│  │  │  │   ├─ Ler char (c)       │ │                       │
│  │  │  │   ├─ Ignorar '\r'       │ │                       │
│  │  │  │   ├─ Se '\n': processar │ │                       │
│  │  │  │   ├─ Else: buffer(rxPos++)│                       │
│  │  │  └─ Validar chars printáveis│ │                       │
│  │  │                                │                       │
│  │  └─ Processar Mensagem            │                       │
│  │      ┌────────────────────────┐  │                       │
│  │      │ 1. Encontrar '*' (sep) │  │                       │
│  │      │ 2. Calcular Checksum   │  │                       │
│  │      │ 3. Comparar com receb. │  │                       │
│  │      │ 4. Se OK: parsear CSV  │  │                       │
│  │      │ 5. Enviar Firebase     │  │                       │
│  │      └────────────────────────┘  │                       │
│  │                                   │                       │
│  └──────────────────────────────────┘                       │
│           ↓                                                   │
│  [Envio Firebase]                                            │
│   ├─ /estacao/leituras/temp      ← float                   │
│   ├─ /estacao/leituras/pres      ← float                   │
│   ├─ /estacao/leituras/umid      ← float                   │
│   ├─ /estacao/leituras/chuva     ← float                   │
│   ├─ /estacao/leituras/velMS     ← float                   │
│   ├─ /estacao/leituras/rajada    ← float                   │
│   ├─ /estacao/leituras/dir       ← int                     │
│   ├─ /estacao/leituras/direcao   ← string (N/NE/E/...)    │
│   ├─ /estacao/leituras/irrad     ← float                   │
│   ├─ /estacao/leituras/timestamp ← int (unix)              │
│   └─ /estacao/status/ultimoHeartbeat ← int (unix)          │
│           ↓                                                   │
│  [Aguardar próxima mensagem]                                 │
│   └─ Voltar ao LOOP                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📡 Protocolo LoRa

### Formato da Mensagem

```
CSV PAYLOAD (com checksum XOR):
┌──────────────────────────────────────────────────────────────┐
│ temp,pres,umid,pulsos,chuva,velMS,rajada,dir,irrad*CHECKSUM │
└──────────────────────────────────────────────────────────────┘
      └─────── Campos de dados ───┘           └── Validação ──┘

Exemplo:
25.3,1013.2,65.4,120,0.25,1.23,2.45,180,450.2*AB
```

### Cálculo do Checksum

```cpp
// XOR de todos os caracteres dos dados
uint8_t cs = 0;
for (char c in "25.3,1013.2,65.4,120,0.25,1.23,2.45,180,450.2") {
    cs ^= c;  // XOR acumulativo
}
// cs = 0xAB (exemplo)
```

**Vantagens:**
- ✅ Simples computacionalmente
- ✅ Detecta erros de corrupção
- ✅ Não garante integridade (não é criptográfico)

## 🗄️ Firebase Database Structure

```
estacao_meteorologica-479ce/
│
├── estacao/
│   ├── leituras/                    (última medição)
│   │   ├── temp: 25.3              (°C)
│   │   ├── pres: 1013.2            (hPa)
│   │   ├── umid: 65.4              (%)
│   │   ├── pulsos: 120             (contagem)
│   │   ├── chuva: 0.25             (mm)
│   │   ├── velMS: 1.23             (m/s)
│   │   ├── rajada: 2.45            (m/s)
│   │   ├── dir: 180                (graus)
│   │   ├── direcao: "Sul"          (string)
│   │   ├── irrad: 450.2            (W/m²)
│   │   └── timestamp: 1688745600   (unix)
│   │
│   └── status/
│       ├── online: true
│       └── ultimoHeartbeat: 1688745615
```

## 🔐 Segurança

### Autenticação Firebase
```
Tipo: Anônimo
├─ Usuário sem e-mail/senha
├─ UID único atribuído
└─ Baseado em Firebase Rules
```

### Firebase Rules (Recomendadas)
```json
{
  "rules": {
    "estacao": {
      "leituras": {
        ".write": "auth != null",
        ".read": "auth != null"
      },
      "status": {
        ".write": "auth != null",
        ".read": true
      }
    }
  }
}
```

### Wi-Fi
- ✅ WPA2-PSK (senha segura)
- ✅ Armazenada em `credentials.h` (não commitado)
- ⚠️ Sem criptografia entre sensor e gateway (LoRa)

## ⚡ Timings

### Node Sensor

| Evento | Duração | Notas |
|--------|---------|-------|
| Acordar | 1s | Boot ESP8266 |
| Init sensores | 500ms | I2C scan |
| Amostragem | 2 min | 24 amostras × 5s |
| Cálculo | 100ms | Processamento |
| Transmissão LoRa | 50ms | 9600 baud |
| Delay | 200ms | Deixar LoRa terminar |
| Deep sleep | 3 min | Economia de bateria |
| **Total ciclo** | **~5 min** | **Repetição** |

### Gateway

| Evento | Frequência | Notas |
|--------|-----------|-------|
| Wi-Fi check | 5s | Se desconectado, reconecta |
| Heartbeat | 15s | Status e timestamp |
| Recepção LoRa | Contínua | Buffer circular |
| Firebase push | Ao receber | Quando valida mensagem |

## 🔗 Dependências de Comunicação

```
Node Sensor              Gateway LoRa
├─ I2C Bus               ├─ UART (LoRa RX)
│  ├─ 0x76 (BME280)      └─ UART (LoRa TX)
│  └─ 0x48 (ADS1115)     
├─ GPIO (ISRs)
├─ UART (LoRa TX)
└─ 3.3V Power

Frequência LoRa: 915 MHz (Brasil) ou 868 MHz (Europa)
Baud rate: 9600
Alcance: ~100m (urbano), 500m+ (linha visada)
```

## 📈 Escalabilidade

### Múltiplos Sensores

Para adicionar mais nós sensores:

1. **Hardware:**
   - Adicionar novo D1 R2 Mini + sensores
   - LoRa TX na mesma frequência

2. **Firmware:**
   - Node Sensor: sem mudanças (TX continua igual)
   - Gateway: buffer LoRa permite múltiplas mensagens

3. **Firebase:**
   - Adicionar novo path: `/estacao/leituras/sensor2/`
   - Ou: `/sensores/{sensor_id}/leituras/`

4. **Parser Gateway:**
   - Identificar sender (não implementado no v1)
   - Recomendado para v2: adicionar ID na mensagem CSV

## 🎯 Fluxo Típico Completo

```
[T=0min] Node acorda
         ├─ Inicializa sensores
         └─ Começa amostragem

[T=2min] Termina amostragem
         ├─ Calcula médias
         ├─ Monta CSV
         ├─ Envia via LoRa
         └─ Dorme

[T=2min+50ms] Gateway recebe CSV
              ├─ Valida checksum ✅
              ├─ Parseia campos
              ├─ Envia para Firebase
              └─ Serial: "Dados enviados!"

[T=5min] Node acorda novamente
         └─ Ciclo se repete
```

## 📊 Consumo de Recursos

### Node Sensor
- **RAM:** ~30KB / 80KB disponível
- **ROM (Flash):** ~250KB / 1MB (D1 Mini)
- **Tempo boot:** ~1s

### Gateway
- **RAM:** ~50KB / 160KB disponível
- **ROM (Flash):** ~300KB / 4MB (NodeMCU)
- **Tempo boot:** ~2s

## 🔍 Monitoramento

### Logs via Serial
- **115200 baud**
- Sensor: mensagens de amostragem + payload
- Gateway: Wi-Fi, Firebase, heartbeat

### Firebase Console
- Dashboard em tempo real
- Histórico de dados
- Última atualização (timestamp)
