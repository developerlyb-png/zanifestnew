import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  if (req.method !== "GET") {

    return res.status(405).json({
      message:"Only GET allowed"
    });

  }


  try {


    const { make } = req.query;


    console.log(
      "MODEL REQUEST MAKE",
      make
    );


    // ================= TOKEN =================

    const basicToken = Buffer.from(

      `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`

    ).toString("base64");



    const tokenResponse =
    await axios.post(

      process.env.ZUNO_TOKEN_URL!,

      new URLSearchParams({

        grant_type:"client_credentials"

      }),


      {

        headers:{

          Authorization:
          `Basic ${basicToken}`,

          "Content-Type":
          "application/x-www-form-urlencoded"

        }

      }

    );



    const token =
    tokenResponse.data.access_token;


    console.log("CAR MASTER TOKEN OK");




    // ================= MODEL API =================


    const response =
    await axios.get(


      `${process.env.ZUNO_CAR_MASTER_URL}/model`,


      {

        params:{

          make:make

        },


        headers:{


          Authorization:
          `Bearer ${token}`,


          "x-api-key":
          process.env.ZUNO_CAR_API_KEY,


          "Content-Type":
          "application/json"

        }

      }


    );




    console.log(
      "MODEL RESPONSE",
      response.data
    );



    return res.status(200)
    .json(response.data);



  }

  catch(error:any){



    console.log(
      "CAR MODEL STATUS",
      error.response?.status
    );


    console.log(
      "CAR MODEL ERROR",
      error.response?.data ||
      error.message
    );



    return res.status(500).json({

      message:
      "Model fetch failed",

      error:
      error.response?.data

    });


  }


}