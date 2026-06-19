import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {


  if(req.method !== "GET"){

    return res.status(405).json({
      message:"Only GET allowed"
    });

  }


  try{


    const {
      make,
      model
    } = req.query;



    console.log(
      "VARIANT REQUEST",
      make,
      model
    );



    // ============ TOKEN ============


    const basicToken =
    Buffer.from(

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



    console.log(
      "VARIANT TOKEN OK"
    );




    // ============ ZUNO VARIANT ============


    const response =
    await axios.get(


      `${process.env.ZUNO_CAR_MASTER_URL}/variant`,


      {

        params:{

          make,
          model

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
      "VARIANT RESPONSE",
      JSON.stringify(
        response.data,
        null,
        2
      )
    );




    return res.status(200)
    .json(response.data);




  }

  catch(error:any){


    console.log(
      "VARIANT ERROR",
      error.response?.data ||
      error.message
    );



    return res.status(500).json({

      message:"Variant failed",

      error:error.response?.data

    });


  }


}