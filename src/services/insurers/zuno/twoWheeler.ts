const BASE_URL =
  "https://devapi.hizuno.com/motor-two-wheeler";


const headers = () => ({

  "Content-Type":
    "application/json",

  "x-api-key":
    process.env.ZUNO_X_API_KEY || "",

  "client_id":
    process.env.ZUNO_CLIENT_ID || "",

});



const ZunoTwoWheeler = {



  // QUICK QUOTE

  async quote(payload:any){

    const response =
      await fetch(
        `${BASE_URL}/rating`,
        {

          method:"POST",

          headers:headers(),

          body:
          JSON.stringify(payload)

        }
      );


    return await response.json();

  },




  // FULL QUOTE

  async fullQuote(payload:any){

    const response =
      await fetch(
        `${BASE_URL}/full-quote`,
        {

          method:"POST",

          headers:headers(),

          body:
          JSON.stringify(payload)

        }
      );


    return await response.json();

  },





  // ISSUE POLICY

  async issuePolicy(payload:any){


    const response =
      await fetch(
        `${BASE_URL}/issue-policy`,
        {

          method:"POST",

          headers:headers(),

          body:
          JSON.stringify(payload)

        }
      );


      return await response.json();


  },






  // ONLINE PAYMENT


  async onlinePayment(payload:any){


    const response =
      await fetch(
        `${BASE_URL}/online-payment-request`,
        {

          method:"POST",

          headers:headers(),

          body:
          JSON.stringify(payload)

        }
      );


    return await response.json();

  },







  // PDF GENERATION


  async generatePdf(payload:any){


    const response =
      await fetch(
        `${BASE_URL}/pdf-generation`,
        {

          method:"POST",

          headers:headers(),

          body:
          JSON.stringify(payload)

        }
      );


    return await response.json();

  }



};


export default ZunoTwoWheeler;