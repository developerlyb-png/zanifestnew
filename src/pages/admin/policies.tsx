import React, {
  useEffect,
  useState,
} from "react";

function PoliciesPage() {

  const [policies, setPolicies] =
    useState<any[]>([]);

  useEffect(() => {

    const fetchPolicies =
      async () => {

        try {

          const response =
            await fetch(
              "/api/sbi/2w/get-policies"
            );

          const data =
            await response.json();

          console.log(data);

          if (data.success) {

            setPolicies(
              data.data
            );

          }

        } catch (error) {

          console.log(error);

        }

      };

    fetchPolicies();

  }, []);

  return (

    <div
      style={{
        padding: "30px",
        fontFamily:
          "sans-serif",
      }}
    >

      <h1>
        All Policies
      </h1>

      <table
        border={1}
        cellPadding={10}
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse:
            "collapse",
        }}
      >

        <thead>

          <tr>

            <th>
              Policy Number
            </th>

            <th>
              Customer
            </th>

            <th>
              Vehicle
            </th>

            <th>
              Premium
            </th>

            <th>
              Status
            </th>
<th>PDF</th>
          </tr>

        </thead>

        <tbody>

          {policies.map(
            (policy, index) => (

              <tr key={index}>

                <td>
                  {
                    policy.policyNumber
                  }
                </td>

                <td>
                  {
                    policy.customer
                      ?.fullName
                  }
                </td>

                <td>
                  {
                    policy.vehicle
                      ?.number
                  }
                </td>

                <td>
                  Rs.
                  {
                    policy.premium
                  }
                </td>

                <td>
                  {
                    policy.status
                  }
                </td>
<td>

 <button
  onClick={async () => {

    try {

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
              id: policy._id,
            }),
          }
        );

      // ERROR HANDLE

      if (!response.ok) {

        const errorData =
          await response.json();

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
        `Policy-${policy.policyNumber}.pdf`;

      document.body.appendChild(a);

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
    padding: "10px 20px",
    background: "#ff6600",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  }}
>

  Download

</button>

</td>
              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  );

}

export default PoliciesPage;