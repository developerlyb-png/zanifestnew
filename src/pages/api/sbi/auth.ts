import type {
  NextApiRequest,
  NextApiResponse,
} from "next";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  try {

    if (req.method !== "POST") {

      return res.status(405).json({
        success:false,
        message:"Method not allowed"
      });

    }


    const clientId =
      process.env.ZUNO_CLIENT_ID!;

    const clientSecret =
      process.env.ZUNO_CLIENT_SECRET!;


    console.log(
      "CLIENT:",
      clientId ? "FOUND" : "MISSING"
    );


    console.log(
      "SECRET:",
      clientSecret ? "FOUND" : "MISSING"
    );


    // BASIC AUTH

    const basicToken =
      Buffer
      .from(
        `${clientId}:${clientSecret}`
      )
      .toString("base64");


    // BODY

    const body =
      new URLSearchParams();


    body.append(
      "grant_type",
      "client_credentials"
    );


    body.append(
      "client_id",
      clientId
    );


    body.append(
      "client_secret",
      clientSecret
    );


    const response =
      await fetch(
        `${process.env.ZUNO_BASE_URL}/oauth2/token`,
        {

          method:"POST",

          headers:{

            Authorization:
              `Basic ${basicToken}`,

            "Content-Type":
              "application/x-www-form-urlencoded",

            "x-api-key":
              process.env.ZUNO_X_API_KEY!,

          },


          body:
            body.toString(),

        }

      );


    console.log(
      "STATUS:",
      response.status
    );


    const data =
      await response.json();


    console.log(
      "TOKEN RESPONSE:",
      data
    );


    return res
    .status(response.status)
    .json(data);


  } catch(error:any) {


    console.log(
      error
    );


    return res.status(500).json({

      success:false,

      error:
        error.message

    });

  }

}