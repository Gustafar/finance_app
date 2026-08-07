// Package auth implements a minimal, single-password gate for the app: no
// accounts, no sessions in the database — just an HMAC-signed, self-verifying
// token with an expiry baked in.
package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"time"
)

var ErrInvalidToken = errors.New("invalid or expired token")

const TokenTTL = 30 * 24 * time.Hour

// IssueToken returns a token valid for TokenTTL, signed with secret.
func IssueToken(secret string) string {
	expiry := time.Now().Add(TokenTTL).Unix()
	return encode(expiry, sign(expiry, secret))
}

// VerifyToken reports whether token is well-formed, correctly signed with
// secret, and not expired.
func VerifyToken(token, secret string) error {
	expiry, sig, err := decode(token)
	if err != nil {
		return ErrInvalidToken
	}

	if !hmac.Equal(sig, sign(expiry, secret)) {
		return ErrInvalidToken
	}

	if time.Now().Unix() > expiry {
		return ErrInvalidToken
	}

	return nil
}

// CheckPassword compares provided against expected in constant time. An
// empty expected password never matches (auth must be explicitly configured).
func CheckPassword(provided, expected string) bool {
	if expected == "" {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(provided), []byte(expected)) == 1
}

func sign(expiry int64, secret string) []byte {
	mac := hmac.New(sha256.New, []byte(secret))
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(expiry))
	mac.Write(buf)
	return mac.Sum(nil)
}

func encode(expiry int64, sig []byte) string {
	buf := make([]byte, 8, 8+len(sig))
	binary.BigEndian.PutUint64(buf, uint64(expiry))
	buf = append(buf, sig...)
	return base64.RawURLEncoding.EncodeToString(buf)
}

func decode(token string) (expiry int64, sig []byte, err error) {
	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(raw) != 8+sha256.Size {
		return 0, nil, ErrInvalidToken
	}

	expiry = int64(binary.BigEndian.Uint64(raw[:8]))
	return expiry, raw[8:], nil
}
