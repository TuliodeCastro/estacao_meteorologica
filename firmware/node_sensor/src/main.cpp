#include <Arduino.h>

#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_ADS1X15.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <math.h>

Adafruit_BME280 bme;
Adafruit_ADS1115 ads;
SoftwareSerial loraSerial(12, 13); // RX=D6(GPIO12), TX=D7(GPIO13)

// ─── Constantes gerais ───────────────────────────────────────────
const float PI_CONST = 3.14159265;
const int   RAIO     = 147;   // raio do anemômetro (mm)

// ─── Tempos do Caminho C ─────────────────────────────────────────
const unsigned long JANELA_ATIVA = 120000UL;  // 2 min amostrando
const uint64_t      TEMPO_SONO   = 180e6;     // 3 min em deep sleep (µs)

// Sub-intervalos de amostragem dentro da janela ativa
const unsigned long AMOSTRA_BME_MS = 5000;  // BME280 a cada 5 s
const unsigned long AMOSTRA_DIR_MS = 5000;  // direção a cada 5 s
const unsigned long AMOSTRA_IRR_MS = 5000;  // irradiância a cada 5 s
const unsigned long JANELA_RAJADA  = 3000;  // janela de rajada = 3 s (norma WMO)

// ─── Piranômetro ─────────────────────────────────────────────────
const float CAL_WM2_POR_MV = 5.0; // TROQUE pelo valor do seu certificado!

// ─── Pluviômetro ─────────────────────────────────────────────────
const int   REED         = 14;   // D5 = GPIO14 (Seguro - Mantido)
const float MM_POR_PULSO = 0.25;
volatile unsigned int reedCount = 0;

// ─── Anemômetro (por ISR no D2 = GPIO4) ──────────────────────────
const int HALL = 4;   // D2 = GPIO4 (Seguro - Remanejado)
volatile unsigned int hallCountTotal   = 0; // pulsos na janela inteira
volatile unsigned int hallCountRajada  = 0; // pulsos na sub-janela de 3 s

// ─── ISRs ────────────────────────────────────────────────────────
void IRAM_ATTR contaPulsoPluvio() {
  static unsigned long ultimoPulso = 0;
  unsigned long agora = millis();
  if (agora - ultimoPulso > 200) {
    reedCount++;
    ultimoPulso = agora;
  }
}

void IRAM_ATTR contaPulsoHall() {
  static unsigned long ultimoPulso = 0;
  unsigned long agora = millis();
  // debounce de 5ms — anemômetro pode girar rápido, então é curto
  if (agora - ultimoPulso > 5) {
    hallCountTotal++;
    hallCountRajada++;
    ultimoPulso = agora;
  }
}

// ─── Converte contagem de pulsos em velocidade (m/s) ─────────────
float pulsosParaMS(unsigned int pulsos, unsigned long intervaloMs) {
  if (intervaloMs == 0) return 0;
  float rpm = (pulsos * 60000.0) / intervaloMs;
  return ((4 * PI_CONST * RAIO * rpm) / 60.0) / 1000.0;
}

// ─── Direção via ADS1115 A2 → retorna em graus ───────────────────
int lerDirecaoGraus() {
  ads.setGain(GAIN_ONE);
  int16_t raw = ads.readADC_SingleEnded(2);
  float valor = ads.computeVolts(raw);

  if      (valor <= 0.18) return 315;
  else if (valor <= 0.21) return 270;
  else if (valor <= 0.25) return 225;
  else if (valor <= 0.30) return 180;
  else if (valor <= 0.38) return 135;
  else if (valor <= 0.50) return 90;
  else if (valor <= 0.83) return 45;
  else                    return 0;
}

// ─── Irradiância via ADS1115 A0-A1 (diferencial) ────────────────
float lerIrradiancia() {
  ads.setGain(GAIN_SIXTEEN);
  int16_t raw = ads.readADC_Differential_0_1();
  float mV = ads.computeVolts(raw) * 1000.0;
  if (mV < 0) mV = 0;
  return mV * CAL_WM2_POR_MV;
}

// ─── Monta CSV com checksum XOR ──────────────────────────────────
// Ordem dos campos: temp,pres,umid,pulsos,chuva,velMS,rajada,dir,irrad
String montarCSV(float temp, float pres, float umid,
                 unsigned int pulsos, float chuva,
                 float velMedia, float rajada,
                 int dir, float irrad) {
  String dados = String(temp, 1)     + "," +
                 String(pres, 1)     + "," +
                 String(umid, 1)     + "," +
                 String(pulsos)      + "," +
                 String(chuva, 2)    + "," +
                 String(velMedia, 2) + "," +
                 String(rajada, 2)   + "," +
                 String(dir)         + "," +
                 String(irrad, 1);

  // Checksum XOR de todos os caracteres dos dados
  uint8_t cs = 0;
  for (size_t i = 0; i < dados.length(); i++) {
    cs ^= dados[i];
  }

  char csHex[3];
  sprintf(csHex, "%02X", cs);

  return dados + "*" + csHex;
}

// ─────────────────────────────────────────────────────────────────
void setup() {
  // Desliga o Wi-Fi imediatamente — transmissor usa só LoRa
  WiFi.mode(WIFI_OFF);
  WiFi.forceSleepBegin();

  Serial.begin(115200);
  loraSerial.begin(9600);
  
  // I2C Remanejado para os pinos de boot (D3 e D4)
  // Eles possuem pull-up físico dos módulos BME e ADS, o que garante o boot perfeito.
  Wire.begin(0, 2); // SDA=D3(GPIO0), SCL=D4(GPIO2)

  Serial.println("\n=== ACORDOU — iniciando janela ativa ===");

  if (!bme.begin(0x76)) {
    Serial.println("BME280 não encontrado!");
  }
  if (!ads.begin(0x48)) {
    Serial.println("ADS1115 não encontrado!");
  }

  // Pluviômetro e anemômetro com interrupção em pinos 100% seguros
  pinMode(REED, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(REED), contaPulsoPluvio, FALLING);

  pinMode(HALL, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(HALL), contaPulsoHall, FALLING);

  // ── Acumuladores da janela ──────────────────────────────────────
  hallCountTotal = 0;
  reedCount      = 0;

  float somaTemp = 0, somaPres = 0, somaUmid = 0;
  int   nBme = 0;

  float somaIrr = 0;
  int   nIrr = 0;

  float somaSin = 0, somaCos = 0;
  int   nDir = 0;

  float rajadaMax = 0;

  unsigned long inicioJanela = millis();
  unsigned long ultBme = 0, ultDir = 0, ultIrr = 0, ultRajada = millis();

  // ── Loop da janela ativa (amostragem contínua) ──────────────────
  while (millis() - inicioJanela < JANELA_ATIVA) {
    unsigned long agora = millis();

    // BME280
    if (agora - ultBme >= AMOSTRA_BME_MS) {
      ultBme = agora;
      float t = bme.readTemperature();
      float p = bme.readPressure() / 100.0F;
      float u = bme.readHumidity();
      if (!isnan(t) && !isnan(p) && !isnan(u)) {
        somaTemp += t; somaPres += p; somaUmid += u; nBme++;
      }
    }

    // Direção (média vetorial)
    if (agora - ultDir >= AMOSTRA_DIR_MS) {
      ultDir = agora;
      int g = lerDirecaoGraus();
      float rad = g * PI_CONST / 180.0;
      somaSin += sin(rad);
      somaCos += cos(rad);
      nDir++;
    }

    // Irradiância
    if (agora - ultIrr >= AMOSTRA_IRR_MS) {
      ultIrr = agora;
      somaIrr += lerIrradiancia();
      nIrr++;
    }

    // Rajada — a cada 3s, calcula velocidade da sub-janela e guarda o pico
    if (agora - ultRajada >= JANELA_RAJADA) {
      noInterrupts();
      unsigned int pr = hallCountRajada;
      hallCountRajada = 0;
      interrupts();

      float vRajada = pulsosParaMS(pr, agora - ultRajada);
      if (vRajada > rajadaMax) rajadaMax = vRajada;
      ultRajada = agora;
    }

    yield(); // mantém o watchdog feliz
  }

  // ── Fim da janela — calcula resultados ──────────────────────────
  unsigned long duracao = millis() - inicioJanela;

  float temperatura = (nBme > 0) ? somaTemp / nBme : 0;
  float pressao     = (nBme > 0) ? somaPres / nBme : 0;
  float umidade     = (nBme > 0) ? somaUmid / nBme : 0;

  noInterrupts();
  unsigned int pulsosVento = hallCountTotal;
  unsigned int pulsosChuva = reedCount;
  interrupts();
  float velMedia = pulsosParaMS(pulsosVento, duracao);

  float chuva = pulsosChuva * MM_POR_PULSO;

  int dirMedia = 0;
  if (nDir > 0) {
    float ang = atan2(somaSin / nDir, somaCos / nDir) * 180.0 / PI_CONST;
    if (ang < 0) ang += 360.0;
    dirMedia = ((int)round(ang / 45.0) * 45) % 360;
  }

  float irradiancia = (nIrr > 0) ? somaIrr / nIrr : 0;

  // ── Monta e envia o pacote CSV ──────────────────────────────────
  String payload = montarCSV(temperatura, pressao, umidade,
                             pulsosChuva, chuva,
                             velMedia, rajadaMax,
                             dirMedia, irradiancia);

  loraSerial.println(payload);

  // ── Relatório no Serial ─────────────────────────────────────────
  Serial.println("──── Médias da janela ──────────────────────────");
  Serial.print("Temperatura: "); Serial.print(temperatura); Serial.println(" °C");
  Serial.print("Pressão:     "); Serial.print(pressao);     Serial.println(" hPa");
  Serial.print("Umidade:     "); Serial.print(umidade);     Serial.println(" %");
  Serial.print("Chuva:       "); Serial.print(chuva);       Serial.println(" mm");
  Serial.print("Vento médio: "); Serial.print(velMedia);    Serial.println(" m/s");
  Serial.print("Rajada (3s): "); Serial.print(rajadaMax);   Serial.println(" m/s");
  Serial.print("Direção:     "); Serial.print(dirMedia);    Serial.println("°");
  Serial.print("Irradiância: "); Serial.print(irradiancia); Serial.println(" W/m²");
  Serial.print("Amostras BME: "); Serial.println(nBme);
  Serial.println("──── Payload enviado ───────────────────────────");
  Serial.println(payload);

  // Tempo para o LoRa terminar de transmitir antes de dormir
  delay(500);

  // ── Deep sleep ──────────────────────────────────────────────────
  Serial.println("=== DORMINDO por 3 minutos ===\n");
  Serial.flush();
  ESP.deepSleep(TEMPO_SONO);
}

void loop() {
  // Vazio — todo o ciclo acontece no setup() porque o deep sleep
  // reseta o ESP a cada despertar.
}