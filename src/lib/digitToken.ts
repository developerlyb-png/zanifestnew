// Go Digit "OneAPI" auth — confirmed live: POST /OneAPI/v1/auth with
// DIGIT_USERNAME/DIGIT_PASSWORD (already pre-encrypted by Digit, sent
// as-is) returns a real access_token for our account. Digit's own sample
// showed expiresIn as low as 135s in one response and 604s in another —
// short-lived either way, so callers should fetch a fresh token per
// request rather than caching it.
export async function getDigitToken() {
  const url = `${process.env.DIGIT_BASE_URL}/OneAPI/v1/auth`;

  console.log("DIGIT TOKEN URL:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: process.env.DIGIT_USERNAME,
      password: process.env.DIGIT_PASSWORD,
    }),
  });

  console.log("DIGIT TOKEN STATUS:", response.status);

  const text = await response.text();

  console.log("DIGIT TOKEN RAW:", text);

  const data = JSON.parse(text);

  return data.access_token;
}
