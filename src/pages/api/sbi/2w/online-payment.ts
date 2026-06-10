import type {
  NextApiRequest,
  NextApiResponse,
} from "next";


// TOKEN GENERATE

async function getZunoToken() {

  const auth =
    Buffer.from(
      `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
    )
    .toString("base64");


  const response =
    await fetch(
      `${process.env.ZUNO_BASE_URL}/oauth2/token`,
      {

        method:"POST",

        headers:{

          Authorization:
            `Basic ${auth}`,

          "Content-Type":
            "application/x-www-form-urlencoded",

        },

        body:
          "grant_type=client_credentials",

      }
    );


  const data =
    await response.json();


  return data.access_token;

}




export default async function handler(
  req:NextApiRequest,
  res:NextApiResponse
){

 try{


  if(req.method !== "POST"){

    return res.status(405).json({

      success:false,

      message:"Method not allowed"

    });

  }



  // TOKEN


  const token =
    await getZunoToken();



  console.log(
    "TOKEN:",
    token ? "YES":"NO"
  );



  // PAYMENT API


  const response =
    await fetch(

      `${process.env.ZUNO_BASE_URL}/motor-two-wheeler/online-payment-request`,

      {

        method:"POST",


        headers:{


          "Content-Type":
            "application/json",


          Authorization:
            `Bearer ${token}`,


          "x-api-key":
            process.env.ZUNO_X_API_KEY!,

        },


        body:
          JSON.stringify(req.body),


      }

    );



    console.log(
      "PAYMENT STATUS:",
      response.status
    );



    const text =
      await response.text();



    console.log(
      "PAYMENT RAW:",
      text
    );



    let data;


    try{

      data =
        JSON.parse(text);

    }catch{

      data = {
        raw:text
      };

    }



    return res
      .status(response.status)
      .json({

        success:
          response.ok,

        data,

      });




 }catch(error:any){


    console.log(
      "PAYMENT ERROR",
      error
    );



    return res.status(500).json({

      success:false,

      message:
        "Payment failed",

      error:
        error.message

    });


 }


}