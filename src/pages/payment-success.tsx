import React, {
  useEffect,
  useRef,
  useState,
} from "react";

function PaymentSuccess() {

  const [policyData, setPolicyData] =
    useState<any>(null);

  const hasIssued =
    useRef(false);

  useEffect(() => {

    // STRICT MODE FIX

    if (hasIssued.current)
      return;

    hasIssued.current = true;

    const issuePolicy = async () => {

      try {

        // GET LOCAL STORAGE DATA

        const proposalData =
          JSON.parse(
            localStorage.getItem(
              "proposalData"
            ) || "{}"
          );

        const selectedPlan =
          JSON.parse(
            localStorage.getItem(
              "selectedInsurancePlan"
            ) || "{}"
          );

        // ISSUE POLICY API

        const response =
          await fetch(
            "/api/sbi/2w/issue-policy",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({


fullQuote:
selectedPlan.zunoQuote,



customer:{

fullName:
selectedPlan?.customer?.fullName,

mobile:
selectedPlan?.customer?.mobile,

email:
selectedPlan?.customer?.email

},




vehicle:{


registrationNumber:
selectedPlan?.bikeData?.vehicleNumber,


make:
selectedPlan?.bikeData?.make,


model:
selectedPlan?.bikeData?.model,


variant:
selectedPlan?.bikeData?.variant,


engineNumber:
selectedPlan?.bikeData?.isNewBike
?
"NA"
:
selectedPlan?.bikeData?.engineNumber,


chassisNumber:
selectedPlan?.bikeData?.isNewBike
?
"NA"
:
selectedPlan?.bikeData?.chassisNumber,


},




premium:{


amount:
selectedPlan?.premium


}



}),
            }
          );

        const data =
          await response.json();

        console.log(
          "ISSUE POLICY RESPONSE:",
          data
        );

        if (data.success) {

          // SAVE POLICY DATA

          setPolicyData(
            data.data
          );

        }

      } catch (error) {

        console.log(error);

      }

    };

    issuePolicy();

  }, []);

  return (

    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        fontFamily: "sans-serif",
      }}
    >

      <h1>
        ✅ Payment Successful
      </h1>

      <p>
        Your SBI Bike Insurance
        policy has been issued.
      </p>

      {policyData && (

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >

          <h3>
            Policy Number:
          </h3>

          <p>
            {
              policyData.policyNumber
            }
          </p>

          <p>
            Customer:
            {" "}
            {
              policyData.customer
                ?.fullName
            }
          </p>

          <p>
            Mongo ID:
            {" "}
            {
              policyData._id
            }
          </p>

        </div>

      )}

      <button

        onClick={async () => {

          try {

            // CHECK ID

            console.log(
              "DOWNLOADING ID:",
              policyData?._id
            );

            // DOWNLOAD API

            const response =
              await fetch(
                "/api/sbi/2w/download-policy",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({

                    id:
                      policyData?._id,

                  }),

                }
              );

            // HANDLE ERROR

            if (!response.ok) {

              const errorData =
                await response.json();

              console.log(
                errorData
              );

              alert(
                errorData.message ||
                "Download failed"
              );

              return;

            }

            // PDF BLOB

            const blob =
              await response.blob();

            // CREATE URL

            const url =
              window.URL.createObjectURL(
                blob
              );

            // CREATE LINK

            const a =
              document.createElement("a");

            a.href = url;

            a.download =
              `Policy-${policyData?.policyNumber}.pdf`;

            document.body.appendChild(
              a
            );

            a.click();

            a.remove();

            // CLEANUP

            window.URL.revokeObjectURL(
              url
            );

          } catch (error) {

            console.log(error);

            alert(
              "Something went wrong"
            );

          }

        }}

        style={{
          padding: "12px 25px",
          background: "#ff6600",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginTop: "20px",
        }}

      >

        Download Policy PDF

      </button>

    </div>

  );

}

export default PaymentSuccess;