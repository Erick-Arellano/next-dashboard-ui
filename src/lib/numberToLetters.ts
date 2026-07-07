/**
 * Convierte un número flotante a su representación en letras en español
 * (Formato formal de moneda mexicana: PESOS XX/100 M.N.)
 */
export function numeroALetras(num: number): string {
  const unidades = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const decenas = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const especiales: { [key: number]: string } = {
    11: "ONCE", 12: "DOCE", 13: "TRECE", 14: "CATORCE", 15: "QUINCE",
    16: "DIECISEIS", 17: "DIECISIETE", 18: "DIECIOCHO", 19: "DIECINUEVE",
    21: "VEINTIUN", 22: "VEINTIDOS", 23: "VEINTITRES", 24: "VEINTICUATRO",
    25: "VEINTICINCO", 26: "VEINTISEIS", 27: "VEINTISIETE", 28: "VEINTIOCHO",
    29: "VEINTINUEVE"
  };
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SIETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  function convertirGrupo(n: number): string {
    if (n === 0) return "";
    let res = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) {
      if (c === 1 && d === 0 && u === 0) {
        res += "CIEN ";
      } else {
        res += centenas[c] + " ";
      }
    }

    const du = d * 10 + u;
    if (du > 0) {
      if (du in especiales) {
        res += especiales[du] + " ";
      } else {
        if (d > 0) {
          res += decenas[d];
          if (u > 0) res += " Y " + unidades[u];
          res += " ";
        } else if (u > 0) {
          res += unidades[u] + " ";
        }
      }
    }
    return res.trim();
  }

  const parts = num.toFixed(2).split(".");
  const entero = parseInt(parts[0], 10);
  const centavos = parts[1];

  if (entero === 0) {
    return `CERO PESOS ${centavos}/100 M.N.`;
  }

  let letras = "";
  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidadesRestantes = entero % 1000;

  if (millones > 0) {
    if (millones === 1) {
      letras += "UN MILLON ";
    } else {
      letras += convertirGrupo(millones) + " MILLONES ";
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      letras += "UN MIL ";
    } else {
      letras += convertirGrupo(miles) + " MIL ";
    }
  }

  if (unidadesRestantes > 0) {
    letras += convertirGrupo(unidadesRestantes) + " ";
  }

  let final = letras.trim();
  // Ajustar el "UN" al final si termina en "UN" solo (ej. "CIENTO UN PESOS" -> "CIENTO UNO PESOS")
  if (final.endsWith("UN") && !final.endsWith("VEINTIUN")) {
    final = final.slice(0, -2) + "UNO";
  }

  return `${final} PESOS ${centavos}/100 M.N.`;
}
