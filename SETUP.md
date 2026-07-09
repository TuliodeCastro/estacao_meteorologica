# 🚀 Guia de Configuração - Estação Meteorológica

Este guia detalha como configurar, compilar e fazer upload do firmware nos boards ESP8266.

## 📋 Pré-requisitos

### Hardware
- ✅ **Node Sensor:** D1 R2 Mini (ESP8266)
- ✅ **Gateway:** NodeMCU V2 (ESP8266)
- ✅ **Sensor BME280** (I2C) - Node Sensor
- ✅ **Sensor ADS1115** (I2C) - Node Sensor
- ✅ **Módulo LoRa (E220-900T22D)** (UART) - Ambos
- ✅ **Anemômetro** (Hall sensor) - Node Sensor
- ✅ **Pluviômetro** (Reed switch) - Node Sensor
- ✅ **Conexão USB** para upload

### Software
- **VS Code** + extensão **PlatformIO** ([Instalar](https://platformio.org/install/ide?install=vscode))
- **Python 3.8+** (instalado automaticamente pelo PlatformIO)
- **Driver USB CH340** (se necessário) - [Download](https://www.wemos.cc/downloads)

## 📥 Instalação

### 1. Clone o Repositório

```bash
git clone <https://github.com/TuliodeCastro/estacao_meteorologica.git>
cd estacao_meteorologica
```

### 2. Abra no VS Code

```bash
code .
```

O PlatformIO vai inicializar automaticamente.

### 3. Configure Credenciais (Gateway)

```bash
cd firmware/gateway_lora
cp include/credentials.h.example include/credentials.h
```

**Edite `include/credentials.h` com:**
- Wi-Fi SSID e senha
- Firebase URL (seu banco de dados)
- Firebase API Key (gere no Firebase Console)

```cpp
#define WIFI_SSID "seu-ssid"
#define WIFI_PASS "sua-senha"
#define FIREBASE_HOST "https://seu-projeto-rtdb.firebaseio.com"
#define FIREBASE_API_KEY "AIzaSy..."
```

## 🔌 Conexão de Hardware

### Pinagem

#### Node Sensor (D1 R2 Mini)

| Sensor | Pino | GPIO | Protocolo |
|--------|------|------|-----------|
| BME280 SDA | D4 | GPIO2 | I2C |
| BME280 SCL | D5 | GPIO14 | I2C |
| ADS1115 SDA | D4 | GPIO2 | I2C |
| ADS1115 SCL | D5 | GPIO14 | I2C |
| LoRa RX | D6 | GPIO12 | UART |
| LoRa TX | D7 | GPIO13 | UART |
| Anemômetro | D3 | GPIO0 | Digital (ISR) |
| Pluviômetro | D5 | GPIO14 | Digital (ISR) |

#### Gateway (NodeMCU V2)

| Sensor | Pino | GPIO | Protocolo |
|--------|------|------|-----------|
| LoRa RX | D8 | GPIO15 | UART |
| LoRa TX | D7 | GPIO13 | UART |


## 💻 Compilação e Upload

### Opção 1: Via VS Code (Recomendado)

1. **Abra a paleta de comandos:** `Ctrl+Shift+P`

2. **Digite:** `PlatformIO: Build`
   - Ou clique no botão ✓ (Build) na barra inferior

3. **Aguarde a compilação**

4. **Conecte o board via USB**

5. **Digite:** `PlatformIO: Upload`
   - Ou clique no botão → (Upload) na barra inferior

6. **Aguarde o upload completar**

### Opção 2: Via Terminal

```bash
# Entrar no diretório
cd firmware/node_sensor   # ou gateway_lora

# Compilar
pio run

# Compilar + Upload
pio run --target upload

# Limpar build
pio run --target clean
```

## 🔍 Verificação

### 1. Abra o Serial Monitor

**VS Code:**
- Clique em "PlatformIO" na barra lateral
- Selecione "Serial Monitor"
- Ou `Ctrl+Alt+S`

**Velocidade:** 115200 baud

### 2. Node Sensor - Saída Esperada

```
=== ACORDOU — iniciando janela ativa ===
BME280 encontrado!
ADS1115 encontrado!
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
25.3,1013.2,65.4,0,0.00,1.23,2.45,180,450.2*XX
=== DORMINDO por 3 minutos ===
```

### 3. Gateway - Saída Esperada

```
Receptor LoRa (CSV) iniciado!
================================================
[WiFi] Conectado. IP: 424.242.4.242
Sincronizando hora via NTP
Hora sincronizada!
Criando usuário anônimo (única vez)...
Usuário anônimo criado!
Firebase iniciado.
──── Mensagem recebida ─────────────────────────
Temperatura: 25.3 °C
Pressão:     1013.2 hPa
...
================================================
[Firebase] Dados enviados!
[Heartbeat] OK.
```

## ⚠️ Troubleshooting

### "Placa não encontrada"
```
Solução:
1. Verifique conexão USB
2. Instale driver CH340 (https://www.wemos.cc/downloads)
3. Identifique a porta COM no Gerenciador de Dispositivos
4. Configure em platformio.ini: upload_port = COM3
```

### "Erro: Biblioteca não encontrada"
```
Solução:
1. Execute: pio run --target clean
2. Execute: pio pkg install
3. Reinicie VS Code
```

### "BME280 não encontrado!"
```
Verificar:
1. Conexão I2C (SDA=D4/GPIO2, SCL=D5/GPIO14)
2. Voltagem 3.3V no sensor
3. Pull-ups de 10kΩ na linha I2C (se necessário)
4. Endereço I2C: 0x76 (padrão) ou 0x77
```

### "ADS1115 não encontrado!"
```
Verificar:
1. Mesmos pinos I2C que BME280
2. Endereço I2C: 0x48 (padrão)
3. Pontes de seleção de endereço (ADDR pin)
```

### "LoRa não transmite"
```
Verificar:
1. Pinos UART corretos (RX=D6/GPIO12, TX=D7/GPIO13)
2. Velocidade serial: 9600 baud
3. Alimentação: mínimo 100mA @ 3.3V
4. Antena conectada e corretamente posicionada
```

### "Firebase não recebe dados"
```
Verificar:
1. Credenciais em credentials.h
2. Wi-Fi conectando (Serial Monitor)
3. Sincronização NTP (hora do sistema)
4. Firebase Rules permitem escrita anônima:
   "auth != null" no seu banco
5. Firewall/roteador bloqueando porta 443
```

### "Dados chegam ao Firebase mas incorretos"
```
Verificar:
1. Calibração: CAL_WM2_POR_MV (piranômetro)
2. Calibração: MM_POR_PULSO (pluviômetro)
3. Direção: Comparar com bússola real
```

## 🔧 Configurações Avançadas

### Aumentar Intervalo de Amostragem

**Node Sensor (`main.cpp`):**
```cpp
const unsigned long JANELA_ATIVA = 120000UL;  // 2 min - aumentar para 24000 = 4 min
const uint64_t TEMPO_SONO = 180e6;            // 3 min - aumentar para 60e6 = 10 min
```

### Mudar Endereço I2C do ADS1115

**Verificar jumper ADDR:**
- GND = 0x48 (padrão)
- VDD = 0x49
- SDA = 0x4A
- SCL = 0x4B

Atualizar no código se necessário.

## 📚 Referências

- [PlatformIO Documentation](https://docs.platformio.org/)
- [ESP8266 Arduino Reference](https://arduino-esp8266.readthedocs.io/)
- [BME280 Datasheet](https://www.bosch-sensortec.com/products/bme280/)
- [ADS1115 Datasheet](https://www.ti.com/product/ADS1115)
- [LoRa Protocol](https://lora-alliance.org/)
- [Firebase Documentation](https://firebase.google.com/docs)

## 📞 Suporte

Se encontrar problemas:
1. Consulte `docs/HARDWARE.md` para detalhes de pinagem
2. Consulte `firmware/README.md` para detalhes de código
3. Verifique logs no Serial Monitor (115200 baud)
