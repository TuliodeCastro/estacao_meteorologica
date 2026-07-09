# 🌦️ Estação Meteorológica com LoRa

Sistema de monitoramento climático distribuído usando **ESP8266, LoRa, Sensores** e **Firebase** para registro de dados em nuvem.

## 📋 Visão Geral

Um projeto de IoT que coleta dados meteorológicos (temperatura, pressão, umidade, vento, chuva, radiação solar) em um **nó sensor remoto** e os transmite via **LoRa** para um **gateway central**, que envia os dados para o **Firebase Realtime Database**.

### Arquitetura
```
Node Sensor (ESP8266)
  ├─ BME280 (temperatura, pressão, umidade)
  ├─ Anemômetro (velocidade do vento)
  ├─ Pluviômetro (medição de chuva)
  ├─ ADS1115 ADC (direção do vento, irradiância)
  └─ LoRa (transmissor)
          ↓ LoRa Transmission
        Gateway (ESP8266)
          ├─ LoRa (receptor)
          ├─ Wi-Fi
          └─ Firebase Client
                ↓
        📊 Firebase Realtime Database (Nuvem)
```

## 📁 Estrutura do Projeto

```
estacao_meteorologica/
├── README.md                          (este arquivo)
├── SETUP.md                           (instruções de configuração)
├── LICENSE                            (licença do projeto)
├── .gitignore                         (ignora arquivos sensíveis)
│
├── docs/
│   ├── HARDWARE.md                   (pinagem, componentes, esquemático)
│   ├── ARCHITECTURE.md               (fluxo de dados, protocolos)
│   └── DEPLOYMENT.md                 (guia de produção)
│
└── firmware/
    ├── README.md                     (documentação do firmware)
    ├── SECURITY_GUIDELINES.md        (boas práticas de segurança)
    │
    ├── gateway_lora/                 (receptor LoRa + Wi-Fi + Firebase)
    │   ├── src/main.cpp
    │   ├── include/credentials.h     (credenciais - NÃO COMMITAR)
    │   ├── include/credentials.h.example
    │   ├── SECURITY.md
    │   └── platformio.ini
    │
    └── node_sensor/                  (sensor remoto com LoRa)
        ├── src/main.cpp
        ├── include/
        ├── platformio.ini
        └── test/

```

## 🔧 Módulos

### Node Sensor (`firmware/node_sensor/`)
- **Placa:** D1 R2 Mini (ESP8266)
- **Sensores:**
  - BME280 (I2C): Temperatura, Pressão, Umidade
  - ADS1115 (I2C): Entrada analógica para piranômetro e direção
  - Anemômetro (GPIO): Sensor de efeito Hall
  - Pluviômetro (GPIO): Sensor de chuva
- **Ciclo:** Amostra a cada 5s por 2 min, transmite CSV via LoRa, dorme por 3 min

### Gateway LoRa (`firmware/gateway_lora/`)
- **Placa:** NodeMCU V2 (ESP8266)
- **Conectividade:**
  - LoRa (SoftwareSerial): Recebe dados do nó sensor
  - Wi-Fi: Conexão à rede local
  - Firebase: Envia dados para nuvem
- **Funcionalidade:** Recebe CSV do sensor, valida checksum, envia para Firebase

## 📊 Formato de Dados

**CSV transmitido pelo sensor:**
```
temp,pres,umid,pulsos,chuva,velMS,rajada,dir,irrad*CHECKSUM
25.5,1013.2,65.3,120,0.25,2.14,3.45,180,450.2*AB
```

| Campo | Descrição | Unidade |
|-------|-----------|---------|
| temp | Temperatura média | °C |
| pres | Pressão média | hPa |
| umid | Umidade relativa média | % |
| pulsos | Contagem de pulsos do vento | - |
| chuva | Acumulado de chuva | mm |
| velMS | Velocidade média do vento | m/s |
| rajada | Velocidade máxima (rajada) | m/s |
| dir | Direção média do vento | graus (0-360°) |
| irrad | Irradiância solar média | W/m² |

## 📚 Documentação

- **[SETUP.md](./SETUP.md)** — Como configurar e fazer upload do firmware
- **[docs/HARDWARE.md](./docs/HARDWARE.md)** — Pinagem, componentes, esquemático
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Fluxo de dados e protocolos
- **[firmware/SECURITY_GUIDELINES.md](./firmware/SECURITY_GUIDELINES.md)** — Boas práticas de segurança
- **[firmware/gateway_lora/SECURITY.md](./firmware/gateway_lora/SECURITY.md)** — Configuração de credenciais

## 🛠️ Troubleshooting

### Sensor não transmite dados
1. Verifique conexão LoRa (pinos D6/D7)
2. Verifique sensor BME280 no Serial Monitor
3. Verifique poder do sensor (voltagem 3.3V)

### Gateway não recebe dados
1. Verifique Wi-Fi (Serial Monitor mostra IP?)
2. Verifique Firebase (credenciais corretas?)
3. Verifique potência LoRa (mesmos pinos)

### Firebase não recebe dados
1. Verifique credenciais em `credentials.h`
2. Verifique Firebase Rules permitem escrita anônima
3. Verifique conectividade Wi-Fi do gateway

Veja mais em **[docs/HARDWARE.md](./docs/HARDWARE.md)** e **[firmware/README.md](./firmware/README.md)**

## 📝 Licença

Este projeto está licenciado sob a [Licença MIT](./LICENSE).

