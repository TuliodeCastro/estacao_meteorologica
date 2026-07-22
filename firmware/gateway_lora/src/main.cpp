#include <Arduino.h>

#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <time.h>

#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

// ─── Credenciais (carregadas de arquivo separado para segurança) ─────
#include "credentials.h"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ─── LoRa ────────────────────────────────────────────────────────
SoftwareSerial loraSerial(12, 13, false);

// ─── Buffer de recepção (char[] fixo) ────────────────────────────
char     rxBuffer[200];
uint16_t rxPos = 0;

// ─── Estado de inicialização do Firebase ─────────────────────────
bool firebaseIniciado = false; // signUp/begin só rodam UMA vez

// ─── Heartbeat ───────────────────────────────────────────────────
unsigned long ultimoHeartbeat = 0;
const unsigned long INTERVALO_HEARTBEAT = 15000;

// ─── Reconexão Wi-Fi NÃO-BLOQUEANTE ──────────────────────────────
void garantirWifi() {
  static unsigned long ultimaTentativa = 0;
  if (WiFi.status() == WL_CONNECTED) return;

  unsigned long agora = millis();
  if (agora - ultimaTentativa >= 5000) {
    ultimaTentativa = agora;
    Serial.println("[WiFi] Desconectado — tentando reconectar...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASS);
  }
}

void configurarNTP() {
  configTime(-3 * 3600, 0, "pool.ntp.org", "a.ntp.br");
  Serial.print("Sincronizando hora via NTP");
  time_t agora = time(nullptr);
  int tentativas = 0;
  while (agora < 100000 && tentativas < 20) {
    delay(500); Serial.print("."); agora = time(nullptr); tentativas++;
  }
  Serial.println(agora > 100000 ? "\nHora sincronizada!" : "\nFalha no NTP.");
}

// Inicializa o Firebase UMA ÚNICA VEZ (evita o loop de INVALID_EMAIL)
void iniciarFirebaseUmaVez() {
  if (firebaseIniciado) return;
  if (WiFi.status() != WL_CONNECTED) return;

  configurarNTP();

  config.database_url = FIREBASE_HOST;
  config.api_key      = FIREBASE_API_KEY;
  config.token_status_callback = tokenStatusCallback;

  Serial.println("Criando usuário anônimo (única vez)...");
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Usuário anônimo criado!");
  } else {
    Serial.print("Falha no signUp: ");
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  firebaseIniciado = true;
  Serial.println("Firebase iniciado.");
}

String grausParaNome(int g) {
  switch (g) {
    case 315: return "Noroeste";
    case 270: return "Oeste";
    case 225: return "Sudoeste";
    case 180: return "Sul";
    case 135: return "Sudeste";
    case 90:  return "Leste";
    case 45:  return "Nordeste";
    default:  return "Norte";
  }
}

void enviarHeartbeat() {
  if (!firebaseIniciado || !Firebase.ready() || WiFi.status() != WL_CONNECTED) return;

  String path = "/estacao/status";
  time_t agora = time(nullptr);

  bool ok = true;
  ok &= Firebase.RTDB.setBool(&fbdo, path + "/online", true);
  ok &= Firebase.RTDB.setInt(&fbdo,  path + "/ultimoHeartbeat", (int)agora);

  if (ok) Serial.println("[Heartbeat] OK.");
  else { Serial.print("[Heartbeat] Erro: "); Serial.println(fbdo.errorReason()); }
}

// QC final antes de gravar (defesa em profundidade — o nó já filtra, mas
// o gateway garante que nenhuma rajada espúria chegue ao banco).
void qcVento(float &velMS, float &rajada) {
  const float LIMITE = 50.0;   // ~180 km/h: acima disso é impossível aqui
  const float FATOR  = 3.0;    // rajada plausível é no máx ~3x a média
  if (velMS > LIMITE || velMS < 0) velMS = 0;
  if (rajada > LIMITE || (velMS > 0.5 && rajada > velMS * FATOR)) rajada = velMS;
  if (rajada < velMS) rajada = velMS;
}

// Grava a leitura em /estacao/leituras E em /estacao/historico/<epoch>.
// UM setJSON por destino (rápido → menos tempo "surdo" ao LoRa; e o site
// recebe a leitura completa num evento só, não vários eventos parciais).
void enviarFirebase(float temp, float pres, float umid, int pulsos,
                    float chuva, float velMS, float rajada,
                    int dir, float irrad) {
  if (!firebaseIniciado || !Firebase.ready() || WiFi.status() != WL_CONNECTED) {
    Serial.println("[Firebase] Não pronto — pulando envio.");
    return;
  }

  qcVento(velMS, rajada);
  time_t agora = time(nullptr);

  FirebaseJson json;
  json.set("temp",      temp);
  json.set("pres",      pres);
  json.set("umid",      umid);
  json.set("pulsos",    pulsos);
  json.set("chuva",     chuva);
  json.set("velMS",     velMS);
  json.set("rajada",    rajada);
  json.set("dir",       dir);
  json.set("direcao",   grausParaNome(dir));
  json.set("irrad",     irrad);
  json.set("timestamp", (int)agora);

  if (Firebase.RTDB.setJSON(&fbdo, "/estacao/leituras", &json))
    Serial.println("[Firebase] Dados enviados!");
  else { Serial.print("[Firebase] Erro: "); Serial.println(fbdo.errorReason()); }

  String path = "/estacao/historico/" + String((uint32_t)agora);
  if (Firebase.RTDB.setJSON(&fbdo, path, &json))
    Serial.println("[Historico] Registro arquivado!");
  else { Serial.print("[Historico] Erro: "); Serial.println(fbdo.errorReason()); }
}

// Ordem CSV: temp,pres,umid,pulsos,chuva,velMS,rajada,dir,irrad
void processarMensagem(char* msg) {
  char* asterisco = strchr(msg, '*');
  if (asterisco == NULL) {
    Serial.println("[CSV] Sem checksum — descartado.");
    return;
  }

  *asterisco = '\0';
  char* csRecebido = asterisco + 1;

  uint8_t cs = 0;
  for (char* p = msg; *p != '\0'; p++) cs ^= *p;
  char csCalc[3];
  sprintf(csCalc, "%02X", cs);

  if (strcmp(csCalc, csRecebido) != 0) {
    Serial.print("[CSV] Checksum inválido — descartado. Recebido: ");
    Serial.print(csRecebido); Serial.print(" Calculado: ");
    Serial.println(csCalc);
    return;
  }

  char* tTemp   = strtok(msg,  ",");
  char* tPres   = strtok(NULL, ",");
  char* tUmid   = strtok(NULL, ",");
  char* tPulsos = strtok(NULL, ",");
  char* tChuva  = strtok(NULL, ",");
  char* tVel    = strtok(NULL, ",");
  char* tRajada = strtok(NULL, ",");
  char* tDir    = strtok(NULL, ",");
  char* tIrrad  = strtok(NULL, ",");

  if (!tTemp || !tPres || !tUmid || !tPulsos || !tChuva ||
      !tVel || !tRajada || !tDir || !tIrrad) {
    Serial.println("[CSV] Campos faltando — descartado.");
    return;
  }

  float temp   = atof(tTemp);
  float pres   = atof(tPres);
  float umid   = atof(tUmid);
  int   pulsos = atoi(tPulsos);
  float chuva  = atof(tChuva);
  float velMS  = atof(tVel);
  float rajada = atof(tRajada);
  int   dir    = atoi(tDir);
  float irrad  = atof(tIrrad);

  Serial.println("──── Mensagem recebida ─────────────────────────");
  Serial.print("Temperatura: "); Serial.print(temp);   Serial.println(" °C");
  Serial.print("Pressão:     "); Serial.print(pres);   Serial.println(" hPa");
  Serial.print("Umidade:     "); Serial.print(umid);   Serial.println(" %");
  Serial.print("Pulsos:      "); Serial.println(pulsos);
  Serial.print("Chuva:       "); Serial.print(chuva);  Serial.println(" mm");
  Serial.print("Vento médio: "); Serial.print(velMS);  Serial.println(" m/s");
  Serial.print("Rajada (3s): "); Serial.print(rajada); Serial.println(" m/s");
  Serial.print("Direção:     "); Serial.print(dir);    Serial.print("°  ");
                                 Serial.println(grausParaNome(dir));
  Serial.print("Irradiância: "); Serial.print(irrad);  Serial.println(" W/m²");
  Serial.println("================================================");

  enviarFirebase(temp, pres, umid, pulsos, chuva, velMS, rajada, dir, irrad);
}

// ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  loraSerial.begin(9600);

  Serial.println("Receptor LoRa (CSV) iniciado!");
  Serial.println("================================================");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Conexão inicial Wi-Fi");
  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 30) {
    delay(500); Serial.print("."); t++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi OK. IP: "); Serial.println(WiFi.localIP());
    iniciarFirebaseUmaVez();
  } else {
    Serial.println("Sem Wi-Fi no boot — tentará no loop.");
  }
}

// Ignora retransmissões: o nó envia o mesmo pacote 2x seguidas. Se a linha
// for idêntica à última processada há poucos segundos, é cópia — descarta.
bool ehDuplicata(const char* linha) {
  static char ultima[200] = "";
  static unsigned long ultimaMs = 0;
  unsigned long agora = millis();
  if (strcmp(linha, ultima) == 0 && (agora - ultimaMs) < 30000) return true;
  strncpy(ultima, linha, sizeof(ultima) - 1);
  ultima[sizeof(ultima) - 1] = '\0';
  ultimaMs = agora;
  return false;
}

void loop() {
  garantirWifi();

  if (WiFi.status() == WL_CONNECTED && !firebaseIniciado) {
    iniciarFirebaseUmaVez();
  }

  unsigned long agora = millis();
  if (agora - ultimoHeartbeat >= INTERVALO_HEARTBEAT) {
    ultimoHeartbeat = agora;
    enviarHeartbeat();
  }

  while (loraSerial.available()) {
    char c = (char)loraSerial.read();

    if (c == '\r') continue;

    if (c == '\n') {
      rxBuffer[rxPos] = '\0';

      if (rxPos > 0 && strchr(rxBuffer, '*') != NULL) {
        if (ehDuplicata(rxBuffer)) {
          Serial.println("[Dedup] Retransmissão ignorada.");
        } else {
          processarMensagem(rxBuffer);
        }
      } else if (rxPos > 0) {
        Serial.print("[IGNORADA] ");
        Serial.println(rxBuffer);
      }

      rxPos = 0;

    } else if (c >= 32 && c <= 126) {
      if (rxPos < sizeof(rxBuffer) - 1) {
        rxBuffer[rxPos++] = c;
      } else {
        Serial.println("[BUFFER CHEIO — DESCARTADO]");
        rxPos = 0;
      }
    }
  }
}