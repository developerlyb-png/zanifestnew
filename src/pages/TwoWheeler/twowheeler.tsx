"use client";

import { useEffect, useState } from "react";
import styles from "@/styles/pages/TwoWheeler/twowheel.module.css";
import Image from "next/image";
import scooterImg from "@/assets/motorcycle.png";

import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import UserDetails from "@/components/ui/UserDetails";

import { FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

import AOS from "aos";
import "aos/dist/aos.css";


// YEARS

const currentYear =
    new Date().getFullYear();


const years =
    Array.from(
        { length: 20 },
        (_, i) => currentYear - 1 - i
    );

// MAKES

const makes = [

    { name: "Honda", image: require("@/assets/home/hondacar.png") },

    { name: "Bajaj", image: require("@/assets/home/bajaj logo.png") },

    { name: "TVS", image: require("@/assets/home/tvs logo.png") },

    { name: "Yamaha", image: require("@/assets/home/yamaha.png") },

    { name: "Hero Motorcorp", image: require("@/assets/home/hero (2).png") },

    { name: "Royal Enfield", image: require("@/assets/home/royal logo.png") },

    { name: "Suzuki", image: require("@/assets/home/SuzukiLogo (2).png") },

    { name: "Mahindra", image: require("@/assets/home/Mahindra.png") },

    { name: "KTM", image: require("@/assets/home/ktm.png") },

    { name: "LML", image: require("@/assets/home/lml.png") },

    { name: "Ola", image: require("@/assets/home/ola.png") },

    { name: "Harley Davidson", image: require("@/assets/home/harley.png") },

];











export default function TwoWheeler() {


    const router =
        useRouter();

const [loading, setLoading] = useState(false);

    const [step, setStep] =
        useState<
            "years" |
            "makes" |
            "models" |
            "variants" |
            "vehicleDetails"
        >("years");



    const [selectedYear, setSelectedYear] =
        useState("");

    const [selectedMake, setSelectedMake] =
        useState("");

    const [selectedModel, setSelectedModel] =
        useState("");

    const [models, setModels] =
        useState<any[]>([]);
    const [variants, setVariants] =
        useState<any[]>([]);


    const [selectedVariant, setSelectedVariant] =
        useState("");
        const [idvData,setIdvData] =
useState<any>(null);
    const [showOtherModels, setShowOtherModels] =
        useState(false);
    const [engineNumber, setEngineNumber] =
        useState("");

    const [chassisNumber, setChassisNumber] =
        useState("");



useEffect(() => {

  const rc = localStorage.getItem("bikeRcDetails");

  if (rc) {
    loadVehicleFromVahan(JSON.parse(rc));
  }

}, []);

const loadVehicleFromVahan = async (rc: any) => {

  try {

    setLoading(true);

    localStorage.setItem(
      "vahanExtra",
      JSON.stringify(rc)
    );

    setEngineNumber(rc.engine);
    setChassisNumber(rc.chassis);

    setSelectedYear(
      rc.year?.split("/")[1]
    );

    const makeName =
      rc.brand.toUpperCase();

    setSelectedMake(makeName);

    // MODEL

    const modelRes = await fetch(
      `/api/sbi/2w/master/model?make=${encodeURIComponent(makeName)}`
    );

    const modelJson =
      await modelRes.json();

    const modelList =
      Array.isArray(modelJson)
        ? modelJson
        : modelJson.data || [];

    setModels(modelList);
const rcModel = String(rc.model)
  .toUpperCase()
  .replace(/\(.*?\)/g, "")
  .replace(/\+/g, "PLUS")
  .replace(/XTEC/g, "")
  .replace(/\s+/g, " ")
  .trim();

const matchedModel = modelList.find((x: any) => {
  const apiModel = String(x.model)
    .toUpperCase()
    .replace(/\+/g, "PLUS")
    .replace(/\s+/g, " ")
    .trim();

  return (
    apiModel === rcModel ||
    apiModel.startsWith(rcModel) ||
    rcModel.startsWith(apiModel) ||
    apiModel.includes(rcModel) ||
    rcModel.includes(apiModel)
  );
});

setSelectedModel(matchedModel.model);

    

    // VARIANT

    const variantRes = await fetch(
      `/api/sbi/2w/master/variant?make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(matchedModel.model)}`
    );

    const variantJson =
      await variantRes.json();

    const variantList =
      Array.isArray(variantJson)
        ? variantJson
        : variantJson.data || [];

    setVariants(variantList);

    const matchedVariant =
      variantList.find((x: any) =>
        String(x.variant)
          .toUpperCase()
          .includes(
            String(rc.model).toUpperCase()
          )
      ) || variantList[0];

   if (!matchedVariant) {
  console.log("NO VARIANT FOUND");
  console.log("MODEL =>", matchedModel.model);
  console.log("VARIANT LIST =>", variantList);

  return;
}

setSelectedVariant(matchedVariant.variant);

    // IDV

    const idvRes = await fetch(
      `/api/sbi/2w/master/idv?make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(matchedModel.model)}&variant=${encodeURIComponent(matchedVariant.variant)}&idvCity=MUMBAI`
    );

    const idvJson =
      await idvRes.json();

    setIdvData(idvJson.data);

    // RTO

    const rtoRes = await fetch(
      `/api/sbi/2w/master/rto?idvCity=MUMBAI`
    );

    const rtoJson =
      await rtoRes.json();

    localStorage.setItem(
      "selectedRto",
      JSON.stringify(rtoJson[0])
    );

    setStep("vehicleDetails");

  } catch (e) {

    console.log(e);

  } finally {

    setLoading(false);

  }

};
    useEffect(() => {

        AOS.init({
            duration: 1000,
            once: true
        });

    }, []);




    useEffect(() => {

        AOS.refresh();

    }, [step]);







    return (

        <div>


            <UserDetails />

            <Navbar />




            <div className={styles.container}>



                <div className={styles.leftSection}>


                    <div className={styles.imageWrapper}>


                        <Image

                            src={scooterImg}

                            alt="Scooter"

                            className={styles.image}

                            priority

                        />


                    </div>


                </div>







                <div className={styles.rightSection}>





                    {/* YEAR */}


                    {step === "years" &&


                        <div data-aos="fade-left">


                            <h2 className={styles.question}>

                                When did you buy your Bike/Scooter?

                            </h2>



                            <div className={styles.yearGrid}>
                                <div
                                    className={styles.yearButton}

                                    onClick={() => {

                                        setSelectedYear(
                                            String(currentYear)
                                        );


                                        localStorage.setItem(
                                            "isNewBike",
                                            "true"
                                        );


                                        setStep("makes");

                                    }}

                                >

                                    Brand New Bike  ›

                                </div>

                                {years.map((year) => (


                                    <button

                                        key={year}

                                        className={styles.yearButton}

                                        onClick={() => {


                                            setSelectedYear(
                                                String(year)
                                            );


                                            localStorage.setItem(
                                                "isNewBike",
                                                "false"
                                            );


                                            setStep("makes");


                                        }}

                                    >

                                        {year}

                                    </button>


                                ))}


                            </div>


                        </div>

                    }








                    {/* MAKE */}


                    {step === "makes" &&


                        <div
                            data-aos="fade-left"
                            className={styles.makesWrapper}
                        >


                            <button

                                className={styles.backButton}

                                onClick={() => setStep("years")}

                            >

                                <FaArrowLeft />

                            </button>



                            <h3>
                                Select two wheeler make
                            </h3>



                            <input

                                type="text"

                                placeholder="Search two wheeler make"

                                className={styles.searchInput}

                            />



                            <p className={styles.popularTitle}>

                                Popular makes

                            </p>




                            <div className={styles.grid}>


                                {makes.map((make, index) => (


                                    <div

                                        key={index}

                                        className={styles.makeCard}

                                        onClick={async () => {


                                            const makeName =
                                                make.name.toUpperCase();


                                            setSelectedMake(
                                                makeName
                                            );



                                            const res =
                                                await fetch(
                                                    `/api/sbi/2w/master/model?make=${makeName}`
                                                );


                                            const data =
                                                await res.json();



                                            console.log(
                                                "MODEL DATA",
                                                data
                                            );



                                            console.log(
"MODEL DATA",
data
);


if(Array.isArray(data)){

setModels(data);

}
else if(Array.isArray(data.data)){

setModels(data.data);

}
else{

console.log(
"MODEL API ERROR",
data
);

setModels([]);

}


setStep(
"models"
);



                                            setStep(
                                                "models"
                                            );


                                        }}

                                    >


                                        <div className={styles.makeImageWrapper} />


                                        <span className={styles.makeText}>

                                            {make.name}

                                        </span>


                                    </div>


                                ))}


                            </div>



                            <p className={styles.searchText}>

                                Can’t find your bike’s make? Click here to search

                            </p>


                        </div>


                    }










                    {/* MODELS */}



                    {step === "models" &&


                        <div
                            data-aos="fade-left"
                            className={styles.modelsWrapper}
                        >



                            <button

                                className={styles.backButton}

                                onClick={() => setStep("makes")}

                            >

                                <FaArrowLeft />

                            </button>




                            <h3 className={styles.title}>

                                Select two wheeler model

                            </h3>




                            <input

                                type="text"

                                placeholder={`Search ${selectedMake} two wheeler model`}

                                className={styles.searchInput}

                            />







                            <p className={styles.sectionTitle}>

                                Popular models

                            </p>



                            <div className={styles.grids}>


                                {Array.isArray(models) &&
models.slice(0,6).map((item:any,index:number)=>(


                                    <div

                                        key={index}

                                        className={styles.modelCard}

                                 onClick={async()=>{


setSelectedModel(
item.model
);



const res =
await fetch(
`/api/sbi/2w/master/variant?make=${selectedMake}&model=${item.model}`
);


const data =
await res.json();


console.log(
"VARIANT DATA",
data
);


setVariants(
data
);


setStep(
"variants"
);





                                        }}

                                    >


                                        {item.model}


                                    </div>


                                ))}


                            </div>

                            <p
                                className={styles.sectionTitle}

                                onClick={() => setShowOtherModels(
                                    !showOtherModels
                                )}

                            >

                                Other models

                            </p>


                            {showOtherModels &&

                                <div className={styles.modalOverlay}>


                                    <div className={styles.modelPopup}>


                                        <div className={styles.popupHeader}>


                                            <h3>
                                                Other Models
                                            </h3>


                                            <button
                                                onClick={() => setShowOtherModels(false)}
                                            >
                                                ×
                                            </button>


                                        </div>



                                        <div className={styles.grids}>


                                            {Array.isArray(models) &&
models.slice(6).map((item:any,index:number)=>(


                                                <div

                                                    key={index}

                                                    className={styles.modelCard}


                                                    onClick={async () => {


                                                        setSelectedModel(
                                                            item.model
                                                        );


                                                        // VARIANT API CALL

                                                        const res =
                                                            await fetch(
                                                                `/api/sbi/2w/master/variant?make=${selectedMake}&model=${item.model}`
                                                            );


                                                        const data =
                                                            await res.json();


                                                        console.log(
                                                            "VARIANT DATA",
                                                            data
                                                        );


                                                        setVariants(
                                                            data
                                                        );


                                                        // popup close agar other model se aaye

                                                        setShowOtherModels(false);


                                                        // go to variant page

                                                        setStep(
                                                            "variants"
                                                        );


                                                    }}

                                                >


                                                    {item.model}


                                                </div>


                                            ))}


                                        </div>


                                    </div>


                                </div>


                            }



                            {/* 
<p className={styles.sectionTitle}>

Other models

</p> */}



                            {/* 
<div className={styles.grids}>


{(modelList[selectedMake]?.other || [])
.map((model:any,index:number)=>(


<div

key={index}

className={styles.modelCard}

onClick={()=>{


setSelectedModel(model);


setStep("vehicleDetails");


}}

>

{model}

</div>


))}


</div> */}



                        </div>


                    }





{/* VARIANTS */}


{step==="variants" &&


<div
data-aos="fade-left"
className={styles.modelsWrapper}
>


<button

className={styles.backButton}

onClick={()=>setStep("models")}

>

<FaArrowLeft/>

</button>


<h3 className={styles.title}>

Select Variant

</h3>



<div className={styles.grids}>


{variants.map((item:any,index:number)=>(


<div

key={index}

className={styles.modelCard}


onClick={async()=>{


setSelectedVariant(
item.variant
);



// IDV API CALL
const vehicleNo =
(
localStorage.getItem("vehicleNumber") || ""
)
.toUpperCase()
.replace(/[^A-Z0-9]/g,"");


let idvCity =
"AHMEDABAD";


if(
vehicleNo.startsWith("MH")
){

idvCity =
"MUMBAI";

}

else if(
vehicleNo.startsWith("DL")
){

idvCity =
"DELHI";

}

else if(
vehicleNo.startsWith("GJ")
){

idvCity =
"AHMEDABAD";

}

const res =
await fetch(
`/api/sbi/2w/master/idv?make=${selectedMake}&model=${selectedModel}&variant=${item.variant}&idvCity=${idvCity}`
);


const result =
await res.json();


console.log(
"IDV DATA",
result
);


setIdvData(
result.data
);



// =================
// RTO API CALL
// =================

const rtoRes =
await fetch(
`/api/sbi/2w/master/rto?idvCity=${idvCity}`
);


const rtoResult = await rtoRes.json();

console.log("RTO RESULT =", rtoResult);
console.log("IS ARRAY =", Array.isArray(rtoResult));
console.log("FIRST =", rtoResult[0]);
console.log("DATA =", rtoResult.data);


console.log(
"RTO DATA",
rtoResult
);


const selectedRto =
rtoResult[0];


localStorage.setItem(
"selectedRto",
JSON.stringify(selectedRto)
);




const isNew =
localStorage.getItem(
"isNewBike"
);



if(isNew==="true"){


const vehicleData={


year:selectedYear,


make:selectedMake,


model:selectedModel,


variant:item.variant,

registrationNumber:"",
idv:
result.data?.idvAmount?.upto1Year || "",


fuelType:
result.data?.fuelType || "",


capacity:
result.data?.capacity || "",


seatingCapacity:
result.data?.seatingCapacity || "",


exShowroomPrice:
idvData?.exShowroomPrice,


rto:
JSON.parse(
localStorage.getItem("selectedRto") || "{}"
),


// OLD DATA


isNewBike:"true",


engineNumber:"",


chassisNumber:""


};



console.log(
"FINAL BIKE DATA",
vehicleData
);



localStorage.setItem(

"selectedBikeData",

JSON.stringify(vehicleData)

);



router.push(
"./twowheeler5"
);





}

else{


setStep(
"vehicleDetails"
);


}


}}

>


{item.variant}


</div>


))}


</div>


</div>


}





                    {/* ENGINE + CHASSIS */}



                    {step === "vehicleDetails" &&


                        <div

                            data-aos="fade-left"

                            className={styles.modelsWrapper}

                        >



                            <button

                                className={styles.backButton}

                                onClick={() => setStep("models")}

                            >

                                <FaArrowLeft />

                            </button>




                            <h3>

                                Enter Vehicle Details

                            </h3>




                            <input

                                type="text"

                                placeholder="Engine Number"

                                className={styles.searchInput}

                                value={engineNumber}

                                onChange={(e) =>
                                    setEngineNumber(
                                        e.target.value
                                    )
                                }

                            />




                            <input

                                type="text"

                                placeholder="Chassis Number"

                                className={styles.searchInput}

                                value={chassisNumber}

                                onChange={(e) =>
                                    setChassisNumber(
                                        e.target.value
                                    )
                                }

                            />





                            <button

                                className={styles.yearButton}

                                onClick={() => {


          // Safe RTO Parse
const storedRto = localStorage.getItem("selectedRto");

let rto = {};

try {
  if (
    storedRto &&
    storedRto !== "undefined" &&
    storedRto !== "null"
  ) {
    rto = JSON.parse(storedRto);
  }
} catch (err) {
  console.error("Invalid selectedRto:", storedRto);
  rto = {};
}

const vehicleData = {

  year: selectedYear,

  make: selectedMake,

  model: selectedModel,

  // MASTER VARIANT DATA
  variant: selectedVariant,

  idv: idvData?.idvAmount?.upto1Year,

  fuelType: idvData?.fuelType,

  capacity: idvData?.capacity,

  seatingCapacity: idvData?.seatingCapacity,

  exShowroomPrice: idvData?.exShowroomPrice,

  // OLD DATA

  registrationNumber: localStorage.getItem("vehicleNumber"),

  isNewBike: localStorage.getItem("isNewBike"),

  engineNumber,

  chassisNumber,

  rto: rto

};

console.log("FINAL SAVE BIKE DATA", vehicleData);

localStorage.setItem(
  "selectedBikeData",
  JSON.stringify(vehicleData)
);

router.push("./twowheeler5");

console.log(
"FINAL SAVE BIKE DATA",
vehicleData
);



                                    localStorage.setItem(

                                        "selectedBikeData",

                                        JSON.stringify(vehicleData)

                                    );




                                    router.push(
                                        "./twowheeler5"
                                    );



                                }}

                            >

                                Continue

                            </button>



                        </div>


                    }





                </div>


            </div>




            <Footer />


        </div>


    );


}