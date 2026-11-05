<?php

namespace App\Modules\Account\Services;

class TotpService
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public function generateSecret(int $length = 32): string
    {
        $secret = '';
        $max = strlen(self::ALPHABET) - 1;
        for ($index = 0; $index < $length; $index++) {
            $secret .= self::ALPHABET[random_int(0, $max)];
        }
        return $secret;
    }

    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $code = preg_replace('/\s+/', '', $code);
        if (! preg_match('/^\d{6}$/', $code)) return false;
        $timeSlice = (int) floor(time() / 30);
        for ($offset = -$window; $offset <= $window; $offset++) {
            if (hash_equals($this->code($secret, $timeSlice + $offset), $code)) return true;
        }
        return false;
    }

    public function provisioningUri(string $issuer, string $email, string $secret): string
    {
        $label = rawurlencode($issuer.':'.$email);
        return "otpauth://totp/{$label}?secret={$secret}&issuer=".rawurlencode($issuer).'&algorithm=SHA1&digits=6&period=30';
    }

    private function code(string $secret, int $timeSlice): string
    {
        $hash = hash_hmac('sha1', pack('N*', 0, $timeSlice), $this->decode($secret), true);
        $offset = ord($hash[19]) & 0x0f;
        $value = ((ord($hash[$offset]) & 0x7f) << 24) | ((ord($hash[$offset + 1]) & 0xff) << 16) | ((ord($hash[$offset + 2]) & 0xff) << 8) | (ord($hash[$offset + 3]) & 0xff);
        return str_pad((string) ($value % 1000000), 6, '0', STR_PAD_LEFT);
    }

    private function decode(string $secret): string
    {
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret));
        $buffer = 0; $bits = 0; $result = '';
        foreach (str_split($secret) as $character) {
            $buffer = ($buffer << 5) | strpos(self::ALPHABET, $character);
            $bits += 5;
            if ($bits >= 8) { $bits -= 8; $result .= chr(($buffer >> $bits) & 0xff); }
        }
        return $result;
    }
}
