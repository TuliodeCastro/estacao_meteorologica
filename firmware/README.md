# 🔧 Firmware - Estação Meteorológica

Código embarcado para ESP8266 (Node Sensor e Gateway LoRa).

## 📂 Estrutura

```
firmware/
├── README.md                    (este arquivo)
├── SECURITY_GUIDELINES.md       (boas práticas de segurança)
│
├── gateway_lora/               (Receptor LoRa + Wi-Fi + Firebase)
│   ├── src/
│   │   └── main.cpp           (código principal ~270 linhas)
│   ├── include/
│   │   ├── credentials.h       (GITIGNORE - credenciais reais)
│   │   └── credentials.h.example
│   ├── platformio.ini          (configuração de build)
│   ├── SECURITY.md            (guia de segurança)
│   └── test/                  (testes)
│
└── node_sensor/               (Sensor remoto com LoRa)
    ├── src/
    │   └── main.cpp           (código principal ~270 linhas)
    ├── include/
    │   └── README
    ├── platformio.ini          (configuração de build)
    └── test/

## 📊 Módulos Explicados

### Node Sensor (`node_sensor/src/main.cpp`)

**Responsabilidade:** Coletar dados de sensores e transmitir via LoRa

**Fluxo:**
1. **Setup:** Inicializa sensores (BME280, ADS1115) e interrupções
2. **Janela Ativa (2 min):** Amostra sensores a cada 5s
   - BME280: temperatura, pressão, umidade
   - Anemômetro: pulsos do vento
   - Pluviômetro: pulsos de chuva
   - ADS1115: direção, irradiância
3. **Processamento:** Calcula médias e máximos
4. **Transmissão:** Monta CSV com checksum XOR e envia via LoRa
5. **Deep Sleep:** Dorme por 3 min (economia de bateria)

**Saída esperada (Serial @115200):**
```
=== ACORDOU — iniciando janela ativa ===
──── Médias da janela ──────────────────────
Temperatura: 25.3 °C
Pressão:     1013.2 hPa
Umidade:     65.4 %
Chuva:       0.00 mm
Vento médio: 1.23 m/s
Rajada (3s): 2.45 m/s
Direção:     180°
Irradiância: 450.2 W/m²
Amostras BME: 4
──── Payload enviado ───────────────────────
25.3,1013.2,65.4,0,0.00,1.23,2.45,180,450.2*AB
=== DORMINDO por 3 minutos ===
```

**Sensores:**
- **BME280** (I2C @ 0x76): Temperatura, Pressão, Umidade
- **ADS1115** (I2C @ 0x48): Entrada para piranômetro (A0-A1) e direção (A2)
- **Anemômetro** (GPIO0/D3): Sensor Hall com ISR debounce 5ms
- **Pluviômetro** (GPIO14/D5): Reed switch com ISR debounce 200ms

**Configurações Importantes:**
```cpp
const float PI_CONST = 3.14159265;
const int   RAIO     = 147;              // Raio do anemômetro (mm)

const unsigned long JANELA_ATIVA = 12000UL;  // 2 min ativo
const uint64_t       TEMPO_SONO   = 18e6;     // 3 min sleep

const float CAL_WM2_POR_MV = 5.0;  // TROCAR pelo certificado!
const float MM_POR_PULSO = 0.25;   // Calibração pluviômetro
```

### Gateway LoRa (`gateway_lora/src/main.cpp`)

**Responsabilidade:** Receber dados via LoRa, validar e enviar para Firebase

**Fluxo:**
1. **Setup:** Conecta Wi-Fi, inicializa Firebase, abre Serial LoRa
2. **Loop:**
   - Mantém Wi-Fi ativo (reconexão não-bloqueante)
   - Envia heartbeat a cada 15s
   - Recebe mensagens LoRa (buffer circular)
   - Valida checksum XOR
   - Envia para Firebase (com timestamp)

**Saída esperada (Serial @115200):**
```
Receptor LoRa (CSV) iniciado!
================================================
[WiFi] Conectado. IP: 192.168.1.100
Sincronizando hora via NTP
Hora sincronizada!
Firebase iniciado.
──── Mensagem recebida ─────────────────────────
Temperatura: 25.3 °C
Pressão:     1013.2 hPa
Umidade:     65.4 %
Chuva:       0.00 mm
Vento médio: 1.23 m/s
Rajada (3s): 2.45 m/s
Direção:     180°
Irradiância: 450.2 W/m²
================================================
[Firebase] Dados enviados!
[Heartbeat] OK.
```

**Dependências:**
- Firebase Arduino Client Library (v4.4.17+)
- ESP8266 Core

**Configurações Importantes:**
```cpp
const char* WIFI_SSID = "O sentido da vida, do universo e tudo mais";          // Vir de credentials.h
const char* WIFI_PASS = "42";      // Vir de credentials.h

#define FIREBASE_HOST    "..."              // Firebase URL
#define FIREBASE_API_KEY "..."              // Firebase API Key

const unsigned long INTERVALO_HEARTBEAT = 15000;  // 15s
```

## 🔐 Segurança

### Credenciais
- ✅ Armazenadas em `include/credentials.h` (não commitado)
- ✅ Template em `include/credentials.h.example`
- ✅ Protegidas por `.gitignore`

Ver: **[SECURITY_GUIDELINES.md](./SECURITY_GUIDELINES.md)**

### Firebase Rules
Configure no Firebase Console:
```json
{
  "rules": {
    "estacao": {
      "leituras": {
        ".write": "auth != null",
        ".read": "auth != null"
      },
      "status": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

## 📦 Dependências

### Node Sensor (`platformio.ini`)
```ini
lib_deps =
    adafruit/Adafruit BME280 Library@^2.3.0
    adafruit/Adafruit ADS1X15@^2.6.2
```

### Gateway LoRa (`platformio.ini`)
```ini
lib_deps =
    mobizt/Firebase Arduino Client Library for ESP8266 and ESP32 @ ^4.4.17
```

## 🔧 Calibração

### Piranômetro (Irradiância Solar)

**Procedimento:**
1. Obter certificado de calibração do piranômetro
2. Encontrar coeficiente: µV/(W/m²)
3. Convertendo para mV/(W/m²): `CAL_WM2_POR_MV`

**Exemplo:**
- Certificado: 8.5 µV/(W/m²)
- Conversão: 8.5 µV = 0.0085 mV
- Inverso: 1 / 0.0085 = 117.6 W/m² / mV
- Usar: `CAL_WM2_POR_MV = 117.6`

### Pluviômetro

**Procedimento:**
1. Identificar volume por pulso do reed switch
2. Converter para mm de chuva

**Exemplo:**
- Funil area: 60 cm²
- Volume por pulso: 15 mL
- Chuva: 15 mL / 60 cm² = 0.25 mm
- Usar: `MM_POR_PULSO = 0.25`

### Anemômetro

**Fórmula no código:**
```cpp
float rpm = (pulsos * 60000.0) / intervaloMs;
float velocidade = ((4 * PI_CONST * RAIO * rpm) / 60.0) / 1000.0;
```

**Para seu anemômetro:**
1. Medir raio (distância do pino Hall até extremidade do copo)
2. Atualizar: `const int RAIO = 147;  // em mm`

## ⚙️ Configuração Avançada

### Mudar Frequência de Amostragem

```cpp
// Node Sensor - intervalos de amostragem
const unsigned long AMOSTRA_BME_MS = 5000;   // Aumentar para menos amostras
const unsigned long AMOSTRA_DIR_MS = 5000;
const unsigned long AMOSTRA_IRR_MS = 5000;
const unsigned long JANELA_RAJADA  = 3000;   // Janela de rajada (WMO: 3s)
```

### Mudar Tempo de Ciclo

```cpp
// Node Sensor - ciclo completo
const unsigned long JANELA_ATIVA = 12000UL;  // Aumentar para 24000 = 4 min
const uint64_t       TEMPO_SONO   = 18e6;     // Aumentar para 60e6 = 10 min
```

### Mudar Intervalo de Heartbeat

```cpp
// Gateway - heartbeat para status
const unsigned long INTERVALO_HEARTBEAT = 15000;  // Aumentar para 30000 = 30s
```

## 🐛 Debugging

### Aumentar Verbosidade

Adicione ao `main.cpp`:
```cpp
#define DEBUG_SERIAL Serial
// Ou
#define DEBUG_SERIAL Serial1
```

Use antes de Serial.print():
```cpp
DEBUG_SERIAL.println("Debug info");
```

### Verificar Memória

```cpp
Serial.print("Free Heap: ");
Serial.println(ESP.getFreeHeap());
```

### Verificar Voltagem

```cpp
Serial.print("Voltage: ");
Serial.println(analogRead(A0) / 1024.0 * 3.3);  // Apenas D1/D5 mini
```

## 📚 Referências

- [ESP8266 Arduino Core](https://github.com/esp8266/Arduino)
- [Adafruit BME280 Library](https://github.com/adafruit/Adafruit_BME280_Library)
- [Adafruit ADS1115 Library](https://github.com/adafruit/Adafruit_ADS1X15)
- [Firebase ESP8266 Client](https://github.com/mobizt/Firebase-ESP8266)
- [PlatformIO Documentation](https://docs.platformio.org/)

## 📝 Histórico de Versões

- **v1.0.0** (2026-07-09) - Versão inicial com suporte básico

---
