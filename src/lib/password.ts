import { MIN_PASSWORD_LENGTH } from "@/lib/constants";

// Același set de simboluri ca Supabase Auth (`lower_upper_letters_digits_symbols`).
// Un caracter din afara lui (spațiu, „ș") nu contează ca simbol nici acolo, iar
// formularul ar arăta verde pentru o parolă pe care serverul o respinge.
const SYMBOLS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~\\";

export type PasswordRule = { id: string; label: string; test: (password: string) => boolean };

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `Cel puțin ${MIN_PASSWORD_LENGTH} caractere`,
    test: (p) => p.length >= MIN_PASSWORD_LENGTH,
  },
  { id: "lower", label: "O literă mică", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "O literă mare", test: (p) => /[A-Z]/.test(p) },
  { id: "digit", label: "O cifră", test: (p) => /[0-9]/.test(p) },
  {
    id: "symbol",
    label: "Un simbol, de exemplu ! ? @ # $ %",
    test: (p) => [...p].some((c) => SYMBOLS.includes(c)),
  },
];

export const WEAK_PASSWORD_MESSAGE =
  `Parola trebuie să aibă cel puțin ${MIN_PASSWORD_LENGTH} caractere, ` +
  "cu literă mică, literă mare, cifră și simbol.";

export const PWNED_PASSWORD_MESSAGE =
  "Parola asta apare în liste de parole furate de pe alte site-uri. Alege alta.";

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
