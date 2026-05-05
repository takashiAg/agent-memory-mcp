const secretPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bghp_[A-Za-z0-9_]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /^\s*password\s*[:=]/im,
  /^\s*token\s*[:=]/im,
  /^\s*cookie\s*:/im,
  /^\s*[A-Z0-9_]*(SECRET|PASSWORD|TOKEN|API_KEY)[A-Z0-9_]*\s*=/im
];

export function detectSecret(value: string): string | null {
  const matched = secretPatterns.find((pattern) => pattern.test(value));
  return matched ? "value_looks_like_secret" : null;
}
