// ============================================================
// Conexão com o Firebase Realtime Database
// Os dados da estação chegam via LoRa → receptor → Firebase
// ============================================================
import { initializeApp } from 'firebase/app';
import { getDatabase, goOffline, goOnline } from 'firebase/database';

// Só precisamos da URL do banco — a leitura é pública
const configuracaoFirebase = {
  databaseURL: 'https://estacao-meteorologica-479ce-default-rtdb.firebaseio.com',
};

const app = initializeApp(configuracaoFirebase);

// Banco de dados em tempo real, usado pelos hooks
export const bancoDados = getDatabase(app);

/**
 * Força uma reconexão com o Firebase.
 * Usado pela auto-recuperação quando os dados param de chegar.
 */
export function reconectarFirebase() {
  try {
    goOffline(bancoDados);
    goOnline(bancoDados);
  } catch {
    // Se nem isso funcionar, recarrega a página inteira
    window.location.reload();
  }
}
