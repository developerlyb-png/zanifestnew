export async function getSbiToken() {
  const url = `${process.env.SBI_BASE_URL}/cld/v1/token`;

  console.log("TOKEN URL:", url);

  console.log("CLIENT ID:", process.env.SBI_CLIENT_ID ? "YES" : "NO");

  console.log("SECRET:", process.env.SBI_CLIENT_SECRET ? "YES" : "NO");

  const response = await fetch(url, {
    method: "GET",

    headers: {
      Accept: "application/json",

      "X-IBM-Client-Id": process.env.SBI_CLIENT_ID!,

      "X-IBM-Client-Secret": process.env.SBI_CLIENT_SECRET!,
    },
  });

  console.log("TOKEN STATUS:", response.status);

  const text = await response.text();

  console.log("TOKEN RAW:", text);

  const data = JSON.parse(text);

  return data.access_token;
}
