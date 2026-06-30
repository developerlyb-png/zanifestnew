import type {
  NextApiRequest,
  NextApiResponse,
} from "next";


// =====================
// GET TOKEN
// =====================

async function getZunoToken() {

  const basicAuth =
    Buffer.from(
      `${process.env.ZUNO_CLIENT_ID}:${process.env.ZUNO_CLIENT_SECRET}`
    ).toString("base64");


  const response =
    await fetch(
      process.env.ZUNO_TOKEN_URL!,
      {
        method: "POST",

        headers: {

          Authorization:
            `Basic ${basicAuth}`,

          "Content-Type":
            "application/x-www-form-urlencoded"

        },

        body:
          "grant_type=client_credentials"
      }
    );


  const data =
    await response.json();


  console.log(
    "ZUNO TOKEN RESPONSE",
    data
  );


 return `${data.token_type} ${data.access_token}`;
}






export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {


  try {


    if (req.method !== "POST") {

      return res.status(405).json({
        success: false,
        message: "Only POST allowed"
      });

    }



    const {
      vehicleData,
      rcDetails
    } = req.body;




    if (!vehicleData) {

      return res.status(400).json({
        success:false,
        message:"Vehicle missing"
      });

    }




    const token =
      await getZunoToken();



    if (!token) {

      return res.status(401).json({
        success:false,
        message:"Token failed"
      });

    }




    const today =
      new Date()
      .toISOString()
      .split("T")[0];




    const payload = {


      channelCode:"002",

      branch:"Mumbai",



      make:
      vehicleData.brand,


      model:
      vehicleData.model,


      variant:
      (vehicleData.variant || "")
      .replace(/\s+/g," ")
      .replace("1. 2","1.2")
      .trim(),


      fuelType:
      vehicleData.fuel,


      transmissionType:
      "Manual",




      rtoLocationName:
      rcDetails?.rto_code || "",


      rtoCityOrDistrict:
      rcDetails?.reg_authority || "",




      registrationDate:
      convertDate(rcDetails?.reg_date),


      dateOfFirstPurchaseOrRegistration:
      convertDate(rcDetails?.reg_date),


      policyStartDate:
      today,


      dateOfTransaction:
      today,




      previousInsurancePolicy:"0",

      previousPolicyExpiryDate:"",

      typeOfBusiness:"Roll Over",

      renewalStatus:"Renewal",

      policyType:"Package Policy",

      policyTenure:"1",

      contractTenure:"1.0",

      subPolicyType:"",

      breakinInsurance:"NBK",




      bodystyleDescription:
      rcDetails?.body_type || "",


      annualMileage:"10000",


      idv:
      vehicleData?.idv || "0",





      dateOfBirth:"1995-01-01",

      policyHolderGender:"Male",

      policyholderOccupation:
      "Medium to High",

      typeOfGrid:"Grid 1",





      transferOfNcb:"N",

      transferOfNcbPercentage:"",

      proofProvidedForNcb:"",

      overrideAllowableDiscount:"N",

      fibreGlassFuelTank:"N",

      antiTheftDeviceInstalled:"N",

      automobileAssociationMember:"N",





      contractDetails:[

        {

          contract:
          "Own Damage Contract",


          coverage:{

            coverage:
            "Own Damage Coverage",

            subCoverage:[

              {

                subCoverage:
                "Own Damage Basic",

                limit:
                "Own Damage Basic Limit"

              }

            ]

          }

        }

      ]


    };





    console.log(
      "QUOTE AUTH",
      {
        url:
        `${process.env.ZUNO_BASE_URL}/motor/quote`,

        token:
        token.substring(0,20),

        apiKey:
        process.env.ZUNO_X_API_KEY ? "FOUND":"MISSING"
      }
    );






    const quoteResponse =
      await fetch(
        `${process.env.ZUNO_BASE_URL}/motor/quote`,
        {

          method:"POST",


          headers:{

            "Content-Type":
            "application/json",


            "x-api-key":
            process.env.ZUNO_X_API_KEY!,


            // HIZUNO TOKEN
            Authorization:
            token

          },


          body:
          JSON.stringify(payload)

        }
      );





    const result =
      await quoteResponse.json();




    console.log(
      "ZUNO 4W RESPONSE",
      result
    );




    if (!quoteResponse.ok) {

      return res.status(400).json({
        success:false,
        error:result
      });

    }





    return res.status(200).json({

      success:true,

      quote:
      result

    });





  }

  catch(error:any){


    console.log(
      "QUOTE ERROR",
      error
    );


    return res.status(500).json({

      success:false,

      message:
      error.message

    });

  }


}







function convertDate(date?:string){


if(!date)
return "";


const arr =
date.split("-");


if(arr.length!==3)
return date;


return `${arr[2]}-${arr[1]}-${arr[0]}`;

}