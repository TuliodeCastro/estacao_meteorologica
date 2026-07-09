# 🔌 Hardware - Estação Meteorológica

Documentação completa de componentes, pinagem e esquemático.

## 📦 Componentes Utilizados

### Node Sensor

| Componente | Modelo | Quantidade | Interface | Voltagem |
|-----------|--------|-----------|-----------|----------|
| Microcontrolador | D1 R2 Mini (ESP8266) | 1 | SPI/I2C | 3.3V |
| Sensor Temp/Pres/Umid | BME280 | 1 | I2C | 3.3V |
| Conversor ADC | ADS1115 (16-bit) | 1 | I2C | 3.3V |
| Transmissor LoRa | E220-900T22D | 1 | UART | 3.3V |
| Anemômetro | Hall sensor (3 xícaras) | 1 | Digital (ISR) | 5V |
| Pluviômetro | Reed switch | 1 | Digital (ISR) | - |
| Piranômetro | Sensor analógico | 1 | Analógico (ADC) | 0-5V |
| Medidor de Direção | Potenciômetro 10kΩ | 1 | Analógico (ADC) | 0-5V |

### Gateway

| Componente | Modelo | Quantidade | Interface | Voltagem |
|-----------|--------|-----------|-----------|----------|
| Microcontrolador | NodeMCU V2 (ESP8266) | 1 | SPI/I2C | 3.3V |
| Receptor LoRa | E220-900T22D | 1 | UART | 3.3V |
| Conectividade | Wi-Fi (incorporado) | - | 802.11b/g/n | 3.3V |

## 🔌 Pinagem Detalhada

### D1 R2 Mini (Node Sensor)

```
       ┌─────────────────────────┐
  GND -│ ●                     ● │- GND
  RX  -│   D1 R2 Mini        5V │- 5V
  TX  -│   (ESP8266)         3V │- 3V3 (50mA)
  D8  -│ GPIO15            RST  │- RST
  D7  -│ GPIO13             A0  │- ADC (0-1V)
  D6  -│ GPIO12            3V3  │- 3V3
  D5  -│ GPIO14 (SCL)     CH_PD │- CH_PD (pull-up)
  D4  -│ GPIO2 (SDA)        D0  │- GPIO16 (WAKE)
  D3  -│ GPIO0 (INT)        D3  │- GPIO0 (RST/BOOT)
  D2  -│ GPIO4             TX   │- TX
  D1  -│ GPIO5 (SCL alt)   RX   │- RX
  D0  -│ GPIO16 (WAKE)          │
       └─────────────────────────┘
```

#### I2C (BME280 + ADS1115)
```
        D4 (GPIO2/SDA) ───┬─── BME280 SDA
                          ├─── ADS1115 SDA
                          └─── 10kΩ pull-up ─ 3.3V
        
        D5 (GPIO14/SCL) ──┬─── BME280 SCL
                          ├─── ADS1115 SCL
                          └─── 10kΩ pull-up ─ 3.3V
        
        GND ──────────────┬─── BME280 GND
                          ├─── ADS1115 GND
        
        3V3 ──────────────┬─── BME280 VCC
                          ├─── ADS1115 VDD
```

#### LoRa UART (SoftwareSerial)
```
        D6 (GPIO12) RX ─── LoRa TX
        D7 (GPIO13) TX ─── LoRa RX
        3V3 ────────────── LoRa VCC
        GND ────────────── LoRa GND
```

#### Sensores Digital (ISR)
```
        D3 (GPIO0)  ─── Anemômetro (Hall effect)
        D5 (GPIO14) ─── Pluviômetro (Reed switch)
```

#### Sensores Analógico (ADC via ADS1115)
```
        ADS1115 A0 ─── Piranômetro (0-5V)
        ADS1115 A1 ─── GND (ref)
        ADS1115 A2 ─── Medidor Direção (0-5V)
        ADS1115 A3 ─── NC (não usado)
```

### NodeMCU V2 (Gateway)

```
       ┌──────────────────────────┐
  GND -│ ●                      ● │- GND
  D0  -│ GPIO16               5V │- 5V
  D1  -│ GPIO5                3V │- 3V3
  D2  -│ GPIO4             RST/CH│- RST
  D3  -│ GPIO0              Vin  │- Vin
  D4  -│ GPIO2               D8  │- GPIO15
  D5  -│ GPIO14 (SCL)        D7  │- GPIO13 (TX)
  D6  -│ GPIO12 (RX)         D6  │- GPIO12 (RX)
  D7  -│ GPIO13 (TX)         D5  │- GPIO14 (SCL)
  D8  -│ GPIO15              D4  │- GPIO2 (SDA)
  RX  -│ RX (GPIO3)          D3  │- GPIO0
  TX  -│ TX (GPIO1)          D2  │- GPIO4
  GND -│ GND                 D1  │- GPIO5
       └──────────────────────────┘
```

#### LoRa UART (SoftwareSerial)
```
        D8 (GPIO15) RX ─── LoRa TX
        D7 (GPIO13) TX ─── LoRa RX
        3V3 ────────────── LoRa VCC
        GND ────────────── LoRa GND
```

## ⚡ Alimentação

### Node Sensor
- **Voltagem:** 3.3V (USB durante desenvolvimento)
- **Consumo médio:** ~50mA (em operação)
- **Consumo em deep sleep:** ~20µA
- **Bateria recomendada:** 12V chumbo-ácido

### Gateway
- **Voltagem:** 5V (via USB)
- **Consumo médio:** ~80mA (Wi-Fi + LoRa)
- **Fonte:** USB

## 📐 Calibração de Sensores

### BME280
- **Endereço I2C:** 0x76 (default) ou 0x77 (via jumper)
- **Calibração:** Interna (factory calibration)
- **Verificação:** Comparar com termômetro de referência

### ADS1115
- **Endereço I2C:** 0x48 (GND), 0x49 (VDD), 0x4A (SDA), 0x4B (SCL)
- **Resolução:** 16 bits
- **Ganho:** GAIN_SIXTEEN (0.256V full scale) para sensores de baixa voltagem

### Piranômetro
- **Tipo:** Sensor analógico com fotodiodo
- **Saída:** 0-5V → 0-1023 (ADS1115 com referência)
- **Calibração:** Usar certificado do fabricante
- **Fórmula:** Irradiância (W/m²) = Voltagem (mV) × CAL_WM2_POR_MV

### Pluviômetro
- **Tipo:** Reed switch (pulso por volume fixo)
- **Volume por pulso:** Tipicamente 0.2-0.5 mm
- **Calibração:** Medir volume real do funil

### Anemômetro
- **Tipo:** 3 xícaras com sensor Hall
- **Raio:** 147mm (deve ser medido no seu aparelho)
- **Conversão:** rpm → m/s usando fórmula de circunferência

### Medidor de Direção
- **Tipo:** Potenciômetro 10kΩ acoplado
- **Saída:** 0-5V → 8 direções (N, NE, E, SE, S, SO, O, NO)
- **Calibração:** Alinhar com bússola em 4 pontos cardinais

## 🔧 Montagem Física

### Posicionamento da Estação
- **Altura:** Mínimo 2m acima de obstáculos
- **Exposição:** Área aberta, longe de prédios/árvores
- **Proteção:** Abrigo de radiação (Stevenson screen) recomendado
- **Orientação:** Anemômetro/direção com N apontando para Norte verdadeiro

### Proteção Contra Intempéries
- **Enclosure:** Caixa plástica IP65 para circuitos
- **Antena LoRa:** Vertical, 1m de altura
- **Antena Wi-Fi:** Interna ou externa conforme sinal

## 🌐 Alcance LoRa

- **Teórico:** 10+ km em linha de visada
- **Prático:** 100-500m em ambiente urbano/indoor
- **Fatores:** Antena, potência, frequência, obstáculos

**Para aumentar alcance:**
- Elevar antena do transmissor
- Elevar antena do receptor
- Remover obstáculos entre eles
- Usar antena omnidirecional de melhor qualidade

## 📚 Datasheets

- [BME280](https://www.bosch-sensortec.com/products/bme280/)
- [ADS1115](https://www.ti.com/product/ADS1115)
- [E220-900T22D](https://www.cdebyte.com/products/E220-900T22D/2#Pin)
- [ESP8266](https://www.espressif.com/en/products/microcontrollers/esp8266)